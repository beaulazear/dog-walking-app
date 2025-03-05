class PetsController < ApplicationController
  before_action :current_user

  def create
    pet = @current_user.pets.create(pet_params)
    if pet.valid?
      render json: pet.as_json(only: %i[id name birthdate sex spayed_neutered active behavorial_notes address]), status: :created
    else
      render json: { errors: pet.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def index
    pets = @current_user.pets
    if pets
      render json: pets.as_json(only: %i[id name birthdate sex spayed_neutered active]), status: :ok
    else
      render json: { error: 'Not found' }, status: :not_found
    end
  end

  def update
    pet = @current_user.pets.find_by(id: params[:id])
    pet.update(pet_params_update)
    if pet.valid?
      render json: pet.as_json(only: %i[id name birthdate sex spayed_neutered address behavorial_notes supplies_location allergies active]),
             status: :ok
    else
      render json: { errors: pet.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    pet = @current_user.pets.find_by(id: params[:id])
    if pet
      pet.destroy
      render json: pet.as_json(only: %i[id name birthdate sex spayed_neutered active]), status: :ok
    else
      render json: { error: 'pet not found' }, status: :not_found
    end
  end

  def update_active_status
    pet = @current_user.pets.find_by(id: params[:id])
    if pet
      pet.update(active: params[:active])
      render json: pet.as_json(only: %i[id name birthdate sex spayed_neutered active]), status: :ok
    else
      render json: { error: 'Pet not found' }, status: :not_found
    end
  end

  private

  def pet_params
    params.require(:pet).permit(:user_id, :name, :spayed_neutered, :supplies_location, :behavorial_notes,
                                :birthdate, :sex, :allergies, :address, :profile_pic, :id, :active)
  end

  def pet_params_update
    params.require(:pet).permit(:user_id, :name, :spayed_neutered, :supplies_location, :behavorial_notes,
                                :birthdate, :sex, :allergies, :address, :profile_pic, :id, :active)
  end
end
