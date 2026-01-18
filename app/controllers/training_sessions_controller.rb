require "csv"

class TrainingSessionsController < ApplicationController
  before_action :current_user
  before_action :set_training_session, only: %i[update destroy]

  # GET /training_sessions
  def index
    sessions = @current_user.training_sessions
                            .order(session_date: :desc)
                            .includes(:pet)

    render json: sessions.as_json(include: { pet: { only: %i[id name] } })
  end

  # GET /training_sessions/summary
  def summary
    total_hours = @current_user.total_training_hours
    total_sessions = @current_user.total_training_sessions

    render json: {
      total_hours: total_hours,
      total_sessions: total_sessions,
      hours_remaining: 300 - total_hours,
      progress_percentage: ((total_hours / 300.0) * 100).round(1),
      current_streak: @current_user.current_streak,
      longest_streak: @current_user.longest_streak
    }
  end

  # GET /training_sessions/this_week
  def this_week
    sessions = @current_user.training_sessions.this_week
    weekly_hours = (sessions.sum(:duration_minutes) / 60.0).round(1)
    goal = @current_user.certification_goal&.weekly_goal_hours || 12

    render json: {
      sessions: sessions,
      total_hours: weekly_hours,
      goal_hours: goal,
      progress_percentage: ((weekly_hours / goal.to_f) * 100).round(1)
    }
  end

  # GET /training_sessions/this_month
  def this_month
    sessions = @current_user.training_sessions.this_month
    monthly_hours = (sessions.sum(:duration_minutes) / 60.0).round(1)

    render json: {
      sessions: sessions,
      total_hours: monthly_hours,
      session_count: sessions.count
    }
  end

  # POST /training_sessions
  def create
    session = @current_user.training_sessions.build(training_session_params)

    if session.save
      # Check for new milestones
      @current_user.check_and_create_milestones!

      # Check if a milestone was just reached
      new_milestone = @current_user.milestones.uncelebrated.last

      render json: {
        session: session.as_json(include: { pet: { only: %i[id name] } }),
        new_milestone: new_milestone
      }, status: :created
    else
      render json: { errors: session.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # PATCH /training_sessions/:id
  def update
    if @training_session.update(training_session_params)
      render json: @training_session.as_json(include: { pet: { only: %i[id name] } })
    else
      render json: { errors: @training_session.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # DELETE /training_sessions/:id
  def destroy
    @training_session.destroy
    head :no_content
  end

  # GET /training_sessions/export
  def export
    sessions = @current_user.training_sessions.order(:session_date).includes(:pet)

    # Generate CSV for CPDT-KA application
    csv_data = generate_cpdt_export(sessions)

    send_data csv_data, filename: "cpdt_training_hours_#{Date.current}.csv", type: "text/csv"
  end

  # POST /training_sessions/sync_from_invoices
  def sync_from_invoices
    pet_ids = @current_user.pets.pluck(:id)
    training_invoices = Invoice.where(pet_id: pet_ids)
                               .where("title ILIKE ?", "%training%")
                               .where(training_session_id: nil)

    synced = []
    errors = []

    training_invoices.each do |invoice|
      session = invoice.create_training_session!
      synced << session if session
    rescue StandardError => e
      errors << { invoice_id: invoice.id, error: e.message }
    end

    # Check for new milestones after syncing
    @current_user.check_and_create_milestones!

    render json: {
      synced_count: synced.count,
      sessions: synced.as_json(include: { pet: { only: %i[id name] } }),
      errors: errors,
      new_milestones: @current_user.milestones.uncelebrated
    }, status: :ok
  end

  private

  def set_training_session
    @training_session = @current_user.training_sessions.find_by(id: params[:id])
    render json: { error: "Training session not found" }, status: :not_found unless @training_session
  end

  def training_session_params
    params.require(:training_session).permit(
      :pet_id,
      :session_date,
      :duration_minutes,
      :session_type,
      :notes,
      training_focus: []
    )
  end

  def generate_cpdt_export(sessions)
    CSV.generate(headers: true) do |csv|
      csv << [ "Date", "Duration (hours)", "Session Type", "Dog Name", "Training Focus" ]

      sessions.each do |session|
        csv << [
          session.session_date.strftime("%Y-%m-%d"),
          session.duration_hours,
          session.session_type&.humanize,
          session.pet&.name || "Group/Multiple",
          session.training_focus.join(", ")
        ]
      end

      csv << []
      csv << [ "Total Hours", (sessions.sum(:duration_minutes) / 60.0).round(2) ]
    end
  end
end
