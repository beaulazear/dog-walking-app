class DistanceCalculator
  EARTH_RADIUS_KM = 6371
  EARTH_RADIUS_MILES = 3959

  # Average speeds for different travel modes (mph)
  TRAVEL_SPEEDS = {
    walking: 3.0,    # Walking between locations
    biking: 12.0,    # Biking between locations
    driving: 25.0,   # Driving in city traffic
    transit: 15.0    # Public transportation average
  }.freeze

  # Haversine formula - calculates "as the crow flies" distance
  # Returns distance in miles or kilometers
  def self.distance_between(lat1, lon1, lat2, lon2, unit: :miles)
    return nil if [ lat1, lon1, lat2, lon2 ].any?(&:nil?)

    # Convert to floats
    lat1 = lat1.to_f
    lon1 = lon1.to_f
    lat2 = lat2.to_f
    lon2 = lon2.to_f

    rad_per_deg = Math::PI / 180

    dlat_rad = (lat2 - lat1) * rad_per_deg
    dlon_rad = (lon2 - lon1) * rad_per_deg

    lat1_rad = lat1 * rad_per_deg
    lat2_rad = lat2 * rad_per_deg

    a = Math.sin(dlat_rad / 2)**2 +
        Math.cos(lat1_rad) * Math.cos(lat2_rad) *
        Math.sin(dlon_rad / 2)**2

    c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    radius = unit == :miles ? EARTH_RADIUS_MILES : EARTH_RADIUS_KM

    (radius * c).round(2)
  end

  # Estimate travel time in minutes based on distance and travel mode
  # Modes: :walking, :biking, :driving, :transit
  # This is a simple estimate - for real routing use Mapbox/Google Directions API
  def self.estimated_travel_time(lat1, lon1, lat2, lon2, mode: :walking)
    distance = distance_between(lat1, lon1, lat2, lon2, unit: :miles)
    return nil if distance.nil?

    speed = TRAVEL_SPEEDS[mode] || TRAVEL_SPEEDS[:walking]

    # Convert miles to minutes at given speed
    base_time = (distance / speed * 60).round

    # Add buffer time based on mode
    buffer = case mode
    when :walking then 1  # 1 min buffer for walking
    when :biking then 2   # 2 min for bike parking
    when :driving then 5  # 5 min for traffic/parking
    when :transit then 3  # 3 min for transfers
    else 2
    end

    base_time + buffer
  end

  # Legacy method for backwards compatibility
  def self.estimated_drive_time(lat1, lon1, lat2, lon2)
    estimated_travel_time(lat1, lon1, lat2, lon2, mode: :driving)
  end

  # Create a distance matrix for multiple locations
  # Input: array of hashes with :lat and :lng keys
  # Output: 2D array where matrix[i][j] is distance from location i to j
  def self.distance_matrix(coordinates_array, unit: :miles)
    return [] if coordinates_array.empty?

    matrix = []

    coordinates_array.each_with_index do |coord1, i|
      row = []
      coordinates_array.each_with_index do |coord2, j|
        if i == j
          row << 0.0
        else
          distance = distance_between(
            coord1[:lat], coord1[:lng],
            coord2[:lat], coord2[:lng],
            unit: unit
          )
          row << distance
        end
      end
      matrix << row
    end

    matrix
  end

  # Calculate total distance for a route (ordered list of coordinates)
  # Input: array of hashes with :lat and :lng keys
  # Output: total distance in miles (or km if specified)
  def self.total_route_distance(coordinates_array, unit: :miles)
    return 0 if coordinates_array.length < 2

    total = 0.0

    coordinates_array.each_cons(2) do |coord1, coord2|
      distance = distance_between(
        coord1[:lat], coord1[:lng],
        coord2[:lat], coord2[:lng],
        unit: unit
      )
      total += distance if distance
    end

    total.round(2)
  end

  # Calculate total estimated travel time for a route
  # Input: array of hashes with :lat and :lng keys
  # Output: total time in minutes
  # Mode: :walking, :biking, :driving, or :transit
  def self.total_route_time(coordinates_array, mode: :walking)
    return 0 if coordinates_array.length < 2

    total = 0

    coordinates_array.each_cons(2) do |coord1, coord2|
      time = estimated_travel_time(
        coord1[:lat], coord1[:lng],
        coord2[:lat], coord2[:lng],
        mode: mode
      )
      total += time if time
    end

    total
  end

  # Check if two locations are within a certain distance of each other
  # Useful for grouping nearby walks
  def self.within_distance?(lat1, lon1, lat2, lon2, threshold_miles)
    distance = distance_between(lat1, lon1, lat2, lon2, unit: :miles)
    return false if distance.nil?

    distance <= threshold_miles
  end

  # Find all locations within a radius of a center point
  # Input:
  #   center: { lat:, lng: }
  #   locations: array of hashes with :lat, :lng, and optional other data
  #   radius_miles: search radius
  # Output: filtered array of locations within radius
  def self.locations_within_radius(center, locations, radius_miles)
    locations.select do |location|
      within_distance?(
        center[:lat], center[:lng],
        location[:lat], location[:lng],
        radius_miles
      )
    end
  end

  # Calculate the geographic center (centroid) of multiple points
  # Useful for finding the center of a group of walks
  def self.calculate_center(coordinates_array)
    return nil if coordinates_array.empty?

    avg_lat = coordinates_array.sum { |c| c[:lat].to_f } / coordinates_array.length
    avg_lng = coordinates_array.sum { |c| c[:lng].to_f } / coordinates_array.length

    { lat: avg_lat.round(6), lng: avg_lng.round(6) }
  end

  # Convert coordinates to a simple hash format
  def self.to_coordinate_hash(lat, lng)
    { lat: lat.to_f, lng: lng.to_f }
  end
end
