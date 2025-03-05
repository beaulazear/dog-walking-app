class PetsController < ApplicationController
  before_action :current_user

  def create
    pet = @current_user.pets.create(pet_params)
    if pet.valid?
      render json: pet.as_json(only: %i[id name birthdate sex spayed_neutered active behavorial_notes address]),
             status: :created
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
    Rails.logger.debug "PARAMS RECEIVED: #{params.inspect}"

    pet = @current_user.pets.find_by(id: params[:id])

    if pet
      if params[:profile_pic].present? && params[:profile_pic].is_a?(ActionDispatch::Http::UploadedFile)
        pet.profile_pic.attach(params[:profile_pic])
      end

      if pet.update(pet_params_update)
        render json: {
          name: pet.name,
          birthdate: pet.birthdate,
          sex: pet.sex,
          spayed_neutered: pet.spayed_neutered,
          address: pet.address,
          behavorial_notes: pet.behavorial_notes,
          supplies_location: pet.supplies_location,
          allergies: pet.allergies,
          active: pet.active,
          profile_pic: pet.profile_pic.attached? ? Rails.application.routes.url_helpers.rails_blob_url(pet.profile_pic, only_path: true) : nil
        }, status: :ok
      else
        render json: { errors: pet.errors.full_messages }, status: :unprocessable_entity
      end
    else
      render json: { error: 'Pet not found' }, status: :not_found
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
    params.permit(:name, :spayed_neutered, :supplies_location, :behavorial_notes,
                  :birthdate, :sex, :allergies, :address, :active, :profile_pic)
  end
end
