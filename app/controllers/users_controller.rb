class UsersController < ApplicationController
  include Rails.application.routes.url_helpers

  before_action :current_user

  skip_before_action :authorized, only: :create

  def create
    user = User.create(user_params)
    if user.valid?
      session[:user_id] = user.id
      render json: UserSerializer.serialize(user), status: :created
    else
      render json: { errors: user.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def index
    # WARNING: This endpoint returns ALL users - should probably be removed or restricted
    users = User.all
    if users.any?
      render json: users.map { |user| UserSerializer.serialize_basic(user) }, status: :ok
    else
      render json: { error: 'Not found' }, status: :not_found
    end
  end

  def show
    user = @current_user
    if user
      render json: UserSerializer.serialize(user), status: :ok
    else
      render json: { error: 'Not authorized' }, status: :unauthorized
    end
  end

  def change_rates
    user = User.find(session[:user_id])

    user.update(rates_params)

    if user.valid?
      render json: UserSerializer.serialize(user), status: :ok
    else
      render json: { errors: user.errors.full_messages }, status: :unprocessable_entity
    end
  end

  private

  def user_params
    params.permit(:username, :password, :password_confirmation, :name, :email_address, :pets, :thirty, :fourty,
                  :sixty, :solo_rate)
  end

  def rates_params
    params.permit(:thirty, :fourty, :sixty, :solo_rate)
  end
end
