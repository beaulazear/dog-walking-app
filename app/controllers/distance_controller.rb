class DistanceController < ApplicationController
  before_action :current_user

  # POST /distance/calculate
  # Calculate distance between two points
  # Params: { lat1:, lon1:, lat2:, lon2:, unit: 'miles' }
  def calculate
    lat1 = params[:lat1]&.to_f
    lon1 = params[:lon1]&.to_f
    lat2 = params[:lat2]&.to_f
    lon2 = params[:lon2]&.to_f
    unit = params[:unit]&.to_sym || :miles

    if [lat1, lon1, lat2, lon2].any?(&:nil?)
      return render json: { error: 'Missing required coordinates' }, status: :bad_request
    end

    distance = DistanceCalculator.distance_between(lat1, lon1, lat2, lon2, unit: unit)
    drive_time = DistanceCalculator.estimated_drive_time(lat1, lon1, lat2, lon2)

    render json: {
      distance: distance,
      unit: unit,
      drive_time_minutes: drive_time
    }
  end

  # POST /distance/matrix
  # Calculate distance matrix for multiple locations
  # Params: { coordinates: [{ lat:, lng: }, ...], unit: 'miles' }
  def matrix
    coordinates = params[:coordinates]
    unit = params[:unit]&.to_sym || :miles

    return render json: { error: 'coordinates must be an array' }, status: :bad_request unless coordinates.is_a?(Array)

    # Validate coordinate format
    valid = coordinates.all? { |c| c[:lat].present? && c[:lng].present? }
    unless valid
      return render json: {
        error: 'Each coordinate must have lat and lng'
      }, status: :bad_request
    end

    matrix = DistanceCalculator.distance_matrix(coordinates, unit: unit)

    render json: {
      matrix: matrix,
      unit: unit,
      size: coordinates.length
    }
  end

  # POST /distance/route
  # Calculate total distance and time for a route
  # Params: { coordinates: [{ lat:, lng: }, ...], unit: 'miles' }
  def route
    coordinates = params[:coordinates]
    unit = params[:unit]&.to_sym || :miles

    return render json: { error: 'coordinates must be an array' }, status: :bad_request unless coordinates.is_a?(Array)

    return render json: { error: 'Need at least 2 points for a route' }, status: :bad_request if coordinates.length < 2

    total_distance = DistanceCalculator.total_route_distance(coordinates, unit: unit)
    total_time = DistanceCalculator.total_route_time(coordinates)

    render json: {
      total_distance: total_distance,
      total_time_minutes: total_time,
      unit: unit,
      waypoints: coordinates.length
    }
  end

  # POST /distance/nearby
  # Find locations within a radius
  # Params: { center: { lat:, lng: }, locations: [...], radius_miles: }
  def nearby
    center = params[:center]
    locations = params[:locations]
    radius = params[:radius_miles]&.to_f || 1.0

    unless center && center[:lat] && center[:lng]
      return render json: { error: 'center must have lat and lng' }, status: :bad_request
    end

    return render json: { error: 'locations must be an array' }, status: :bad_request unless locations.is_a?(Array)

    nearby_locations = DistanceCalculator.locations_within_radius(
      center,
      locations,
      radius
    )

    # Add distance to each result
    nearby_with_distance = nearby_locations.map do |location|
      distance = DistanceCalculator.distance_between(
        center[:lat], center[:lng],
        location[:lat], location[:lng]
      )
      location.merge(distance_miles: distance)
    end

    # Sort by distance
    nearby_with_distance.sort_by! { |l| l[:distance_miles] }

    render json: {
      center: center,
      radius_miles: radius,
      locations: nearby_with_distance,
      count: nearby_with_distance.length
    }
  end

  # GET /distance/appointments/:date
  # Get distance info for all appointments on a given date
  def appointments
    date = params[:date] ? Date.parse(params[:date]) : Date.today

    appointments = @current_user.appointments
                                .includes(:pet)
                                .where('DATE(start_time) = ?', date)
                                .order(:start_time)

    # Filter out appointments without geocoded pets
    geocoded_appointments = appointments.select { |a| a.pet.geocoded? }

    if geocoded_appointments.empty?
      return render json: {
        message: 'No geocoded appointments found for this date',
        date: date,
        total_appointments: appointments.length,
        geocoded_appointments: 0
      }
    end

    # Build coordinates array
    coordinates = geocoded_appointments.map do |appt|
      { lat: appt.pet.latitude, lng: appt.pet.longitude }
    end

    # Calculate route stats
    total_distance = DistanceCalculator.total_route_distance(coordinates)
    total_drive_time = DistanceCalculator.total_route_time(coordinates)
    center = DistanceCalculator.calculate_center(coordinates)

    render json: {
      date: date,
      total_appointments: appointments.length,
      geocoded_appointments: geocoded_appointments.length,
      total_distance_miles: total_distance,
      estimated_drive_time_minutes: total_drive_time,
      center: center,
      appointments: geocoded_appointments.map do |appt|
        {
          id: appt.id,
          pet_name: appt.pet.name,
          latitude: appt.pet.latitude,
          longitude: appt.pet.longitude,
          start_time: appt.start_time,
          end_time: appt.end_time
        }
      end
    }
  rescue ArgumentError => e
    render json: { error: "Invalid date format: #{e.message}" }, status: :bad_request
  end
end
