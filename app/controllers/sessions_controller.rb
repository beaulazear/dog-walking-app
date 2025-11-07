class SessionsController < ApplicationController
  include JsonWebToken

  skip_before_action :authorized, only: :create

  # Creates a JWT token for authenticated user
  def create
    user = User.find_by(username: params[:username])
    if user&.authenticate(params[:password])
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
    # With JWT, logout is handled client-side by removing the token
    head :no_content
  end
end
