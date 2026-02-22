class UsersController < ApplicationController
  include Rails.application.routes.url_helpers
  include JsonWebToken

  before_action :current_user

  skip_before_action :authorized, only: :create

  def create
    # SECURITY: Separate signup params from rate params to prevent mass assignment
    user = User.new(
      username: params[:username],
      password: params[:password],
      password_confirmation: params[:password_confirmation],
      name: params[:name],
      email_address: params[:email] || params[:email_address]
    )

    if user.save
      # Set default rates for Pocket Walks users only
      if params[:registered_from_app] == 'pocket_walks' || params[:uses_pocket_walks]
        user.update(
          thirty: 30,
          fortyfive: 40,
          sixty: 50,
          solo_rate: 15,
          training_rate: 25,
          sibling_rate: 10,
          pet_sitting_rate: 50
        )
      end

      # Update app separation fields and Scoopers-specific fields
      updates = {}

      # App tracking fields
      if params[:registered_from_app].present?
        updates[:registered_from_app] = params[:registered_from_app]
      end
      if params[:uses_scoopers] == true
        updates[:uses_scoopers] = true
      end
      if params[:uses_pocket_walks] == true
        updates[:uses_pocket_walks] = true
      end

      # Role flags
      if params[:is_dog_walker] == true
        updates[:is_dog_walker] = true
      end
      if params[:is_scooper] == true
        updates[:is_scooper] = true
      end
      if params[:is_poster] == true
        updates[:is_poster] = true
      end

      # Dog walker profile fields
      if params[:business_name].present?
        updates[:business_name] = params[:business_name]
      end
      if params[:instagram_handle].present?
        updates[:instagram_handle] = params[:instagram_handle]
      end
      if params[:neighborhoods].present?
        updates[:neighborhoods] = params[:neighborhoods]
      end
      if params[:custom_pin].present?
        updates[:custom_pin] = params[:custom_pin]
      end

      # Apply all updates at once
      user.update(updates) unless updates.empty?

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
    # SECURITY: User enumeration endpoint has been disabled for security reasons.
    # Use the /users/search endpoint with an email address to find specific users.
    render json: {
      error: "This endpoint is no longer available. Use /users/search with an email address to find specific users."
    }, status: :forbidden
  end

  def show
    user = @current_user
    if user
      render json: UserSerializer.serialize(user), status: :ok
    else
      render json: { error: "Not authorized" }, status: :unauthorized
    end
  end

  def search
    email = params[:email]&.downcase&.strip

    return render json: { error: "Email parameter is required" }, status: :bad_request if email.blank?

    user = User.find_by("LOWER(email_address) = ?", email)

    return render json: { error: "User not found" }, status: :not_found if user.nil?

    # Don't allow searching for yourself
    return render json: { error: "Cannot search for yourself" }, status: :bad_request if user.id == @current_user.id

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

  def update_profile
    user = @current_user

    # Check if username is being updated and if it's already taken
    if params[:username].present? && params[:username] != user.username
      existing_user = User.find_by(username: params[:username])
      if existing_user && existing_user.id != user.id
        return render json: { error: "Username is already taken" }, status: :unprocessable_entity
      end
    end

    # Update profile (including profile pic if provided)
    if user.update(profile_params)
      render json: UserSerializer.serialize(user), status: :ok
    else
      render json: { error: user.errors.full_messages.first || "Failed to update profile" },
             status: :unprocessable_entity
    end
  end

  # POST /users/register_device
  # Register device token for push notifications
  def register_device
    user = @current_user

    if user.update(device_params)
      render json: {
        message: "Device registered successfully",
        device_platform: user.device_platform
      }, status: :ok
    else
      render json: { error: "Failed to register device" }, status: :unprocessable_entity
    end
  end

  # POST /users/upload_profile_photo
  # Simple endpoint to test S3 uploads
  def upload_profile_photo
    user = @current_user

    unless params[:profile_pic].present?
      return render json: { error: "No photo provided" }, status: :unprocessable_entity
    end

    if user.update(profile_pic: params[:profile_pic])
      render json: {
        message: "Profile photo uploaded successfully",
        profile_pic_url: user.profile_pic_url,
        user: UserSerializer.serialize_basic(user)
      }, status: :ok
    else
      render json: { error: "Failed to upload photo" }, status: :unprocessable_entity
    end
  end

  # PATCH /users/toggle_roles
  # Toggle between poster and dog walker roles
  # Users can be both at the same time
  def toggle_roles
    user = @current_user

    if user.update(role_params)
      render json: {
        message: "Roles updated successfully",
        is_poster: user.is_poster,
        is_dog_walker: user.is_dog_walker,
        user: UserSerializer.serialize(user)
      }, status: :ok
    else
      render json: { error: user.errors.full_messages.first || "Failed to update roles" },
             status: :unprocessable_entity
    end
  end

  private

  def user_params
    # NOTE: This method is kept for backwards compatibility but is no longer used in create action
    # Rates are now set via default values or through the change_rates endpoint
    params.permit(:username, :password, :password_confirmation, :name, :email_address)
  end

  def rates_params
    params.permit(:thirty, :fortyfive, :sixty, :solo_rate, :training_rate, :sibling_rate, :pet_sitting_rate)
  end

  def profile_params
    params.permit(
      :name,
      :username,
      :email_address,
      :profile_pic,
      :custom_pin,
      :business_name,
      :instagram_handle,
      neighborhoods: []
    )
  end

  def device_params
    params.permit(:device_token, :device_platform)
  end

  def role_params
    params.permit(
      :is_poster,
      :is_dog_walker,
      :instagram_handle,
      :business_name,
      neighborhoods: []
    )
  end
end
