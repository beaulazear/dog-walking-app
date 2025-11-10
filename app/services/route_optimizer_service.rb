class RouteOptimizerService
  WALKING_SPEED_MPH = 3.0 # Average walking speed

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

  # Build route stops for a group walk
  # Dogs are dropped off as their individual walk durations complete
  def self.build_group_route_stops(group_appointments, start_location)
    stops = []

    Rails.logger.info "=== Building group route for #{group_appointments.length} appointments ==="

    # Generate a temporary group ID for this group (use first appointment's ID or existing walk_group_id)
    temp_group_id = group_appointments.first.walk_group_id || "temp_group_#{group_appointments.first.id}"

    # Optimize pickup order using TSP
    pickup_order = optimize_appointment_order(group_appointments, start_location)

    Rails.logger.info "Pickup order has #{pickup_order.length} appointments"

    # Track when each dog should be dropped off (pickup_index + walk_duration)
    # We'll schedule dropoffs to happen after their walk time completes
    pickup_schedule = []

    pickup_order.each_with_index do |appt, index|
      pickup_stop = format_route_stop(appt, :pickup)
      pickup_stop[:walk_group_id] ||= temp_group_id
      pickup_stop[:pickup_index] = index # Track order for timing

      pickup_schedule << {
        appointment: appt,
        pickup_stop: pickup_stop,
        pickup_index: index,
        duration: appt.duration || 30
      }
    end

    # Sort by duration (shortest walks first for dropoffs)
    # This ensures dogs with shorter walks get dropped off sooner
    dropoff_order = pickup_schedule.sort_by { |p| p[:duration] }

    # Build interleaved schedule:
    # - All pickups first (to minimize travel)
    # - Then dropoffs ordered by walk duration (shortest first)
    pickup_schedule.each do |item|
      stops << item[:pickup_stop]
    end

    Rails.logger.info "Created #{pickup_schedule.length} pickup stops"

    # Add dropoffs in order of walk duration (shortest first)
    dropoff_order.each do |item|
      dropoff_stop = format_route_stop(item[:appointment], :dropoff)
      dropoff_stop[:walk_group_id] ||= temp_group_id
      dropoff_stop[:pickup_index] = item[:pickup_index] # Keep track of which pickup this corresponds to
      stops << dropoff_stop
    end

    Rails.logger.info "Created #{dropoff_order.length} dropoff stops"
    Rails.logger.info "Total stops: #{stops.length}"

    stops
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
