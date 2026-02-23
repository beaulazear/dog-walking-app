class SessionsController < ApplicationController
  include JsonWebToken

  skip_before_action :authorized, only: %i[create destroy]

  # Creates a JWT token for authenticated user (and sets session for web app compatibility)
  # Accepts either username OR email for login
  def create
    # Find user by username OR email (supports both Scoopers and Pocket Walks)
    user = User.find_by(username: params[:username]) ||
           User.find_by(email_address: params[:email])

    if user&.authenticate(params[:password])
      # Track which app the user is logging in from (Scoopers vs Pocket Walks)
      if params[:app].present?
        case params[:app]
        when "scoopers"
          user.update(uses_scoopers: true) unless user.uses_scoopers
        when "pocket_walks"
          user.update(uses_pocket_walks: true) unless user.uses_pocket_walks
        end
      end

      # Set session for web app compatibility
      session[:user_id] = user.id

      # Generate JWT token for mobile app
      token = jwt_encode(user_id: user.id)

      render json: {
        token: token,
        user: UserSerializer.serialize(user)
      }, status: :ok
    else
      render json: { error: "Invalid username or password" }, status: :unauthorized
    end
  end

  def destroy
    # Clear session for web app
    session.delete(:user_id)

    # With JWT, logout is handled client-side by removing the token
    head :no_content
  end
end
