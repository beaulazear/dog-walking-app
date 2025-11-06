class CertificationGoalsController < ApplicationController
  before_action :current_user

  # GET /certification_goal
  def show
    goal = @current_user.certification_goal || @current_user.build_certification_goal

    render json: {
      goal: goal,
      hours_per_week_needed: goal.hours_per_week_needed,
      projected_completion: goal.projected_completion_date
    }
  end

  # POST /certification_goal
  def create
    goal = @current_user.build_certification_goal(goal_params)

    if goal.save
      render json: goal, status: :created
    else
      render json: { errors: goal.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # PATCH /certification_goal
  def update
    goal = @current_user.certification_goal

    if goal.nil?
      return render json: { error: 'Certification goal not found. Please create one first.' }, status: :not_found
    end

    if goal.update(goal_params)
      render json: goal
    else
      render json: { errors: goal.errors.full_messages }, status: :unprocessable_entity
    end
  end

  private

  def goal_params
    params.require(:certification_goal).permit(
      :certification_type,
      :target_hours,
      :weekly_goal_hours,
      :target_completion_date
    )
  end
end
