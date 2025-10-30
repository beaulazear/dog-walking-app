class AppointmentsController < ApplicationController
  include Rails.application.routes.url_helpers
  before_action :current_user

  def create
    pet = @current_user.pets.find_by(id: params[:pet_id])

    return render json: { error: 'Pet not found' }, status: :not_found if pet.nil?

    appointment = pet.appointments.create(appointment_params)

    if appointment.valid?
      # Eager load associations for serialization
      appointment = Appointment.includes(:pet, :cancellations).find(appointment.id)
      render json: AppointmentSerializer.serialize(appointment), status: :created
    else
      render json: { errors: appointment.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def canceled
    appointment = @current_user.appointments.includes(:cancellations, :pet).find_by(id: params[:id])
    if appointment
      if appointment.update(params_for_cancel)
        render json: AppointmentSerializer.serialize(appointment)
      else
        render json: { errors: appointment.errors.full_messages }, status: :unprocessable_entity
      end
    else
      render json: { error: 'Appointment not found' }, status: :not_found
    end
  end

  def index
    page = params[:page] || 1
    per_page = params[:per_page] || 50

    appointments = @current_user.appointments
                                .order(appointment_date: :desc)
                                .page(page)
                                .per(per_page)

    render json: {
      appointments: AppointmentSerializer.serialize_minimal_collection(appointments),
      pagination: {
        current_page: appointments.current_page,
        total_pages: appointments.total_pages,
        total_count: appointments.total_count,
        per_page: per_page.to_i
      }
    }
  end

  def pet_appointments
    page = params[:page] || 1
    per_page = params[:per_page] || 50

    # Filter at database level for much better performance
    appointments = @current_user.appointments
                                .where(canceled: false, completed: false)
                                .where('recurring = ? OR appointment_date >= ?', true, Date.today)
                                .order(appointment_date: :asc)
                                .page(page)
                                .per(per_page)

    render json: {
      appointments: AppointmentSerializer.serialize_minimal_collection(appointments),
      pagination: {
        current_page: appointments.current_page,
        total_pages: appointments.total_pages,
        total_count: appointments.total_count,
        per_page: per_page.to_i
      }
    }
  end

  def update
    appointment = @current_user.appointments.includes(:cancellations, :pet).find_by(id: params[:id])
    if appointment
      Rails.logger.info "Update params: #{appointment_params.inspect}"
      Rails.logger.info "Appointment before update: price=#{appointment.price}, duration=#{appointment.duration}"

      if appointment.update(appointment_params)
        render json: AppointmentSerializer.serialize(appointment), status: :ok
      else
        Rails.logger.error "Update failed with errors: #{appointment.errors.full_messages.inspect}"
        render json: { errors: appointment.errors.full_messages }, status: :unprocessable_entity
      end
    else
      render json: { error: 'appointment not found' }, status: :not_found
    end
  end

  def destroy
    appointment = @current_user.appointments.find_by(id: params[:id])

    if appointment
      if appointment.destroy
        render json: { message: 'Appointment deleted successfully' }, status: :ok
      else
        render json: { errors: appointment.errors.full_messages }, status: :unprocessable_entity
      end
    else
      render json: { error: 'Appointment not found' }, status: :not_found
    end
  end

  private

  def appointment_params
    params.require(:appointment).permit(:user_id, :pet_id, :appointment_date, :start_time, :id, :canceled,
                                        :completed, :end_time, :recurring, :solo, :duration, :price, :monday, :tuesday, :wednesday, :thursday, :friday, :saturday, :sunday)
  end

  def params_for_cancel
    params.require(:appointment).permit(:canceled)
  end
end
