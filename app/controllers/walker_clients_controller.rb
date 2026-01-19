class WalkerClientsController < ApplicationController
  before_action :current_user
  before_action :set_client, only: [ :show, :update, :destroy ]

  # GET /walker/clients
  def index
    # Get all clients (they might not have pets assigned yet)
    clients = Client.all.order(:first_name, :last_name)

    render json: clients.map { |c| serialize_client_with_pets(c) }, status: :ok
  end

  # GET /walker/clients/:id
  def show
    render json: serialize_client_with_pets(@client), status: :ok
  end

  # POST /walker/clients
  def create
    client = Client.new(client_create_params)

    # Generate a random secure password for the client
    # Walker can share this with the pet owner
    temp_password = SecureRandom.hex(8)
    client.password = temp_password
    client.password_confirmation = temp_password

    if client.save
      render json: {
        client: serialize_client(client),
        temporary_password: temp_password,
        message: "Client created. Share these credentials with the pet owner."
      }, status: :created
    else
      render json: { errors: client.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # PATCH /walker/clients/:id
  def update
    if @client.update(client_update_params)
      render json: serialize_client(@client), status: :ok
    else
      render json: { errors: @client.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # DELETE /walker/clients/:id
  def destroy
    # This will set client_id to null on associated pets (dependent: :nullify)
    @client.destroy
    render json: { message: "Client removed. Associated pets are now unassigned." }, status: :ok
  end

  private

  def set_client
    # Allow access to any client (they might not have pets yet)
    @client = Client.find_by(id: params[:id])

    unless @client
      render json: { error: "Client not found" }, status: :not_found
      nil
    end
  end

  def client_create_params
    params.require(:client).permit(
      :first_name,
      :last_name,
      :email,
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

  def serialize_client(client)
    {
      id: client.id,
      first_name: client.first_name,
      last_name: client.last_name,
      full_name: client.full_name,
      email: client.email,
      phone_number: client.phone_number,
      notification_preferences: client.notification_preferences
    }
  end

  def serialize_client_with_pets(client)
    # Get pets managed by this walker that belong to this client
    pets = @current_user.pets.where(client_id: client.id)

    serialize_client(client).merge({
      pets: pets.map { |p| { id: p.id, name: p.name, active: p.active } },
      pet_count: pets.count
    })
  end
end
