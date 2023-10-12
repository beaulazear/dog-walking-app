class AppointmentsController < ApplicationController
    before_action :current_user

    def create
        appointment = @current_user.appointments.create(appointment_params)
        if appointment.valid?
            render json: appointment, status: :created
        else
            render json: { errors: appointment.errors.full_messages }, status: :unprocessable_entity
        end
    end

    private

    def appointment_params
        params.require(:appointment).permit(:user_id, :pet_id, :appointment_date, :start_time, :end_time, :recurring, :duration, :monday, :tuesday, :wednesday, :thursday, :friday, :saturday, :sunday)
    end
end
