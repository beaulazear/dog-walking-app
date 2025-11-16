class RouteOptimizerService
  WALKING_SPEED_MPH = 3.0 # Average walking speed
  PICKUP_TIME_MINUTES = 5 # Time to pick up a dog
  DROPOFF_TIME_MINUTES = 2 # Time to drop off a dog

  # Optimize the route for a set of appointments considering group walks
  # Group walks have pickup and drop-off phases
  #
  # @param appointments [ActiveRecord::Relation] - Collection of appointments to optimize
  # @param start_location [Hash, nil] - Optional starting location { lat:, lng: }
  # @return [Hash] - Optimized route with stops, total distance, total time, and path
  def self.optimize_route(appointments, start_location: nil)
    # Filter to only geocoded appointments
    geocoded_appointments = appointments.select { |a| a.pet&.geocoded? }

    return empty_route_response if geocoded_appointments.empty?

    # Separate appointments into groups and solo walks
    groups, solo_walks = categorize_appointments(geocoded_appointments)

    # Build optimized route with pickup/dropoff phases
    route_stops = build_optimized_route(groups, solo_walks, start_location)

    # Calculate route metrics
    path_coordinates = route_stops.map { |stop| stop[:coordinates] }
    total_distance = DistanceCalculator.total_route_distance(path_coordinates)
    travel_time = calculate_travel_time(total_distance)

    # Calculate walk time (only count each appointment once)
    walk_time = geocoded_appointments.sum { |a| a.duration || 30 }
    total_time = travel_time + walk_time

    # Build route response
    {
      route: route_stops,
      total_distance: total_distance.round(2),
      total_travel_time: travel_time.round,
      total_walk_time: walk_time,
      total_time: total_time.round,
      path_coordinates: path_coordinates,
      optimized: true,
      groups_count: groups.length,
      solo_count: solo_walks.length
    }
  end

  # Calculate optimal route for appointments and compare to original order
  # Returns comparison metrics showing improvement
  def self.optimize_and_compare(appointments, start_location: nil)
    # Get original route metrics (simple path without pickup/dropoff logic)
    original_coords = appointments.select { |a| a.pet&.geocoded? }.map do |a|
      { lat: a.pet.latitude, lng: a.pet.longitude }
    end
    original_distance = DistanceCalculator.total_route_distance(original_coords)
    original_time = calculate_travel_time(original_distance)

    # Get optimized route
    optimized = optimize_route(appointments, start_location: start_location)

    # Calculate improvement
    distance_saved = original_distance - optimized[:total_distance]
    time_saved = original_time - optimized[:total_travel_time]
    improvement_percent = original_distance.positive? ? ((distance_saved / original_distance) * 100).round(1) : 0

    optimized.merge({
                      comparison: {
                        original_distance: original_distance.round(2),
                        original_time: original_time.round,
                        distance_saved: distance_saved.round(2),
                        time_saved: time_saved.round,
                        improvement_percent: improvement_percent
                      }
                    })
  end

  # Categorize appointments into groups and solo walks
  # Also auto-groups nearby appointments without walk_group_id
  def self.categorize_appointments(appointments)
    manual_groups = {}
    true_solo_walks = []
    ungrouped_group_walks = []

    # First pass: separate into manual groups, solo walks, and ungrouped group walks
    appointments.each do |appt|
      if appt.walk_group_id
        # Manually grouped
        manual_groups[appt.walk_group_id] ||= []
        manual_groups[appt.walk_group_id] << appt
      elsif is_solo_walk?(appt)
        # True solo walk (walk_type = "solo" or solo = true)
        true_solo_walks << appt
      else
        # Group walk type but not grouped yet - candidate for auto-grouping
        ungrouped_group_walks << appt
      end
    end

    Rails.logger.info '=== Appointment Categorization ==='
    Rails.logger.info "Manual groups: #{manual_groups.keys.length} groups, #{manual_groups.values.flatten.length} appointments"
    Rails.logger.info "True solo walks: #{true_solo_walks.length}"
    Rails.logger.info "Ungrouped group walks: #{ungrouped_group_walks.length}"

    # Auto-group the ungrouped group walks by proximity and time
    begin
      Rails.logger.info 'Starting auto-grouping...'
      auto_groups = auto_group_appointments(ungrouped_group_walks)
      Rails.logger.info "Created #{auto_groups.length} auto-groups from ungrouped appointments"
    rescue StandardError => e
      Rails.logger.error "FATAL ERROR in categorize_appointments auto-grouping: #{e.message}"
      Rails.logger.error e.backtrace.join("\n")
      # Fallback: treat each ungrouped walk as its own group
      auto_groups = ungrouped_group_walks.map { |a| [a] }
      Rails.logger.info "Fallback: created #{auto_groups.length} individual groups"
    end

    # Combine manual groups and auto-groups
    all_groups = manual_groups.values + auto_groups

    [all_groups, true_solo_walks]
  end

  # Check if an appointment is a true solo walk
  def self.is_solo_walk?(appointment)
    # Check walk_type field or solo boolean (if it exists)
    return true if appointment.walk_type == 'solo'
    return true if appointment.respond_to?(:solo) && appointment.solo == true

    false
  rescue StandardError => e
    Rails.logger.error "Error checking if appointment #{appointment.id} is solo: #{e.message}"
    false
  end

  # Auto-group appointments by proximity and overlapping time windows
  def self.auto_group_appointments(appointments, max_distance_miles: 0.5)
    return [] if appointments.empty?

    groups = []
    remaining = appointments.dup

    while remaining.any?
      # Start a new group with the first remaining appointment
      seed = remaining.shift
      current_group = [seed]

      # Find all appointments that can be grouped with the seed
      candidates = remaining.dup
      candidates.each do |candidate|
        # Check if candidate is close enough to any appointment in current group
        can_group = current_group.any? do |grouped_appt|
          # Skip if either pet doesn't have coordinates
          next false unless grouped_appt.pet&.latitude && grouped_appt.pet.longitude
          next false unless candidate.pet&.latitude && candidate.pet.longitude

          distance = DistanceCalculator.distance_between(
            grouped_appt.pet.latitude,
            grouped_appt.pet.longitude,
            candidate.pet.latitude,
            candidate.pet.longitude
          )

          # Check distance and time window overlap
          distance_ok = distance && distance <= max_distance_miles
          time_ok = time_windows_overlap?(grouped_appt, candidate)

          distance_ok && time_ok
        end

        if can_group
          current_group << candidate
          remaining.delete(candidate)
        end
      rescue StandardError => e
        Rails.logger.error "Error grouping appointment #{candidate.id}: #{e.message}"
      end

      # Add the group if it has at least 2 appointments, otherwise treat as individual group
      if current_group.length >= 2
        groups << current_group
        Rails.logger.info "Auto-grouped #{current_group.length} appointments: #{current_group.map do |a|
          a.pet.name
        end.join(', ')}"
      else
        # Single appointment that couldn't be grouped - add as individual group
        groups << [seed]
        Rails.logger.info "Couldn't group #{seed.pet.name} - adding as individual group"
      end
    end

    groups
  rescue StandardError => e
    Rails.logger.error "Error in auto_group_appointments: #{e.message}"
    Rails.logger.error e.backtrace.join("\n")
    # Return ungrouped appointments as individual groups
    appointments.map { |a| [a] }
  end

  # Check if two appointments have overlapping time windows
  def self.time_windows_overlap?(appt1, appt2)
    start1 = parse_time(appt1.start_time)
    end1 = parse_time(appt1.end_time)
    start2 = parse_time(appt2.start_time)
    end2 = parse_time(appt2.end_time)

    return false unless start1 && end1 && start2 && end2

    # Windows overlap if start1 < end2 AND start2 < end1
    start1 < end2 && start2 < end1
  rescue StandardError => e
    Rails.logger.error "Error checking time overlap for appointments #{appt1.id} and #{appt2.id}: #{e.message}"
    false
  end

  # Build optimized route considering pickup/dropoff for groups and time windows
  def self.build_optimized_route(groups, solo_walks, start_location)
    route_stops = []
    current_location = start_location

    # Create "walk units" - each unit is either a group or a solo walk
    walk_units = []

    # Add groups with their earliest and latest possible times
    groups.each do |group_appointments|
      # Group window = earliest start_time to latest end_time across all appointments
      earliest_start = group_appointments.map { |a| parse_time(a.start_time) }.compact.min
      latest_end = group_appointments.map { |a| parse_time(a.end_time) }.compact.max

      walk_units << {
        type: :group,
        appointments: group_appointments,
        earliest_pickup: earliest_start,
        latest_pickup: latest_end
      }
    end

    # Add solo walks with their time windows
    solo_walks.each do |appt|
      walk_units << {
        type: :solo,
        appointments: [appt],
        earliest_pickup: parse_time(appt.start_time),
        latest_pickup: parse_time(appt.end_time)
      }
    end

    # Find the earliest appointment start time to begin our day
    all_start_times = walk_units.map { |u| u[:earliest_pickup] }.compact
    current_time = all_start_times.min || (Time.current.beginning_of_day + 8.hours)

    # Sort walk units by earliest pickup time, then optimize order within time constraints
    ordered_units = optimize_walk_units_order_with_time(walk_units, current_location, current_time)

    # Build route stops for each unit
    ordered_units.each do |unit|
      if unit[:type] == :group
        # Group walk: pickup all, walk together, drop off all
        stops = build_group_route_stops(unit[:appointments], current_location)
        route_stops.concat(stops)

        # Update current location to last drop-off
        current_location = stops.last[:coordinates] if stops.any?
      else
        # Solo walk: single pickup/dropoff at same location
        appt = unit[:appointments].first
        stop = format_route_stop(appt, :solo)
        route_stops << stop
        current_location = stop[:coordinates]
      end
    end

    route_stops
  end

  # Optimize the order of walk units considering TIME WINDOWS
  def self.optimize_walk_units_order_with_time(walk_units, start_location, start_time)
    return walk_units if walk_units.empty?

    # Sort by earliest pickup time first (chronological scheduling)
    sorted_units = walk_units.sort_by { |unit| unit[:earliest_pickup] || Time.current }

    # Now refine the order: if we can swap adjacent units to reduce travel without violating time windows, do it
    optimized = []
    current_time = start_time
    current_location = start_location

    sorted_units.each do |unit|
      # Find first appointment location in this unit
      first_appt = unit[:appointments].first
      unit_location = {
        lat: first_appt.pet.latitude,
        lng: first_appt.pet.longitude
      }

      # Calculate travel time to this unit
      travel_time_minutes = if current_location
                              distance = DistanceCalculator.distance_between(
                                current_location[:lat],
                                current_location[:lng],
                                unit_location[:lat],
                                unit_location[:lng]
                              )
                              calculate_travel_time(distance || 0)
                            else
                              0
                            end

      # Arrival time at this unit
      arrival_time = current_time + travel_time_minutes.minutes

      # Check if we arrive before the pickup window opens
      current_time = if unit[:earliest_pickup] && arrival_time < unit[:earliest_pickup]
                       # We're early - wait until window opens
                       unit[:earliest_pickup]
                     else
                       arrival_time
                     end

      # Check if we can still make the pickup within the window
      if unit[:latest_pickup] && current_time > unit[:latest_pickup]
        # We're late! This shouldn't happen, but log it
        Rails.logger.warn("Cannot make pickup within window for unit #{unit[:appointments].map(&:id)}")
      end

      # Add time for this walk unit
      if unit[:type] == :group
        # Pickup time + walk duration + dropoff time
        pickup_time = unit[:appointments].length * 5 # 5 min per pickup
        walk_duration = unit[:appointments].first.duration || 30
        dropoff_time = unit[:appointments].length * 2 # 2 min per dropoff
        current_time += (pickup_time + walk_duration + dropoff_time).minutes
      else
        # Solo walk duration
        walk_duration = unit[:appointments].first.duration || 30
        current_time += walk_duration.minutes
      end

      # Update location
      last_appt = unit[:appointments].last
      current_location = {
        lat: last_appt.pet.latitude,
        lng: last_appt.pet.longitude
      }

      optimized << unit
    end

    optimized
  end

  # OLD METHOD - Keep for reference but not used anymore
  def self.optimize_walk_units_order(walk_units, start_location)
    return walk_units if walk_units.empty?

    unvisited = walk_units.dup
    route = []
    current_location = start_location

    # If no start location, use the first unit's first appointment
    unless current_location
      first_unit = unvisited.shift
      route << first_unit
      first_appt = first_unit[:appointments].first
      current_location = {
        lat: first_appt.pet.latitude,
        lng: first_appt.pet.longitude
      }
    end

    # Continue until all units are routed
    while unvisited.any?
      nearest_unit = find_nearest_walk_unit(current_location, unvisited)
      route << nearest_unit
      unvisited.delete(nearest_unit)

      # Update current location to the last appointment in this unit
      last_appt = nearest_unit[:appointments].last
      current_location = {
        lat: last_appt.pet.latitude,
        lng: last_appt.pet.longitude
      }
    end

    route
  end

  # Find the nearest walk unit to the current location
  def self.find_nearest_walk_unit(current_location, walk_units)
    walk_units.min_by do |unit|
      first_appt = unit[:appointments].first
      DistanceCalculator.distance_between(
        current_location[:lat],
        current_location[:lng],
        first_appt.pet.latitude,
        first_appt.pet.longitude
      ) || Float::INFINITY
    end
  end

  # Build route stops with CONSTRAINT-BASED GREEDY algorithm
  # At each step, evaluate all possible actions and choose the one with lowest cost
  # Enforces: pickup windows, ±10 min walk flexibility, max 4 dogs, overdue handling
  def self.build_group_route_stops(group_appointments, start_location)
    stops = []
    temp_group_id = group_appointments.first.walk_group_id || "temp_group_#{group_appointments.first.id}"

    Rails.logger.info "=== Building CONSTRAINT-BASED route for #{group_appointments.length} appointments ==="

    # Initialize: Start from earliest window for route planning
    # Only use current time if we're within the day's pickup windows (for real-time re-routing)
    earliest_window = group_appointments.map { |a| parse_time(a.start_time) }.compact.min
    latest_window = group_appointments.map { |a| parse_time(a.end_time) }.compact.max

    # If current time is within the pickup window range, start from current time (mid-day re-routing)
    # Otherwise, start from earliest window (planning the route)
    if earliest_window && latest_window && Time.current >= earliest_window && Time.current <= latest_window
      current_time = Time.current
      Rails.logger.info '📍 Mid-day re-routing: starting from current time'
    else
      current_time = earliest_window || Time.current
      Rails.logger.info '📋 Route planning: starting from earliest window'
    end

    current_location = start_location || {
      lat: group_appointments.first.pet.latitude,
      lng: group_appointments.first.pet.longitude
    }

    remaining_appointments = group_appointments.dup
    currently_walking = []
    pickup_start_times = {} # When pickup STARTED (walk timer begins here)

    Rails.logger.info "Starting at #{current_time.strftime('%H:%M')}"

    # MAIN LOOP: Constraint-based greedy decision making
    while remaining_appointments.any? || currently_walking.any?

      # 1. CHECK FOR OVERDUE DOGS (MUST drop off immediately)
      overdue_dogs = currently_walking.select do |appt|
        elapsed_minutes = ((current_time - pickup_start_times[appt.id]) / 60.0).round
        target_duration = appt.duration || 30
        elapsed_minutes > (target_duration + 10) # Over max allowed time
      end

      if overdue_dogs.any?
        # URGENT: Drop off immediately, no cost evaluation needed
        appt = overdue_dogs.first

        travel_time = calculate_travel_time_between_locations(
          current_location,
          { lat: appt.pet.latitude, lng: appt.pet.longitude }
        )
        current_time += travel_time.minutes

        stop = format_route_stop(appt, :dropoff)
        stop[:walk_group_id] ||= temp_group_id
        stop[:actual_dropoff_time] = current_time
        stops << stop

        elapsed = ((current_time - pickup_start_times[appt.id]) / 60.0).round
        Rails.logger.warn "⚠️ URGENT dropoff #{appt.pet.name} (OVERDUE: #{elapsed} min)"

        current_time += DROPOFF_TIME_MINUTES.minutes
        current_location = { lat: appt.pet.latitude, lng: appt.pet.longitude }
        currently_walking.delete(appt)
        next
      end

      # 2. EVALUATE ALL POSSIBLE ACTIONS
      actions = []

      # OPTION A: Drop off dogs within acceptable range (duration ±10 min)
      droppable_dogs = currently_walking.select do |appt|
        elapsed_minutes = ((current_time - pickup_start_times[appt.id]) / 60.0).round
        target_duration = appt.duration || 30
        elapsed_minutes >= (target_duration - 10) && elapsed_minutes <= (target_duration + 10)
      end

      droppable_dogs.each do |appt|
        cost = calculate_dropoff_cost(
          appt,
          current_location,
          current_time,
          pickup_start_times,
          currently_walking,
          remaining_appointments
        )
        actions << { type: :dropoff, appointment: appt, cost: cost }
      end

      # OPTION B: Pick up dogs within their pickup window
      if currently_walking.length < 4 # Enforce max pack size
        pickupable_dogs = remaining_appointments.select do |appt|
          start_window = parse_time(appt.start_time)
          end_window = parse_time(appt.end_time)
          # HARD CONSTRAINT: Must be within pickup window
          current_time >= start_window && current_time <= end_window
        end

        # Evaluate top 3 closest pickupable dogs
        closest_pickupable = pickupable_dogs.sort_by do |appt|
          DistanceCalculator.distance_between(
            current_location[:lat],
            current_location[:lng],
            appt.pet.latitude,
            appt.pet.longitude
          ) || 100.0
        end.take(3)

        closest_pickupable.each do |appt|
          cost = calculate_pickup_cost(
            appt,
            current_location,
            current_time,
            pickup_start_times,
            currently_walking,
            remaining_appointments
          )
          actions << { type: :pickup, appointment: appt, cost: cost }
        end
      end

      # 3. CHOOSE LOWEST COST ACTION
      if actions.empty?
        # No valid actions - need to advance time to next event
        next_events = []

        # When can we drop off the next dog?
        if currently_walking.any?
          currently_walking.each do |appt|
            elapsed_minutes = ((current_time - pickup_start_times[appt.id]) / 60.0).round
            target_duration = appt.duration || 30
            min_walk_time = target_duration - 10

            next unless elapsed_minutes < min_walk_time

            # Calculate when this dog will be droppable
            minutes_until_droppable = min_walk_time - elapsed_minutes
            droppable_at = current_time + minutes_until_droppable.minutes
            next_events << { type: :droppable, time: droppable_at, dog: appt.pet.name }
          end
        end

        # When does the next pickup window open?
        if remaining_appointments.any?
          remaining_appointments.each do |appt|
            start_window = parse_time(appt.start_time)
            if start_window && start_window > current_time
              next_events << { type: :window_opens, time: start_window, dog: appt.pet.name }
            end
          end
        end

        if next_events.any?
          # Advance to the soonest event
          next_event = next_events.min_by { |e| e[:time] }
          wait_minutes = ((next_event[:time] - current_time) / 60.0).round
          Rails.logger.info "⏳ Waiting #{wait_minutes} min until #{next_event[:type]} (#{next_event[:dog]})"
          current_time = next_event[:time]
          next
        else
          # No more events possible - we're done
          Rails.logger.info '✅ All appointments completed or no more valid actions'
          break
        end
      end

      best_action = actions.min_by { |a| a[:cost] }

      # 4. EXECUTE ACTION
      appt = best_action[:appointment]
      travel_time = calculate_travel_time_between_locations(
        current_location,
        { lat: appt.pet.latitude, lng: appt.pet.longitude }
      )
      current_time += travel_time.minutes
      if best_action[:type] == :pickup

        # Travel to pickup location

        # START PICKUP - Walk timer starts NOW
        pickup_start_times[appt.id] = current_time

        stop = format_route_stop(appt, :pickup)
        stop[:walk_group_id] ||= temp_group_id
        stop[:actual_pickup_time] = current_time
        stops << stop

        # Pickup takes 5 minutes
        current_time += PICKUP_TIME_MINUTES.minutes
        current_location = { lat: appt.pet.latitude, lng: appt.pet.longitude }
        currently_walking << appt
        remaining_appointments.delete(appt)

        Rails.logger.info "✓ Picked up #{appt.pet.name} at #{current_time.strftime('%H:%M')}. Pack: #{currently_walking.map do |a|
          a.pet.name
        end.join(', ')}"

      else # dropoff

        # Travel to dropoff location

        stop = format_route_stop(appt, :dropoff)
        stop[:walk_group_id] ||= temp_group_id
        stop[:actual_dropoff_time] = current_time
        stops << stop

        elapsed = ((current_time - pickup_start_times[appt.id]) / 60.0).round
        target = appt.duration || 30
        Rails.logger.info "✓ Dropped off #{appt.pet.name} at #{current_time.strftime('%H:%M')} (walked #{elapsed}/#{target} min)"

        current_time += DROPOFF_TIME_MINUTES.minutes
        current_location = { lat: appt.pet.latitude, lng: appt.pet.longitude }
        currently_walking.delete(appt)
      end
    end

    if pickup_start_times.any?
      total_minutes = ((current_time - pickup_start_times.values.min) / 60.0).round
      Rails.logger.info "Total route time: #{total_minutes} minutes"
    else
      Rails.logger.warn '⚠️ No pickups were made - all windows may be closed or invalid'
    end

    Rails.logger.info "Stop sequence: #{stops.map { |s| "#{s[:pet_name]}-#{s[:stop_type]}" }.join(' → ')}"

    stops
  end

  # Calculate cost for dropping off a dog
  # Lower cost = better dropoff option
  def self.calculate_dropoff_cost(appointment, current_location, current_time, pickup_start_times, currently_walking,
                                  remaining_appointments)
    # Base cost: travel time to dropoff location
    travel_time = calculate_travel_time_between_locations(
      current_location,
      { lat: appointment.pet.latitude, lng: appointment.pet.longitude }
    )
    base_cost = travel_time

    # How far from target duration (prefer dropping at ideal time)
    elapsed_minutes = ((current_time - pickup_start_times[appointment.id]) / 60.0).round
    target_duration = appointment.duration || 30
    duration_diff = (elapsed_minutes - target_duration).abs
    duration_penalty = duration_diff * 2

    # Pack size bonus (dropping off makes room for more pickups)
    pack_relief_bonus = currently_walking.length >= 4 ? -20 : 0

    # Nearby pickups bonus (chaining opportunities)
    nearby_pickups = remaining_appointments.count do |appt|
      parse_time(appt.start_time)
      end_window = parse_time(appt.end_time)
      # Only count if window is currently open or opens soon
      next false unless end_window && end_window > current_time

      nearby_distance = DistanceCalculator.distance_between(
        appointment.pet.latitude,
        appointment.pet.longitude,
        appt.pet.latitude,
        appt.pet.longitude
      ) || 100
      nearby_distance < 0.3 # Within 0.3 miles
    end
    nearby_bonus = nearby_pickups * -10

    base_cost + duration_penalty + pack_relief_bonus + nearby_bonus
  end

  # Calculate cost for picking up a dog
  # Lower cost = better pickup option
  def self.calculate_pickup_cost(appointment, current_location, current_time, pickup_start_times, currently_walking,
                                 _remaining_appointments)
    # Base cost: travel time to pickup location
    travel_time = calculate_travel_time_between_locations(
      current_location,
      { lat: appointment.pet.latitude, lng: appointment.pet.longitude }
    )
    base_cost = travel_time

    # Window urgency (how close to window closing)
    end_window = parse_time(appointment.end_time)
    if end_window
      minutes_until_close = ((end_window - current_time) / 60.0).round
      # Higher urgency (lower cost) if window closing soon
      urgency_bonus = minutes_until_close < 30 ? -(30 - minutes_until_close) : 0
    else
      urgency_bonus = 0
    end

    # Check if picking up would push current dogs over their limit
    overdue_penalty = 0
    if currently_walking.any?
      currently_walking.each do |walking_appt|
        elapsed = ((current_time - pickup_start_times[walking_appt.id]) / 60.0).round
        target = walking_appt.duration || 30
        max_allowed = target + 10

        # How much time until this dog goes over max allowed
        time_until_overdue = max_allowed - elapsed

        # If picking up this new dog would require travel + pickup time, would it push us over?
        estimated_additional_time = travel_time + PICKUP_TIME_MINUTES

        if estimated_additional_time > time_until_overdue
          # Would push this dog over their limit - heavy penalty
          overdue_penalty += 100
        elsif estimated_additional_time > (time_until_overdue - 10)
          # Close to pushing over - moderate penalty
          overdue_penalty += 30
        end
      end
    end

    # Duration compatibility with current pack
    if currently_walking.any?
      avg_remaining_time = currently_walking.map do |walking_appt|
        elapsed = ((current_time - pickup_start_times[walking_appt.id]) / 60.0).round
        target = walking_appt.duration || 30
        [target - elapsed, 0].max
      end.sum / currently_walking.length.to_f

      # Prefer dogs with similar remaining walk times
      duration_diff = ((appointment.duration || 30) - avg_remaining_time).abs
      duration_penalty = duration_diff * 0.5
    else
      duration_penalty = 0
    end

    base_cost + urgency_bonus + overdue_penalty + duration_penalty
  end

  # Find the best next dog to pick up based on current state
  def self.find_best_next_pickup(current_location, remaining_appointments, currently_walking, pickup_times,
                                 current_time)
    # Score each remaining appointment
    scores = remaining_appointments.map do |appt|
      # Distance score (closer is better)
      distance = DistanceCalculator.distance_between(
        current_location[:lat],
        current_location[:lng],
        appt.pet.latitude,
        appt.pet.longitude
      ) || 10.0

      # Prefer dogs with similar walk durations to current pack
      if currently_walking.any?
        avg_remaining_time = currently_walking.map do |walking_appt|
          walk_completion_time = pickup_times[walking_appt.id] + (walking_appt.duration || 30)
          walk_completion_time - current_time
        end.sum / currently_walking.length.to_f

        duration_diff = ((appt.duration || 30) - avg_remaining_time).abs
        duration_score = 1.0 / (1.0 + duration_diff / 10.0)
      else
        duration_score = 1.0
      end

      # Combined score (distance weighted 70%, duration 30%)
      total_score = (1.0 / (distance + 0.1)) * 0.7 + duration_score * 0.3

      { appointment: appt, score: total_score, distance: distance }
    end

    # Pick the best scoring appointment
    best = scores.max_by { |s| s[:score] }
    best[:appointment]
  end

  # Calculate travel time between two locations (in minutes)
  def self.calculate_travel_time_between_locations(loc1, loc2)
    distance = DistanceCalculator.distance_between(
      loc1[:lat],
      loc1[:lng],
      loc2[:lat],
      loc2[:lng]
    ) || 0

    # Time = Distance / Speed * 60 (convert to minutes)
    (distance / 3.0 * 60).round
  end

  # Optimize order of appointments within a group using TSP
  def self.optimize_appointment_order(appointments, start_location)
    return appointments if appointments.length <= 1

    unvisited = appointments.dup
    route = []
    current_location = start_location

    # If no start location, start with first appointment
    unless current_location
      first_appt = unvisited.shift
      route << first_appt
      current_location = {
        lat: first_appt.pet.latitude,
        lng: first_appt.pet.longitude
      }
    end

    # Visit nearest unvisited appointment
    while unvisited.any?
      nearest = find_nearest_appointment(current_location, unvisited)
      route << nearest
      unvisited.delete(nearest)

      current_location = {
        lat: nearest.pet.latitude,
        lng: nearest.pet.longitude
      }
    end

    route
  end

  # Find the nearest appointment to the current location
  def self.find_nearest_appointment(current_location, appointments)
    appointments.min_by do |appt|
      DistanceCalculator.distance_between(
        current_location[:lat],
        current_location[:lng],
        appt.pet.latitude,
        appt.pet.longitude
      ) || Float::INFINITY
    end
  end

  # Calculate estimated travel time based on distance
  def self.calculate_travel_time(distance_miles)
    # Time = Distance / Speed * 60 (convert to minutes)
    (distance_miles / WALKING_SPEED_MPH * 60).round
  end

  # Format a single route stop for API response
  def self.format_route_stop(appointment, stop_type = :solo)
    {
      id: "#{appointment.id}_#{stop_type}",
      appointment_id: appointment.id,
      pet_id: appointment.pet.id,
      pet_name: appointment.pet.name,
      address: appointment.pet.address,
      start_time: appointment.start_time, # Earliest pickup time (window start)
      end_time: appointment.end_time,     # Latest pickup time (window end)
      duration: appointment.duration || 30,
      walk_type: appointment.walk_type,
      walk_group_id: appointment.walk_group_id,
      stop_type: stop_type.to_s, # "pickup", "dropoff", or "solo"
      coordinates: {
        lat: appointment.pet.latitude,
        lng: appointment.pet.longitude
      }
    }
  end

  # Return empty route when no appointments
  def self.empty_route_response
    {
      route: [],
      total_distance: 0,
      total_travel_time: 0,
      total_walk_time: 0,
      total_time: 0,
      path_coordinates: [],
      optimized: false,
      groups_count: 0,
      solo_count: 0,
      message: 'No geocoded appointments to optimize'
    }
  end

  # Parse time from appointment (which stores as Time objects in DB)
  # Returns a Time object for today with the appointment's time
  def self.parse_time(time_value)
    return nil unless time_value

    # If it's already a Time object, extract the time component and apply to today
    if time_value.is_a?(Time) || time_value.is_a?(ActiveSupport::TimeWithZone)
      Time.current.beginning_of_day + time_value.seconds_since_midnight.seconds
    elsif time_value.is_a?(String)
      # Parse HH:MM format
      parsed = Time.parse(time_value)
      Time.current.beginning_of_day + parsed.seconds_since_midnight.seconds
    else
      Rails.logger.warn "Unknown time value type: #{time_value.class} for value: #{time_value}"
      nil
    end
  rescue StandardError => e
    Rails.logger.error "Error parsing time value #{time_value}: #{e.message}"
    nil
  end
end
