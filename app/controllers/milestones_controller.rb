class MilestonesController < ApplicationController
  before_action :current_user

  # GET /milestones
  def index
    milestones = @current_user.milestones.order(:hours_reached)

    # Include celebration messages in the response
    milestones_with_messages = milestones.map do |milestone|
      milestone.as_json.merge(celebration_message: milestone.celebration_message)
    end

    render json: milestones_with_messages
  end

  # PATCH /milestones/:id/mark_celebrated
  def mark_celebrated
    milestone = @current_user.milestones.find_by(id: params[:id])

    return render json: { error: "Milestone not found" }, status: :not_found if milestone.nil?

    if milestone.update(celebrated: true)
      render json: milestone.as_json.merge(celebration_message: milestone.celebration_message)
    else
      render json: { errors: milestone.errors.full_messages }, status: :unprocessable_entity
    end
  end
end
