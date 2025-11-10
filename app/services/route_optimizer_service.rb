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
    improvement_percent = original_distance > 0 ? ((distance_saved / original_distance) * 100).round(1) : 0

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

  private

  # Categorize appointments into groups and solo walks
  def self.categorize_appointments(appointments)
    groups = {}
    solo_walks = []

    appointments.each do |appt|
      if appt.walk_group_id
        groups[appt.walk_group_id] ||= []
        groups[appt.walk_group_id] << appt
      else
        solo_walks << appt
      end
    end

    [groups.values, solo_walks]
  end

  # Build optimized route considering pickup/dropoff for groups
  def self.build_optimized_route(groups, solo_walks, start_location)
    route_stops = []
    current_location = start_location

    # Create "walk units" - each unit is either a group or a solo walk
    walk_units = []

    # Add groups
    groups.each do |group_appointments|
      walk_units << { type: :group, appointments: group_appointments }
    end

    # Add solo walks
    solo_walks.each do |appt|
      walk_units << { type: :solo, appointments: [appt] }
    end

    # Optimize the order of walk units using TSP
    ordered_units = optimize_walk_units_order(walk_units, current_location)

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

  # Optimize the order of walk units (groups and solo walks)
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

  # Build route stops for a group walk (pickups, then drop-offs)
  def self.build_group_route_stops(group_appointments, start_location)
    stops = []

    # Optimize pickup order using TSP
    pickup_order = optimize_appointment_order(group_appointments, start_location)

    # Add pickup stops
    pickup_order.each do |appt|
      stops << format_route_stop(appt, :pickup)
    end

    # Drop-offs in reverse order (or could optimize this too)
    dropoff_order = pickup_order.reverse

    # Add drop-off stops
    dropoff_order.each do |appt|
      stops << format_route_stop(appt, :dropoff)
    end

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
      start_time: appointment.start_time,
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
      message: "No geocoded appointments to optimize"
    }
  end
end
