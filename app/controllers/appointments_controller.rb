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

    def canceled
        appointment = @current_user.appointments.find_by(id: params[:id])
        if appointment
            appointment.update(params_for_cancel)
            render json: appointment
        else
            render json: { error: "Appointment not found" }, status: :not_found
        end
    end

    def index
        appointments = @current_user.appointments
        filteredCanceledAndCompletedApts = appointments.select { |apt| apt.canceled != true && apt.completed != true }
        todaysAppointments = []

        for apt in filteredCanceledAndCompletedApts
            if apt.recurring == false && is_today?(apt.appointment_date)
                todaysAppointments << apt
            elsif apt.recurring == true && day_of_the_week?(apt)
                todaysAppointments << apt
            end
        end

        puts filteredCanceledAndCompletedApts

        sorted_appointments = todaysAppointments.sort { |a, b| a.start_time <=> b.start_time }

        if appointments
            render json: sorted_appointments
        else
            render json: { error: "No appointments found" }, status: :not_found
        end
    end

    private

    def appointment_params
        params.require(:appointment).permit(:user_id, :pet_id, :appointment_date, :start_time, :end_time, :recurring, :duration, :monday, :tuesday, :wednesday, :thursday, :friday, :saturday, :sunday)
    end
    
    def params_for_cancel
        params.require(:appointment).permit(:canceled)
    end

    def is_today?(date)
        today = Date.today
        date.year == today.year && date.month == today.month && date.day == today.day
    end

    def day_of_the_week?(apt)
        time_now = Time.now
        case time_now.wday
        when 0
            apt.sunday == true
        when 1
            apt.monday == true
        when 2
            apt.tuesday == true
        when 3 
            apt.wednesday == true
        when 4
            apt.thursday == true
        when 5 
            apt.friday == true
        when 6
            apt.saturday == true
        else
            puts "error!"
        end
    end
end
