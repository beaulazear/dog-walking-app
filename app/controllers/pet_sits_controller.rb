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
    render json: { error: 'Invalid date format' }, status: :bad_request
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

    completion = pet_sit.pet_sit_completions.build(
      completion_date: completion_date,
      completed_at: Time.current,
      completed_by_user_id: current_user.id
    )

    if completion.save
      # Invoice created automatically via callback
      invoice = Invoice.find_by(pet_sit_id: pet_sit.id, date_completed: completion_date)
      render json: { pet_sit: pet_sit, completion: completion, invoice: invoice }, status: :created
    else
      render json: { errors: completion.errors.full_messages }, status: :unprocessable_entity
    end
  rescue ArgumentError
    render json: { error: 'Invalid date format' }, status: :bad_request
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
    render json: { error: 'Pet sit not found' }, status: :not_found
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
