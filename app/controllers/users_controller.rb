class UsersController < ApplicationController
  include Rails.application.routes.url_helpers
  include JsonWebToken

  before_action :current_user

  skip_before_action :authorized, only: :create

  def create
    user = User.create(user_params)
    if user.valid?
      # Set session for web app compatibility
      session[:user_id] = user.id

      # Generate JWT token for mobile app
      token = jwt_encode(user_id: user.id)

      render json: {
        token: token,
        user: UserSerializer.serialize(user)
      }, status: :created
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

  def search
    email = params[:email]&.downcase&.strip

    return render json: { error: 'Email parameter is required' }, status: :bad_request if email.blank?

    user = User.find_by('LOWER(email_address) = ?', email)

    return render json: { error: 'User not found' }, status: :not_found if user.nil?

    # Don't allow searching for yourself
    return render json: { error: 'Cannot search for yourself' }, status: :bad_request if user.id == @current_user.id

    render json: {
      id: user.id,
      name: user.name,
      username: user.username,
      email_address: user.email_address
    }
  end

  def change_rates
    user = @current_user

    user.update(rates_params)

    if user.valid?
      render json: UserSerializer.serialize(user), status: :ok
    else
      render json: { errors: user.errors.full_messages }, status: :unprocessable_entity
    end
  end

  private

  def user_params
    params.permit(:username, :password, :password_confirmation, :name, :email_address, :pets, :thirty, :fortyfive,
                  :sixty, :solo_rate, :training_rate, :sibling_rate)
  end

  def rates_params
    params.permit(:thirty, :fortyfive, :sixty, :solo_rate, :training_rate, :sibling_rate)
  end
end
