class CancellationsController < ApplicationController
  before_action :current_user

  def create
    # Find appointment and ensure it belongs to current user
    appointment = @current_user.appointments.find_by(id: cancellation_params[:appointment_id])

    return render json: { error: "Appointment not found or unauthorized" }, status: :not_found if appointment.nil?

    cancellation = appointment.cancellations.build(cancellation_params)

    if cancellation.save
      render json: cancellation.as_json(only: %i[id appointment_id date]), status: :created
    else
      render json: { errors: cancellation.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    # Find cancellation through user's appointments to ensure authorization
    cancellation = Cancellation.joins(:appointment)
                               .where(appointments: { user_id: @current_user.id })
                               .find_by(id: params[:id])

    if cancellation
      cancellation.destroy
      render json: cancellation.as_json(only: %i[id appointment_id date]), status: :ok
    else
      render json: { error: "Cancellation not found or unauthorized" }, status: :not_found
    end
  end

  private

  def cancellation_params
    params.permit(:appointment_id, :date)
  end
end
