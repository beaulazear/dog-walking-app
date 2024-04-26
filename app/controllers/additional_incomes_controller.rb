class AdditionalIncomesController < ApplicationController
    before_action :current_user

    def index
        additional_incomes = AdditionalIncome.all
        render json: additional_incomes
    end

    def create
        additional_income = AdditionalIncome.create(additional_income_params)

        if additional_income.valid?
            render json: additional_income, status: :created
        else
            render json: { errors: additional_income.errors.full_messages }, status: :unprocessable_entity
        end
    end

    private

    def additional_income_params
        params.permit(:pet_id, :date_added, :description, :id, :compensation)
    end
end
