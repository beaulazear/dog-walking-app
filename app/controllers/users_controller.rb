class UsersController < ApplicationController
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
            pets: user.pets.as_json(only: [ :id, :name, :birthdate, :sex, :spayed_neutered, :address, :behavorial_notes, :supplies_location, :allergies, :active ]),
            appointments: user.appointments.as_json(
                only: [ :id, :pet_id, :appointment_date, :start_time, :end_time, :duration, :recurring, :solo, :completed, :canceled, 
                        :monday, :tuesday, :wednesday, :thursday, :friday, :saturday, :sunday ],
                include: { 
                    pet: { only: [ :id, :name ] },
                    cancellations: { only: [ :id, :date ] }
                }
            ),
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
