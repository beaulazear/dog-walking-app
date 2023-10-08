class PetsController < ApplicationController
    before_action :current_user

    def create
        pet = @current_user.pets.create(pet_params)
        if pet.valid?
            render json: pet, status: :created
        else
            render json: { errors: pet.errors.full_messages }, status: :unprocessable_entity
        end
    end

    def index
        pets = @current_user.pets
        if pets
            render json: pets
        else
            render json: {  error: "Not found" }, status: :not_found
        end
    end

    def update
        pet =  @current_user.pets.find_by(id: params[:id])
        pet.update(pet_params)
        if pet.valid?
            render json: pet, status: :created
        else
            render json: { errors: pet.errors.full_messages }, status: :unprocessable_entity
        end
    end

    private

    def pet_params
        params.require(:pet).permit(:user_id, :name, :spayed_neutered, :supplies_location, :behavorial_notes, :birthdate, :sex, :allergies, :address)
    end
end
