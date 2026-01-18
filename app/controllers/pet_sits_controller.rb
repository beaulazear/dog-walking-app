class PetSitsController < ApplicationController
  before_action :current_user
  before_action :set_pet_sit, only: %i[show update destroy]

  # GET /pet_sits
  def index
    pet_sits = current_user.pet_sits.includes(:pet, :pet_sit_completions)
    render json: pet_sits
  end

  # GET /pet_sits/:id
  def show
    render json: @pet_sit
  end

  # GET /pet_sits/for_date?date=2026-01-15
  def for_date
    date = Date.parse(params[:date])
    pet_sits = current_user.pet_sits.active.for_date(date).includes(:pet, :pet_sit_completions)
    render json: pet_sits
  rescue ArgumentError
    render json: { error: "Invalid date format" }, status: :bad_request
  end

  # POST /pet_sits
  def create
    pet_sit = current_user.pet_sits.build(pet_sit_params)

    # Auto-set daily_rate from user's pet_sitting_rate if not provided
    pet_sit.daily_rate ||= current_user.pet_sitting_rate || 0

    if pet_sit.save
      render json: pet_sit, status: :created
    else
      render json: { errors: pet_sit.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # PATCH /pet_sits/:id
  def update
    if @pet_sit.update(pet_sit_params)
      render json: @pet_sit
    else
      render json: { errors: @pet_sit.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # DELETE /pet_sits/:id
  def destroy
    @pet_sit.destroy
    head :no_content
  end

  # POST /pet_sits/:id/complete_day
  # Body: { completion_date: '2026-01-15' }
  def complete_day
    pet_sit = current_user.pet_sits.find(params[:id])
    completion_date = Date.parse(params[:completion_date])

    completion = nil
    invoice = nil

    # Wrap in transaction to ensure completion and invoice are created together
    ActiveRecord::Base.transaction do
      completion = pet_sit.pet_sit_completions.build(
        completion_date: completion_date,
        completed_at: Time.current,
        completed_by_user_id: current_user.id
      )

      unless completion.save
        render json: { errors: completion.errors.full_messages }, status: :unprocessable_entity
        raise ActiveRecord::Rollback
      end

      # Invoice created automatically via callback - verify it exists
      # Use date range to account for datetime vs date comparison
      invoice = Invoice.where(pet_sit_id: pet_sit.id)
                       .where("DATE(date_completed) = ?", completion_date)
                       .first

      unless invoice
        Rails.logger.error "Invoice was not created for pet sit completion #{completion.id}"
        render json: { errors: [ "Failed to create invoice for completion" ] }, status: :unprocessable_entity
        raise ActiveRecord::Rollback
      end

      # Reload pet_sit to get updated associations
      pet_sit.reload

      render json: { pet_sit: pet_sit, completion: completion, invoice: invoice }, status: :created
    end
  rescue ArgumentError
    render json: { error: "Invalid date format" }, status: :bad_request
  rescue ActiveRecord::RecordNotFound => e
    render json: { error: e.message }, status: :not_found
  end

  # GET /pet_sits/upcoming
  def upcoming
    pet_sits = current_user.pet_sits.active.upcoming.includes(:pet)
    render json: pet_sits
  end

  # GET /pet_sits/current
  def current
    pet_sits = current_user.pet_sits.active.current.includes(:pet)
    render json: pet_sits
  end

  private

  def set_pet_sit
    @pet_sit = current_user.pet_sits.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    render json: { error: "Pet sit not found" }, status: :not_found
  end

  def pet_sit_params
    params.permit(
      :pet_id,
      :start_date,
      :end_date,
      :daily_rate,
      :additional_charge,
      :description,
      :canceled
    )
  end
end
