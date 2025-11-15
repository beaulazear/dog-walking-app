class InvoicesController < ApplicationController
  before_action :current_user

  def create
    pet = @current_user.pets.find_by(id: invoice_params[:pet_id])

    unless pet
      render json: { errors: ['Pet not found'] }, status: :not_found
      return
    end

    appointment = Appointment.find_by(id: invoice_params[:appointment_id])
    date = params[:invoice][:date_completed] ? Date.parse(params[:invoice][:date_completed]) : Date.today

    # Check if the appointment is shared and validate permissions
    if appointment
      # Check if current user has permission to complete

      can_complete = if appointment.user_id == @current_user.id
                       # Original owner can complete if NOT shared out on this date
                       !appointment.shared_out_on?(date, for_user: @current_user)
                     else
                       # Covering walker can complete if they're assigned to this date
                       appointment.covered_by?(@current_user, on_date: date)
                     end

      unless can_complete
        return render json: { error: 'You cannot complete this appointment on this date' }, status: :forbidden
      end

      # Check if this is a shared appointment
      share = appointment.appointment_shares.accepted.find do |s|
        s.covers_date?(date)
      end

      if share
        # Create split invoices for shared appointment
        return create_split_invoices(appointment, share, date, invoice_params)
      end
    end

    # Standard invoice creation for non-shared appointments
    invoice = pet.invoices.build(invoice_params)
    invoice.completed_by_user_id = @current_user.id

    if invoice.save
      # Auto-create training session if this is a training invoice
      training_session = nil
      if invoice.training_walk?
        begin
          training_session = invoice.create_training_session!
          @current_user.check_and_create_milestones!
        rescue StandardError => e
          Rails.logger.error "Failed to create training session: #{e.message}"
        end
      end

      render json: {
        invoice: invoice.as_json(only: %i[id appointment_id pet_id date_completed compensation paid pending title
                                          cancelled training_session_id is_shared split_percentage owner_amount
                                          walker_amount completed_by_user_id]),
        training_session: training_session&.as_json(include: { pet: { only: %i[id name] } }),
        new_milestone: training_session ? @current_user.milestones.uncelebrated.last : nil
      }, status: :created
    else
      render json: { errors: invoice.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def paid
    id_array = params[:id_array]
    pet_ids = @current_user.pets.pluck(:id)

    # Only find invoices that belong to current user's pets
    invoices = Invoice.where(pet_id: pet_ids, id: id_array)

    invoices.each do |invoice|
      invoice.update(paid: true, pending: false)
    end

    render json: invoices.as_json(only: %i[id appointment_id pet_id date_completed compensation paid pending title cancelled]),
           status: :ok
  end

  def pending
    id_array = params[:id_array]
    pet_ids = @current_user.pets.pluck(:id)

    # Only find invoices that belong to current user's pets
    invoices = Invoice.where(pet_id: pet_ids, id: id_array)

    invoices.each do |invoice|
      invoice.update(pending: true)
    end

    render json: invoices.as_json(only: %i[id appointment_id pet_id date_completed compensation paid pending title cancelled]),
           status: :ok
  end

  def index
    page = params[:page] || 1
    per_page = params[:per_page] || 50

    # Only return invoices for the current user's pets
    pet_ids = @current_user.pets.pluck(:id)
    invoices = Invoice.where(pet_id: pet_ids)
                      .order(date_completed: :desc)
                      .page(page)
                      .per(per_page)

    render json: {
      invoices: invoices.as_json(only: %i[id appointment_id pet_id date_completed compensation paid pending title
                                          cancelled]),
      pagination: {
        current_page: invoices.current_page,
        total_pages: invoices.total_pages,
        total_count: invoices.total_count,
        per_page: per_page.to_i
      }
    }, status: :ok
  end

  def destroy
    # Find invoice through user's pets to ensure authorization
    pet_ids = @current_user.pets.pluck(:id)
    invoice = Invoice.where(pet_id: pet_ids).find_by(id: params[:id])

    if invoice
      invoice.destroy
      render json: invoice.as_json(only: %i[id appointment_id pet_id date_completed compensation paid pending title cancelled]),
             status: :ok
    else
      render json: { error: 'Invoice not found or unauthorized' }, status: :not_found
    end
  end

  private

  def invoice_params
    params.require(:invoice).permit(:appointment_id, :pet_id, :date_completed, :walk_duration, :compensation,
                                    :paid, :id, :title, :cancelled)
  end

  def create_split_invoices(appointment, share, date, base_params)
    # Get the original owner (who shared the appointment)
    original_owner = share.shared_by_user

    # Calculate compensation based on ORIGINAL OWNER's rates, not covering walker's rates
    # Use the duration and walk_type from params
    duration = base_params[:walk_duration].to_i
    walk_type = appointment.walk_type || (appointment.solo ? 'solo' : 'group')

    # Base rate from original owner
    base_rate = case duration
                when 30 then original_owner.thirty
                when 45 then original_owner.fortyfive
                when 60 then original_owner.sixty
                else 0
                end

    # Add walk type upcharge from original owner
    upcharge = case walk_type
               when 'solo' then original_owner.solo_rate || 0
               when 'training' then original_owner.training_rate || 0
               when 'sibling' then original_owner.sibling_rate || 0
               else 0
               end

    total_compensation = base_rate + upcharge
    split = share.calculate_split(total_compensation)

    training_session = nil
    errors = []

    # Create WalkerEarning for covering walker
    # This represents what the ORIGINAL OWNER owes the covering walker (not what client owes)
    walker_earning = WalkerEarning.new(
      appointment_id: appointment.id,
      walker_id: share.shared_with_user_id,
      appointment_share_id: share.id,
      pet_id: appointment.pet_id,
      date_completed: date,
      compensation: split[:covering],
      split_percentage: share.covering_walker_percentage,
      paid: false,
      pending: false,
      title: base_params[:title]
    )

    errors << walker_earning.errors.full_messages unless walker_earning.save

    # Create Invoice for original owner
    # Client pays the FULL AMOUNT to the original owner
    # Original owner then pays the covering walker separately (tracked via WalkerEarning above)
    original_invoice = Invoice.new(
      appointment_id: appointment.id,
      pet_id: appointment.pet_id,
      date_completed: base_params[:date_completed],
      compensation: total_compensation, # FULL amount (not split)
      paid: false,
      title: base_params[:title],
      is_shared: true,
      split_percentage: 100, # Client pays 100% to original owner
      completed_by_user_id: @current_user.id
    )

    errors << original_invoice.errors.full_messages unless original_invoice.save

    # Auto-create training session if this is a training walk for the covering walker
    if errors.empty? && walker_earning.training_walk?
      begin
        training_session = walker_earning.create_training_session!
        User.find(share.shared_with_user_id).check_and_create_milestones!
      rescue StandardError => e
        Rails.logger.error "Failed to create training session: #{e.message}"
      end
    end

    if errors.empty?
      render json: {
        invoice: original_invoice.as_json(only: %i[id appointment_id pet_id date_completed compensation paid pending
                                                   title cancelled is_shared split_percentage completed_by_user_id]),
        walker_earning: walker_earning.as_json(only: %i[id appointment_id walker_id pet_id date_completed
                                                        compensation split_percentage paid pending title]),
        training_session: training_session&.as_json(include: { pet: { only: %i[id name] } }),
        new_milestone: training_session ? User.find(share.shared_with_user_id).milestones.uncelebrated.last : nil,
        is_split: true
      }, status: :created
    else
      render json: { errors: errors.flatten }, status: :unprocessable_entity
    end
  end
end
