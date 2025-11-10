class WalkGroupsController < ApplicationController
  before_action :current_user

  # GET /walk_groups/suggestions
  # Get walk grouping suggestions for a specific date
  # Params: { date: 'YYYY-MM-DD' (optional, defaults to today) }
  def suggestions
    date = params[:date] ? Date.parse(params[:date]) : Date.today
    max_distance = params[:max_distance]&.to_f || 0.5

    # Get day of week for the date
    day_of_week = date.strftime('%A').downcase # 'monday', 'tuesday', etc.

    # Get all appointments (recurring and non-recurring) for the date
    recurring_appointments = @current_user.appointments
                                          .includes(:pet)
                                          .where(recurring: true)
                                          .where(day_of_week => true)

    non_recurring_appointments = @current_user.appointments
                                              .includes(:pet)
                                              .where(recurring: false)
                                              .where('DATE(appointment_date) = ?', date)

    # Combine and sort by start time
    appointments = (recurring_appointments + non_recurring_appointments).sort_by(&:start_time)

    if appointments.empty?
      return render json: {
        message: 'No appointments found for this date',
        date: date,
        suggestions: []
      }
    end

    # Generate grouping suggestions
    suggestions = WalkGroupingService.suggest_groups(
      appointments,
      max_distance: max_distance
    )

    render json: {
      date: date,
      total_appointments: appointments.length,
      groupable_appointments: appointments.count { |a| WalkGroupingService.groupable_walk_type?(a) },
      suggestions: suggestions,
      count: suggestions.length
    }
  rescue ArgumentError => e
    render json: { error: "Invalid date format: #{e.message}" }, status: :bad_request
  end

  # GET /walk_groups
  # Get saved walk groups for a specific date
  def index
    date = params[:date] ? Date.parse(params[:date]) : Date.today

    # Get day of week for the date
    day_of_week = date.strftime('%A').downcase # 'monday', 'tuesday', etc.

    # Get all appointments (recurring and non-recurring) for the date
    recurring_appointments = @current_user.appointments
                                          .where(recurring: true)
                                          .where(day_of_week => true)
                                          .where.not(walk_group_id: nil)

    non_recurring_appointments = @current_user.appointments
                                              .where(recurring: false)
                                              .where('DATE(appointment_date) = ?', date)
                                              .where.not(walk_group_id: nil)

    # Get all appointment IDs that are scheduled for today and have a walk_group_id
    todays_appointment_ids = (recurring_appointments + non_recurring_appointments).map(&:id)

    # Find walk groups that contain these appointments
    walk_groups = @current_user.walk_groups
                               .joins(:appointments)
                               .where(appointments: { id: todays_appointment_ids })
                               .distinct
                               .includes(appointments: :pet)

    render json: walk_groups, include: { appointments: { include: :pet } }
  rescue ArgumentError => e
    render json: { error: "Invalid date format: #{e.message}" }, status: :bad_request
  end

  # POST /walk_groups
  # Accept a group suggestion and save it
  # Params: { appointment_ids: [1, 2, 3], name: 'Morning Group', date: 'YYYY-MM-DD' }
  def create
    appointment_ids = params[:appointment_ids]
    name = params[:name] || "Group #{Time.current.strftime('%I:%M %p')}"
    date = params[:date] ? Date.parse(params[:date]) : Date.today

    # Validate appointments exist and belong to current user
    appointments = @current_user.appointments.where(id: appointment_ids)

    return render json: { error: 'No valid appointments found' }, status: :unprocessable_entity if appointments.empty?

    if appointments.length != appointment_ids.length
      return render json: { error: 'Some appointments not found or do not belong to you' },
                    status: :unprocessable_entity
    end

    # Create the walk group
    walk_group = @current_user.walk_groups.create!(
      name: name,
      date: date
    )

    # Associate appointments with the group
    appointments.update_all(walk_group_id: walk_group.id)

    render json: {
      message: 'Walk group created successfully',
      walk_group: walk_group.as_json(include: { appointments: { include: :pet } })
    }, status: :created
  rescue ArgumentError => e
    render json: { error: "Invalid date format: #{e.message}" }, status: :bad_request
  rescue ActiveRecord::RecordInvalid => e
    render json: { error: e.message }, status: :unprocessable_entity
  end

  # DELETE /walk_groups/:id
  # Delete a walk group and ungroup the appointments
  def destroy
    walk_group = @current_user.walk_groups.find(params[:id])

    # This will nullify walk_group_id on appointments due to dependent: :nullify
    walk_group.destroy!

    render json: { message: 'Walk group deleted successfully' }
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'Walk group not found' }, status: :not_found
  end
end
