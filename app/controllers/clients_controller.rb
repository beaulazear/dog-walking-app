class ClientsController < ApplicationController
  skip_before_action :authorized, only: [ :create ]
  before_action :authorize_client, except: [ :create ]
  before_action :set_client, only: %i[show update update_push_token]

  # GET /client/me
  def show
    render json: ClientSerializer.serialize_with_details(@client)
  end

  # POST /client/signup
  def create
    client = Client.new(client_params)

    if client.save
      token = jwt_encode(client_id: client.id, user_type: "client")

      render json: {
        token: token,
        client: ClientSerializer.serialize(client)
      }, status: :created
    else
      render json: { errors: client.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # PATCH /client/me
  def update
    if @client.update(client_update_params)
      render json: ClientSerializer.serialize(@client), status: :ok
    else
      render json: { errors: @client.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # PATCH /client/push_token
  def update_push_token
    if @client.update(push_token: params[:push_token])
      render json: { message: "Push token updated successfully" }, status: :ok
    else
      render json: { errors: @client.errors.full_messages }, status: :unprocessable_entity
    end
  end

  private

  def set_client
    @client = current_client
  end

  def authorize_client
    render json: { error: "Not authorized" }, status: :unauthorized unless current_client
  end

  def current_client
    return @current_client if @current_client

    header = request.headers["Authorization"]
    return nil unless header

    token = header.split(" ").last
    decoded = jwt_decode(token)
    return nil unless decoded && decoded[:user_type] == "client"

    @current_client = Client.find_by(id: decoded[:client_id])
  end

  def client_params
    params.require(:client).permit(
      :first_name,
      :last_name,
      :email,
      :password,
      :password_confirmation,
      :phone_number,
      :notification_preferences
    )
  end

  def client_update_params
    params.require(:client).permit(
      :first_name,
      :last_name,
      :phone_number,
      :notification_preferences
    )
  end
end
