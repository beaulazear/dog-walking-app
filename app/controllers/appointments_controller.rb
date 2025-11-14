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

  # GET /appointments/for_date?date=YYYY-MM-DD
  # Returns appointments for a specific date including both owned and covering
  def for_date
    date = params[:date] ? Date.parse(params[:date]) : Date.today

    # Appointments owned by current user
    owned_appointments = @current_user.appointments
                                      .where(completed: false, canceled: false)
                                      .includes(:pet, :user, :cancellations, appointment_shares: %i[shared_with_user
                                                                                                    share_dates])

    # Appointments where current user is covering (accepted shares)
    covering_shares = AppointmentShare
                      .accepted
                      .where(shared_with_user: @current_user)
                      .includes(:appointment, :share_dates, shared_by_user: [:pets])

    # Format owned appointments
    owned_data = owned_appointments.map do |apt|
      covering_walker = apt.covering_walker_on(date)
      format_appointment_for_date(apt, date, covering_walker: covering_walker)
    end

    # Format covering appointments (only include if they cover this specific date)
    covering_data = covering_shares.map do |share|
      next unless share.covers_date?(date)

      format_covered_appointment(share.appointment, share, date)
    end.compact

    render json: {
      owned: owned_data,
      covering: covering_data
    }
  end

  # GET /appointments/team_financials
  # Returns team-related earnings and payouts
  def team_financials
    # Earnings: Money I'm making by covering other people's walks
    my_covering_earnings = @current_user.walker_earnings
                                        .includes(:appointment, :pet, :appointment_share)
                                        .order(date_completed: :desc)

    # Payouts: Money I owe team members who covered my walks
    my_pet_ids = @current_user.pets.pluck(:id)
    team_payouts = WalkerEarning.where(pet_id: my_pet_ids)
                                .where.not(walker_id: @current_user.id)
                                .includes(:walker, :appointment, :pet, :appointment_share)
                                .order(date_completed: :desc)

    # Calculate totals
    total_earnings = my_covering_earnings.sum(:compensation)
    total_earnings_unpaid = my_covering_earnings.unpaid.sum(:compensation)
    total_payouts = team_payouts.sum(:compensation)
    total_payouts_unpaid = team_payouts.where(paid: false).sum(:compensation)

    render json: {
      my_earnings: my_covering_earnings.as_json(
        only: %i[id appointment_id walker_id pet_id date_completed compensation split_percentage paid pending title],
        include: {
          pet: { only: %i[id name] },
          appointment: { only: %i[id start_time end_time] },
          walker: { only: %i[id name] }
        }
      ),
      team_payouts: team_payouts.as_json(
        only: %i[id appointment_id walker_id pet_id date_completed compensation split_percentage paid pending title],
        include: {
          pet: { only: %i[id name] },
          appointment: { only: %i[id start_time end_time] },
          walker: { only: %i[id name username] }
        }
      ),
      totals: {
        total_earnings: total_earnings,
        total_earnings_unpaid: total_earnings_unpaid,
        total_payouts: total_payouts,
        total_payouts_unpaid: total_payouts_unpaid
      }
    }
  end

  # GET /appointments/my_earnings
  # Returns combined earnings from invoices (pet owner) and walker_earnings (covering walker)
  def my_earnings
    page = params[:page] || 1
    per_page = params[:per_page] || 50

    # Get invoices for user's pets
    pet_ids = @current_user.pets.pluck(:id)
    invoices = Invoice.where(pet_id: pet_ids)
                      .order(date_completed: :desc)
                      .page(page)
                      .per(per_page)

    # Get walker earnings for user
    walker_earnings = @current_user.walker_earnings
                                   .includes(:appointment, :pet, :appointment_share)
                                   .order(date_completed: :desc)
                                   .page(page)
                                   .per(per_page)

    # Calculate totals
    total_invoice_earnings = Invoice.where(pet_id: pet_ids).sum(:compensation)
    total_walker_earnings = @current_user.walker_earnings.sum(:compensation)
    total_earnings = total_invoice_earnings + total_walker_earnings

    # Calculate unpaid totals
    unpaid_invoices = Invoice.where(pet_id: pet_ids).unpaid.sum(:compensation)
    unpaid_walker_earnings = @current_user.walker_earnings.unpaid.sum(:compensation)
    total_unpaid = unpaid_invoices + unpaid_walker_earnings

    render json: {
      invoices: invoices.as_json(
        only: %i[id appointment_id pet_id date_completed compensation paid pending title cancelled
                 is_shared split_percentage],
        include: {
          pet: { only: %i[id name] },
          appointment: { only: %i[id start_time end_time] }
        }
      ),
      walker_earnings: walker_earnings.as_json(
        only: %i[id appointment_id walker_id pet_id date_completed compensation split_percentage paid pending title],
        include: {
          pet: { only: %i[id name] },
          appointment: { only: %i[id start_time end_time] }
        }
      ),
      totals: {
        total_earnings: total_earnings,
        total_invoice_earnings: total_invoice_earnings,
        total_walker_earnings: total_walker_earnings,
        total_unpaid: total_unpaid,
        unpaid_invoices: unpaid_invoices,
        unpaid_walker_earnings: unpaid_walker_earnings
      },
      pagination: {
        current_page: page.to_i,
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
                                        :completed, :end_time, :recurring, :walk_type, :duration, :price, :monday, :tuesday, :wednesday, :thursday, :friday, :saturday, :sunday)
  end

  def params_for_cancel
    params.require(:appointment).permit(:canceled)
  end

  def format_appointment_for_date(apt, _date, covering_walker: nil)
    {
      id: apt.id,
      appointment_date: apt.appointment_date,
      start_time: apt.start_time,
      end_time: apt.end_time,
      duration: apt.duration,
      price: apt.price,
      walk_type: apt.walk_type,
      completed: apt.completed,
      canceled: apt.canceled,
      recurring: apt.recurring,
      delegation_status: apt.delegation_status,
      monday: apt.monday,
      tuesday: apt.tuesday,
      wednesday: apt.wednesday,
      thursday: apt.thursday,
      friday: apt.friday,
      saturday: apt.saturday,
      sunday: apt.sunday,
      pet: {
        id: apt.pet.id,
        name: apt.pet.name,
        address: apt.pet.address,
        behavioral_notes: apt.pet.behavioral_notes,
        supplies_location: apt.pet.supplies_location,
        allergies: apt.pet.allergies,
        profile_picture_url: if apt.pet.respond_to?(:profile_picture) && apt.pet.profile_picture.attached?
                               rails_blob_url(apt.pet.profile_picture,
                                              only_path: true)
                             end
      },
      is_shared_out: covering_walker.present?,
      covered_by: if covering_walker
                    {
                      id: covering_walker.id,
                      name: covering_walker.name,
                      email: covering_walker.email_address
                    }
                  end,
      can_complete: covering_walker.nil?
    }
  end

  def format_covered_appointment(apt, share, _date)
    {
      id: apt.id,
      appointment_date: apt.appointment_date,
      start_time: apt.start_time,
      end_time: apt.end_time,
      duration: apt.duration,
      price: apt.price,
      walk_type: apt.walk_type,
      completed: apt.completed,
      canceled: apt.canceled,
      recurring: apt.recurring,
      delegation_status: apt.delegation_status,
      monday: apt.monday,
      tuesday: apt.tuesday,
      wednesday: apt.wednesday,
      thursday: apt.thursday,
      friday: apt.friday,
      saturday: apt.saturday,
      sunday: apt.sunday,
      pet: {
        id: apt.pet.id,
        name: apt.pet.name,
        address: apt.pet.address,
        behavioral_notes: apt.pet.behavioral_notes,
        supplies_location: apt.pet.supplies_location,
        allergies: apt.pet.allergies,
        profile_picture_url: if apt.pet.respond_to?(:profile_picture) && apt.pet.profile_picture.attached?
                               rails_blob_url(apt.pet.profile_picture,
                                              only_path: true)
                             end
      },
      is_covering: true,
      original_owner: {
        id: share.shared_by_user.id,
        name: share.shared_by_user.name,
        email: share.shared_by_user.email_address
      },
      my_percentage: share.covering_walker_percentage,
      can_complete: true,
      share_id: share.id
    }
  end
end
