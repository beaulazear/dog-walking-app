class RoutesController < ApplicationController
  before_action :current_user

  # POST /routes/optimize
  # Optimize route for a set of appointments
  # Params:
  #   - date: 'YYYY-MM-DD' (optional, defaults to today)
  #   - appointment_ids: [1, 2, 3] (optional, defaults to all for date)
  #   - start_location: { lat:, lng: } (optional)
  #   - compare: true/false (optional, show comparison with original)
  def optimize
    date = params[:date] ? Date.parse(params[:date]) : Date.today

    # Get appointments for optimization
    appointments = if params[:appointment_ids].present?
                     # Optimize specific appointments
                     @current_user.appointments
                                  .includes(:pet)
                                  .where(id: params[:appointment_ids])
                   else
                     # Optimize all appointments for the date
                     @current_user.appointments
                                  .includes(:pet)
                                  .where('DATE(appointment_date) = ?', date)
                                  .order(:start_time)
                   end

    if appointments.empty?
      return render json: {
        error: 'No appointments found',
        date: date,
        route: []
      }, status: :not_found
    end

    # Parse start location if provided
    start_location = if params[:start_location].present?
                       {
                         lat: params[:start_location][:lat].to_f,
                         lng: params[:start_location][:lng].to_f
                       }
                     end

    # Optimize the route
    result = if params[:compare] == true || params[:compare] == 'true'
               RouteOptimizerService.optimize_and_compare(appointments, start_location: start_location)
             else
               RouteOptimizerService.optimize_route(appointments, start_location: start_location)
             end

    render json: result.merge({
      date: date,
      total_appointments: appointments.length,
      geocoded_appointments: appointments.count { |a| a.pet&.geocoded? }
    })
  rescue ArgumentError => e
    render json: { error: "Invalid date format: #{e.message}" }, status: :bad_request
  rescue => e
    render json: { error: "Route optimization failed: #{e.message}" }, status: :internal_server_error
  end

  # GET /routes/:date
  # Get saved/optimized route for a specific date
  # This can be expanded later to cache optimized routes
  def show
    date = Date.parse(params[:date])

    appointments = @current_user.appointments
                                .includes(:pet)
                                .where('DATE(appointment_date) = ?', date)
                                .order(:start_time)

    if appointments.empty?
      return render json: {
        message: 'No appointments found for this date',
        date: date,
        route: []
      }
    end

    # For now, just return optimized route on-the-fly
    # Later we can cache this in a routes table
    result = RouteOptimizerService.optimize_route(appointments)

    render json: result.merge({ date: date })
  rescue ArgumentError => e
    render json: { error: "Invalid date format: #{e.message}" }, status: :bad_request
  end

  # POST /routes/reorder
  # Manually reorder stops in a route
  # Params: { appointment_ids: [3, 1, 2] } - new order
  def reorder
    appointment_ids = params[:appointment_ids]

    if appointment_ids.blank?
      return render json: { error: 'appointment_ids required' }, status: :bad_request
    end

    # Validate appointments exist and belong to user
    appointments = @current_user.appointments
                                .includes(:pet)
                                .where(id: appointment_ids)

    if appointments.length != appointment_ids.length
      return render json: {
        error: 'Some appointments not found or do not belong to you'
      }, status: :unprocessable_entity
    end

    # Reorder appointments based on provided IDs
    ordered_appointments = appointment_ids.map do |id|
      appointments.find { |a| a.id == id.to_i }
    end.compact

    # Calculate metrics for manually ordered route
    path_coordinates = ordered_appointments.map do |a|
      { lat: a.pet.latitude, lng: a.pet.longitude }
    end

    total_distance = DistanceCalculator.total_route_distance(path_coordinates)
    travel_time = (total_distance / 3.0 * 60).round
    walk_time = ordered_appointments.sum { |a| a.duration || 30 }

    render json: {
      route: ordered_appointments.map do |a|
        {
          id: a.id,
          pet_name: a.pet.name,
          address: a.pet.address,
          coordinates: { lat: a.pet.latitude, lng: a.pet.longitude }
        }
      end,
      total_distance: total_distance.round(2),
      total_travel_time: travel_time,
      total_walk_time: walk_time,
      total_time: (travel_time + walk_time).round,
      path_coordinates: path_coordinates,
      manually_ordered: true
    }
  end
end
