class AppointmentSharesController < ApplicationController
  before_action :set_share, only: %i[accept decline destroy]

  # GET /appointment_shares
  # Returns all appointment shares for the current user (both sent and received)
  def index
    # Received shares (pending only - for notifications)
    received_pending = @current_user.received_appointment_shares
                                    .pending
                                    .includes(appointment: %i[pet user])
                                    .order(created_at: :desc)

    # All received shares (for history)
    received_all = @current_user.received_appointment_shares
                                .includes(appointment: %i[pet user])
                                .order(created_at: :desc)

    # Sent shares
    sent = @current_user.shared_appointments
                        .includes(appointment: [:pet], shared_with_user: [])
                        .order(created_at: :desc)

    render json: {
      received_pending: format_shares(received_pending, :received),
      received_all: format_shares(received_all, :received),
      sent: format_shares(sent, :sent)
    }
  end

  # POST /appointment_shares
  # Share one or more appointments with another user
  def create
    # Extract params from nested appointment_share object if present
    share_params = params[:appointment_share] || params

    shared_with_user = User.find_by(id: share_params[:shared_with_user_id])

    return render json: { error: 'User not found' }, status: :not_found if shared_with_user.nil?

    # Check if users are connected
    unless users_connected?(@current_user.id, shared_with_user.id)
      return render json: { error: 'You must be connected with this user to share appointments' },
                    status: :forbidden
    end

    appointment_ids = share_params[:appointment_ids] || [share_params[:appointment_id]].compact

    return render json: { error: 'No appointments specified' }, status: :bad_request if appointment_ids.empty?

    # Validate covering_walker_percentage is provided
    covering_percentage = share_params[:covering_walker_percentage]
    if covering_percentage.nil? || covering_percentage.to_i.negative? || covering_percentage.to_i > 100
      return render json: { error: 'Invalid covering_walker_percentage. Must be between 0 and 100.' },
                    status: :bad_request
    end

    # Find appointments that belong to the current user
    appointments = Appointment.joins(:pet)
                              .where(pets: { user_id: @current_user.id })
                              .where(id: appointment_ids)

    return render json: { error: 'No valid appointments found' }, status: :not_found if appointments.empty?

    shares_created = []
    errors = []

    appointments.each do |appointment|
      # Handle recurring appointments by creating one-time clones for each selected date
      if appointment.recurring && share_params[:share_dates].present? && share_params[:share_dates].is_a?(Array)
        share_params[:share_dates].each do |date_str|
          date = Date.parse(date_str)

          # Create a one-time clone of the recurring appointment for this specific date
          cloned_appointment = Appointment.create!(
            user_id: appointment.user_id,
            pet_id: appointment.pet_id,
            recurring: false, # Make it one-time
            appointment_date: date,
            start_time: appointment.start_time,
            end_time: appointment.end_time,
            duration: appointment.duration,
            price: appointment.price,
            cloned_from_appointment_id: appointment.id # Track the source
          )

          # Create share for the cloned appointment
          share = AppointmentShare.new(
            appointment: cloned_appointment,
            shared_by_user: @current_user,
            shared_with_user: shared_with_user,
            covering_walker_percentage: covering_percentage,
            recurring_share: false
          )

          if share.save
            shares_created << format_share(share, :sent)
          else
            errors << { appointment_id: appointment.id, date: date_str, errors: share.errors.full_messages }
            cloned_appointment.destroy # Clean up if share creation fails
          end
        rescue StandardError => e
          errors << { appointment_id: appointment.id, date: date_str, errors: ["Error: #{e.message}"] }
        end
      else
        # Handle non-recurring appointments normally
        share = AppointmentShare.new(
          appointment: appointment,
          shared_by_user: @current_user,
          shared_with_user: shared_with_user,
          covering_walker_percentage: covering_percentage,
          recurring_share: false
        )

        if share.save
          shares_created << format_share(share, :sent)
        else
          errors << { appointment_id: appointment.id, errors: share.errors.full_messages }
        end
      end
    end

    render json: {
      message: "#{shares_created.count} appointment(s) shared successfully",
      shares: shares_created,
      errors: errors
    }, status: :created
  end

  # PATCH /appointment_shares/:id/accept
  def accept
    return render json: { error: 'Not authorized' }, status: :forbidden unless authorized_to_respond?

    if @share.accept!
      render json: {
        message: 'Appointment share accepted',
        share: format_share(@share, :received)
      }
    else
      render json: { errors: @share.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # PATCH /appointment_shares/:id/decline
  def decline
    return render json: { error: 'Not authorized' }, status: :forbidden unless authorized_to_respond?

    if @share.decline!
      render json: { message: 'Appointment share declined' }
    else
      render json: { errors: @share.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # DELETE /appointment_shares/:id
  def destroy
    return render json: { error: 'Not authorized' }, status: :forbidden unless authorized_to_manage?

    appointment = @share.appointment
    @share.destroy

    # Reset appointment delegation status if no more accepted shares exist
    appointment.update(delegation_status: 'none') if appointment.appointment_shares.accepted.none?

    render json: { message: 'Appointment unshared successfully' }
  end

  # GET /appointment_shares/my_shared_appointments
  # Returns appointments that have been shared WITH the current user (accepted only)
  def my_shared_appointments
    accepted_shares = @current_user.received_appointment_shares
                                   .accepted
                                   .includes(appointment: %i[pet user])
                                   .order('appointments.appointment_date ASC')

    appointments = accepted_shares.map do |share|
      appointment = share.appointment
      {
        id: appointment.id,
        appointment_date: appointment.appointment_date,
        start_time: appointment.start_time,
        end_time: appointment.end_time,
        duration: appointment.duration,
        price: appointment.price,
        walk_type: appointment.walk_type,
        completed: appointment.completed,
        canceled: appointment.canceled,
        delegation_status: appointment.delegation_status,
        pet: {
          id: appointment.pet.id,
          name: appointment.pet.name,
          address: appointment.pet.address,
          behavioral_notes: appointment.pet.behavioral_notes,
          supplies_location: appointment.pet.supplies_location,
          allergies: appointment.pet.allergies,
          profile_picture_url: if appointment.pet.respond_to?(:profile_picture) && appointment.pet.profile_picture.attached?
                                 Rails.application.routes.url_helpers.rails_blob_url(appointment.pet.profile_picture,
                                                                                     only_path: true)
                               end
        },
        shared_by: {
          id: share.shared_by_user.id,
          name: share.shared_by_user.name
        },
        share_id: share.id
      }
    end

    render json: appointments
  end

  private

  def set_share
    @share = AppointmentShare.find_by(id: params[:id])

    return if @share && (@share.shared_by_user_id == @current_user.id || @share.shared_with_user_id == @current_user.id)

    render json: { error: 'Share not found' }, status: :not_found
  end

  def authorized_to_respond?
    @share.shared_with_user_id == @current_user.id && @share.status == 'pending'
  end

  def authorized_to_manage?
    @share.shared_by_user_id == @current_user.id || @share.shared_with_user_id == @current_user.id
  end

  def users_connected?(user1_id, user2_id)
    WalkerConnection.accepted.where(
      '(user_id = ? AND connected_user_id = ?) OR (user_id = ? AND connected_user_id = ?)',
      user1_id, user2_id, user2_id, user1_id
    ).exists?
  end

  def format_shares(shares, direction)
    shares.map { |share| format_share(share, direction) }
  end

  def format_share(share, direction)
    appointment = share.appointment
    other_user = direction == :received ? share.shared_by_user : share.shared_with_user

    {
      id: share.id,
      status: share.status,
      recurring_share: share.recurring_share,
      covering_walker_percentage: share.covering_walker_percentage || 50,
      original_walker_percentage: 100 - (share.covering_walker_percentage || 50),
      share_dates: share.share_dates.pluck(:date),
      created_at: share.created_at,
      shared_by: {
        id: share.shared_by_user.id,
        name: share.shared_by_user.name,
        username: share.shared_by_user.username
      },
      shared_with: {
        id: share.shared_with_user.id,
        name: share.shared_with_user.name,
        username: share.shared_with_user.username
      },
      other_user: {
        id: other_user.id,
        name: other_user.name,
        username: other_user.username
      },
      appointment: {
        id: appointment.id,
        appointment_date: appointment.appointment_date,
        start_time: appointment.start_time,
        end_time: appointment.end_time,
        duration: appointment.duration,
        price: appointment.price,
        completed: appointment.completed,
        canceled: appointment.canceled,
        delegation_status: appointment.delegation_status,
        recurring: appointment.recurring,
        pet: {
          id: appointment.pet.id,
          name: appointment.pet.name,
          address: direction == :received ? appointment.pet.address : nil,
          behavioral_notes: direction == :received ? appointment.pet.behavioral_notes : nil,
          supplies_location: direction == :received ? appointment.pet.supplies_location : nil,
          allergies: direction == :received ? appointment.pet.allergies : nil
        }
      }
    }
  end
end
