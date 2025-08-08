class InvoicesController < ApplicationController
  before_action :current_user

  def create
    pet = @current_user.pets.find_by(id: invoice_params[:pet_id])
    
    unless pet
      render json: { errors: ['Pet not found'] }, status: :not_found
      return
    end

    invoice = pet.invoices.build(invoice_params)

    if invoice.save
      render json: invoice.as_json(only: %i[id appointment_id pet_id date_completed compensation paid pending title cancelled]),
             status: :created
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
    # Only return invoices for the current user's pets
    pet_ids = @current_user.pets.pluck(:id)
    invoices = Invoice.where(pet_id: pet_ids)
    render json: invoices.as_json(only: %i[id appointment_id pet_id date_completed compensation paid pending title cancelled]),
           status: :ok
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
