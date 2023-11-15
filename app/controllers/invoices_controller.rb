class InvoicesController < ApplicationController
    before_action :current_user

    # writes custom method that checks validaity, returns true or false... "check owner" argument is user ID, look at current user,  invoice, appointment, make sure theyre all connected.

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
        
        id_array = params[:id_array]
    
        invoices = Invoice.find(id_array)

        invoices.each do |invoice|

            invoice.update(paid: true)

        end

        render json: invoices

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
