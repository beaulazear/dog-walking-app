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
    
    def update
        invoice = Invoice.find_by(id: params[:id])
        if invoice
            invoice.update(invoice_params)
            render json: invoice
        else
            render json: { errors: invoice.errors.full_messages }, status: :unprocessable_entity
        end
    end

    def paid
        id_array = params[:id_array]

        id_array.each do |id|
            
            puts id
            print id

            invoice = Invoice.find_by(id: id.to_int)
            invoice.update(id: id.to_int)

            if invoice.valid?
                render json: id_array
            else
                render json: { errors: invoice.errors.full_messages }, status: :unprocessable_entity
            end
        end
    end

    def index
        invoices = Invoice.all
        render json: invoices
    end


    private

    def invoice_params
        params.permit(:appointment_id, :pet_id, :date_completed, :walk_duration, :compensation, :paid, :id)
    end
end
