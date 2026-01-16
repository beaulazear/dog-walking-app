class ClientSessionsController < ApplicationController
  skip_before_action :authorized, only: [:create]

  # POST /client/login
  def create
    client = Client.find_by(email: params[:email]&.downcase)

    if client&.authenticate(params[:password])
      token = jwt_encode(client_id: client.id, user_type: 'client')

      render json: {
        token: token,
        client: ClientSerializer.serialize(client)
      }, status: :ok
    else
      render json: { error: 'Invalid email or password' }, status: :unauthorized
    end
  end

  # DELETE /client/logout
  def destroy
    # With JWT, logout is handled client-side by removing the token
    head :no_content
  end
end
