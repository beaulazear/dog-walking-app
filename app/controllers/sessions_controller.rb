class SessionsController < ApplicationController
    skip_before_action :authorized, only: :create 
  
    def create
        user = User.find_by(username: params[:username])
        if user&.authenticate(params[:password])
          session[:user_id] = user.id
          render json: user_data(user), status: :ok
        else
          render json: { error: "Invalid username or password" }, status: :unauthorized
        end
    end
          
    def destroy
      session.delete :user_id
      head :no_content
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
            only: [ :id, :pet_id, :appointment_date, :start_time, :end_time, :duration, :solo, :recurring, :completed, :canceled, 
                    :monday, :tuesday, :wednesday, :thursday, :friday, :saturday, :sunday ],
            include: { pet: { only: [ :id, :name ] } }
        ),
          invoices: Invoice.where(pet_id: user.pets.pluck(:id)).as_json(only: [ :id, :appointment_id, :pet_id, :date_completed, :compensation, :paid, :pending, :title, :cancelled ])
      }
  end
end
