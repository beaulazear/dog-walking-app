class SessionsController < ApplicationController
  skip_before_action :authorized, only: :create

  # Creates a user session that persists for 1 week (configured in config/initializers/session_store.rb)
  def create
    user = User.find_by(username: params[:username])
    if user&.authenticate(params[:password])
      session[:user_id] = user.id
      render json: UserSerializer.serialize(user), status: :ok
    else
      render json: { error: 'Invalid username or password' }, status: :unauthorized
    end
  end

  def destroy
    session.delete :user_id
    head :no_content
  end
end
