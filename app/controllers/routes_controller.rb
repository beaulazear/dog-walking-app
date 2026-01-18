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
                     # Get day of week for the date
                     day_of_week = date.strftime("%A").downcase # 'monday', 'tuesday', etc.

                     # Get all appointments (recurring and non-recurring) for the date
                     # Use Arel or safe column reference instead of string interpolation
                     recurring_appointments = @current_user.appointments
                                                           .includes(:pet)
                                                           .where(recurring: true)
                                                           .where(day_of_week => true)
                                                           .where(canceled: [ false, nil ])
                                                           .where(completed: [ false, nil ])

                     non_recurring_appointments = @current_user.appointments
                                                               .includes(:pet)
                                                               .where(recurring: false)
                                                               .where("DATE(appointment_date) = ?", date)
                                                               .where(canceled: [ false, nil ])
                                                               .where(completed: [ false, nil ])

                     # Combine and sort by start time
                     (recurring_appointments + non_recurring_appointments).sort_by(&:start_time)
    end

    # Filter out appointments that are shared out on this date
    appointments = appointments.reject { |apt| apt.shared_out_on?(date, for_user: @current_user) }

    # Include appointments where user is covering on this date
    covering_shares = AppointmentShare
                      .accepted
                      .where(shared_with_user: @current_user)
                      .includes(:appointment, :share_dates, appointment: :pet)

    covering_appointments = covering_shares.select { |share| share.covers_date?(date) }.map(&:appointment)
    appointments += covering_appointments

    # Sort final list by start time
    appointments = appointments.uniq.sort_by(&:start_time)

    if appointments.empty?
      return render json: {
        error: "No appointments found",
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
    result = if [ true, "true" ].include?(params[:compare])
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
  rescue StandardError => e
    render json: { error: "Route optimization failed: #{e.message}" }, status: :internal_server_error
  end

  # GET /routes/:date
  # Get saved/optimized route for a specific date
  # This can be expanded later to cache optimized routes
  def show
    date = Date.parse(params[:date])

    # Get day of week for the date
    day_of_week = date.strftime("%A").downcase # 'monday', 'tuesday', etc.

    # Get all appointments (recurring and non-recurring) for the date
    recurring_appointments = @current_user.appointments
                                          .includes(:pet)
                                          .where(recurring: true)
                                          .where(day_of_week => true)
                                          .where(canceled: [ false, nil ])
                                          .where(completed: [ false, nil ])

    non_recurring_appointments = @current_user.appointments
                                              .includes(:pet)
                                              .where(recurring: false)
                                              .where("DATE(appointment_date) = ?", date)
                                              .where(canceled: [ false, nil ])
                                              .where(completed: [ false, nil ])

    # Combine and sort by start time
    appointments = (recurring_appointments + non_recurring_appointments).sort_by(&:start_time)

    # Filter out appointments that are shared out on this date
    appointments = appointments.reject { |apt| apt.shared_out_on?(date, for_user: @current_user) }

    # Include appointments where user is covering on this date
    covering_shares = AppointmentShare
                      .accepted
                      .where(shared_with_user: @current_user)
                      .includes(:appointment, :share_dates, appointment: :pet)

    covering_appointments = covering_shares.select { |share| share.covers_date?(date) }.map(&:appointment)
    appointments += covering_appointments

    # Sort final list by start time
    appointments = appointments.uniq.sort_by(&:start_time)

    if appointments.empty?
      return render json: {
        message: "No appointments found for this date",
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

    return render json: { error: "appointment_ids required" }, status: :bad_request if appointment_ids.blank?

    # Validate appointments exist and belong to user
    appointments = @current_user.appointments
                                .includes(:pet)
                                .where(id: appointment_ids)

    if appointments.length != appointment_ids.length
      return render json: {
        error: "Some appointments not found or do not belong to you"
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
