class InvoicesController < ApplicationController
    before_action :current_user

    def create
        invoice = @current_user.invoices.create(invoice_params)
        if invoice.valid?
            render json: invoice, status: :created
        else
            render json: { errors: invoice.errorrs.full_messages }, status: :unprocessable_entity
        end
    end

    def index
        invoices = @current_user.invoices
        if invoices
            render json: invoices
        else
            render json: { error: "Not found" }, status: :not_found
        end
    end

    private

    def invoice_params
        params.permit(:appointment_id, :pet_id, :date_completed, :walk_duration, :compensation, :paid)
    end
end
