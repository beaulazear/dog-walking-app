class InvoicesController < ApplicationController
    before_action :current_user

    def create
        pet = @current_user.pets.find_by(id: params[:pet_id])
        invoice = pet.invoices.create(invoice_params)
        if invoice.valid?
            render json: invoice, status: :created
        else
            render json: { errors: invoice.errors.full_messages }, status: :unprocessable_entity
        end
    end

    def paid
        invoice = Invoice.find_by(id: params[:id])
        invoice.update(paid: true)
        if invoice.valid?
            render json: invoice
        else
            render json: { error: "not found" }, status: :not_found
        end
    end

    private

    def invoice_params
        params.permit(:appointment_id, :pet_id, :date_completed, :walk_duration, :compensation, :paid)
    end
end
