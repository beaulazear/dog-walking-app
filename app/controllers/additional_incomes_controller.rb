class AdditionalIncomesController < ApplicationController
  before_action :current_user

  def index
    # Only return additional incomes for the current user's pets
    pet_ids = @current_user.pets.pluck(:id)
    additional_incomes = AdditionalIncome.where(pet_id: pet_ids)
    render json: additional_incomes.as_json(only: %i[id pet_id date_added description compensation]),
           status: :ok
  end

  def create
    # Verify the pet belongs to the current user
    pet = @current_user.pets.find_by(id: additional_income_params[:pet_id])

    return render json: { error: 'Pet not found or unauthorized' }, status: :not_found unless pet

    additional_income = AdditionalIncome.create(additional_income_params)

    if additional_income.valid?
      render json: additional_income.as_json(only: %i[id pet_id date_added description compensation]),
             status: :created
    else
      render json: { errors: additional_income.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    # Ensure user can only delete their own additional incomes
    pet_ids = @current_user.pets.pluck(:id)
    income = AdditionalIncome.find_by(id: params[:id], pet_id: pet_ids)

    if income
      income.destroy
      render json: income.as_json(only: %i[id pet_id date_added description compensation]),
             status: :ok
    else
      render json: { error: 'Income not found or unauthorized' }, status: :not_found
    end
  end

  private

  def additional_income_params
    params.permit(:pet_id, :date_added, :description, :id, :compensation)
  end
end
