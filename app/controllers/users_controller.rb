class UsersController < ApplicationController
    include Rails.application.routes.url_helpers

    before_action :current_user

    skip_before_action :authorized, only: :create

    def create
        user = User.create(user_params)
        if user.valid?
            session[:user_id] = user.id
            render json: user_data(user), status: :created
        else
            render json: { errors: user.errors.full_messages }, status: :unprocessable_entity
        end
    end

    def index
        users = User.all
        if users
            render json: users.map { |user| user_data(user) }, status: :ok
        else
            render json: {  error: "Not found" }, status: :not_found
        end
    end

    def show
        user = @current_user
        if user
            render json: user_data(user), status: :ok
        else
            render json: { error: "Not authorized" }, status: :unauthorized
        end
    end

    def change_rates
        user = User.find(session[:user_id])

        user.update(rates_params)

        if user.valid?
            render json: user_data(user), status: :ok
        else
            render json: {errors: user.errors.full_messages}, status: :unprocessable_entity
        end
    end

    private

    def user_data(user)
        {
          id: user.id,
          username: user.username,
          name: user.name,
          email_address: user.email_address,
          thirty: user.thirty,
          fourty: user.fourty,
          sixty: user.sixty,
          solo_rate: user.solo_rate,
          pets: user.pets.map do |pet|
            {
              id: pet.id,
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
            }
          end,   
          appointments: user.appointments.map do |appointment|
            {
              id: appointment.id,
              pet_id: appointment.pet_id,
              appointment_date: appointment.appointment_date,
              start_time: appointment.start_time,
              end_time: appointment.end_time,
              duration: appointment.duration,
              recurring: appointment.recurring,
              solo: appointment.solo,
              completed: appointment.completed,
              canceled: appointment.canceled,
              monday: appointment.monday,
              tuesday: appointment.tuesday,
              wednesday: appointment.wednesday,
              thursday: appointment.thursday,
              friday: appointment.friday,
              saturday: appointment.saturday,
              sunday: appointment.sunday,
              pet: {
                id: appointment.pet.id,
                name: appointment.pet.name,
                profile_pic: appointment.pet.profile_pic.attached? ? Rails.application.routes.url_helpers.rails_blob_url(appointment.pet.profile_pic, only_path: true) : nil
              },
              cancellations: appointment.cancellations.map { |c| { id: c.id, date: c.date } }
            }
          end,
          invoices: Invoice.where(pet_id: user.pets.pluck(:id)).as_json(only: [ :id, :appointment_id, :pet_id, :date_completed, :compensation, :paid, :pending, :title, :cancelled ])
        }
      end

    def user_params
        params.permit(:username, :password, :password_confirmation, :name, :email_address, :pets, :thirty, :fourty, :sixty, :solo_rate)
    end

    def rates_params
        params.permit(:thirty, :fourty, :sixty, :solo_rate)
    end
end
