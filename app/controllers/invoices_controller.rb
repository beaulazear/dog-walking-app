class InvoicesController < ApplicationController
  before_action :current_user

  def create
    pet = @current_user.pets.find_by(id: invoice_params[:pet_id])

    unless pet
      render json: { errors: ['Pet not found'] }, status: :not_found
      return
    end

    invoice = pet.invoices.build(invoice_params)

    # Handle split invoices
    if params[:invoice][:split_percentage].present? && params[:invoice][:completed_by_user_id].present?
      invoice.completed_by_user_id = params[:invoice][:completed_by_user_id]
      invoice.is_shared = true
    end

    if invoice.save
      # Calculate split amounts if this is a shared invoice
      if invoice.is_shared && params[:invoice][:split_percentage].present?
        invoice.calculate_split!(params[:invoice][:split_percentage].to_f)
      end

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
end
