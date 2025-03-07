class InvoicesController < ApplicationController
  before_action :current_user

  def create
    pet = @current_user.pets.find_by(id: params[:pet_id])

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

    invoices = Invoice.find(id_array)

    invoices.each do |invoice|
      invoice.update(paid: true, pending: false)
    end

    render json: invoices.as_json(only: %i[id appointment_id pet_id date_completed compensation paid pending title cancelled]),
           status: :ok
  end

  def pending
    id_array = params[:id_array]

    invoices = Invoice.find(id_array)

    invoices.each do |invoice|
      invoice.update(pending: true)
    end

    render json: invoices.as_json(only: %i[id appointment_id pet_id date_completed compensation paid pending title cancelled]),
           status: :ok
  end

  def index
    invoices = Invoice.all
    render json: invoices.as_json(only: %i[id appointment_id pet_id date_completed compensation paid pending title cancelled]),
           status: :ok
  end

  def destroy
    invoice = Invoice.find(params[:id])

    if invoice

      invoice.destroy

      render json: invoice.as_json(only: %i[id appointment_id pet_id date_completed compensation paid pending title cancelled]),
             status: :ok

    else
      render json: { error: 'invoice not found' }, status: :not_found
    end
  end

  private

  def invoice_params
    params.require(:invoice).permit(:appointment_id, :pet_id, :date_completed, :walk_duration, :compensation,
                                    :paid, :id, :title, :cancelled)
  end
end
