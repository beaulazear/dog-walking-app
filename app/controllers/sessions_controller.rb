class SessionsController < ApplicationController
  include JsonWebToken

  skip_before_action :authorized, only: %i[create destroy]

  # Creates a JWT token for authenticated user (and sets session for web app compatibility)
  def create
    user = User.find_by(username: params[:username])
    if user&.authenticate(params[:password])
      # Set session for web app compatibility
      session[:user_id] = user.id

      # Generate JWT token for mobile app
      token = jwt_encode(user_id: user.id)

      render json: {
        token: token,
        user: UserSerializer.serialize(user)
      }, status: :ok
    else
      render json: { error: 'Invalid username or password' }, status: :unauthorized
    end
  end

  def destroy
    # Clear session for web app
    session.delete(:user_id)

    # With JWT, logout is handled client-side by removing the token
    head :no_content
  end
end
