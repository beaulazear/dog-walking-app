class AppointmentsController < ApplicationController
    before_action :current_user

    def create
        pet = @current_user.pets.find_by(id: params[:pet_id])
        
        if pet.nil?
            return render json: { error: "Pet not found" }, status: :not_found
        end
    
        appointment = pet.appointments.create(appointment_params)
    
        if appointment.valid?
            render json: appointment.as_json(only: [ :user_id, :pet_id, :appointment_date, :start_time, :id, :canceled, :completed, :end_time, :recurring, :solo, :duration, :monday, :tuesday, :wednesday, :thursday, :friday, :saturday, :sunday, :cancellations ])
        else
            render json: { errors: appointment.errors.full_messages }, status: :unprocessable_entity
        end
    end

    def canceled
        appointment = @current_user.appointments.find_by(id: params[:id])
        if appointment
            appointment.update(params_for_cancel)
            render json: appointment.as_json(only: [:id, :appointment_date, :start_time, :end_time, :duration, :recurring, :completed, :canceled])
        else
            render json: { error: "Appointment not found" }, status: :not_found
        end
    end

    def index
        appointments = @current_user.appointments
        
        if appointments
            render json: appointments.as_json(only: [:id, :appointment_date, :start_time, :end_time, :duration, :recurring, :completed, :canceled])
        else
            render json: { error: "No appointments found" }, status: :not_found
        end
    end
    

    def pet_appointments
        appointments = @current_user.appointments
        filtered_appointments = appointments.select do |apt|
          apt.canceled != true &&
          apt.completed != true &&
          (apt.recurring || apt.appointment_date >= Date.today)
        end
      
        if filtered_appointments.any?
            render json: filtered_appointments.as_json(only: [:id, :appointment_date, :start_time, :end_time, :duration, :recurring, :completed, :canceled])
        else
          render json: { errors: "No upcoming appointments found" }, status: :not_found
        end
    end

    def update
        appointment = @current_user.appointments.find_by(id: params[:id])
        if appointment
            appointment.update(appointment_params)
            render json: appointment.as_json(only: [ :id, :pet_id, :appointment_date, :start_time, :end_time, :duration, :recurring, :solo, :completed, :canceled, 
            :monday, :tuesday, :wednesday, :thursday, :friday, :saturday, :sunday ])
        else
            render json: { error: "appointment not found" }, status: :not_found
        end
    end

    private

    def appointment_params
        params.require(:appointment).permit(:user_id, :pet_id, :appointment_date, :start_time, :id, :canceled, :completed, :end_time, :recurring, :solo, :duration, :monday, :tuesday, :wednesday, :thursday, :friday, :saturday, :sunday)
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
