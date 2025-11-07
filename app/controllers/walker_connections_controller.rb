class WalkerConnectionsController < ApplicationController
  before_action :set_connection, only: %i[accept decline destroy block]

  # GET /walker_connections
  # Returns all connections for the current user (both initiated and received)
  def index
    connections = @current_user.all_connections.includes(:user, :connected_user)

    formatted_connections = connections.map do |connection|
      other_user = connection.other_user(@current_user)
      {
        id: connection.id,
        status: connection.status,
        initiated_by_me: connection.initiated_by?(@current_user),
        other_user: {
          id: other_user.id,
          name: other_user.name,
          username: other_user.username,
          email_address: other_user.email_address
        },
        created_at: connection.created_at
      }
    end

    render json: formatted_connections
  end

  # POST /walker_connections
  # Create a connection request to another user
  def create
    other_user = User.find_by(id: params[:connected_user_id])

    return render json: { error: 'User not found' }, status: :not_found if other_user.nil?

    # Check if connection already exists (in either direction)
    existing = WalkerConnection.where(
      '(user_id = ? AND connected_user_id = ?) OR (user_id = ? AND connected_user_id = ?)',
      @current_user.id, other_user.id, other_user.id, @current_user.id
    ).first

    return render json: { error: 'Connection already exists' }, status: :unprocessable_entity if existing

    connection = WalkerConnection.new(
      user_id: @current_user.id,
      connected_user_id: other_user.id,
      status: 'pending'
    )

    if connection.save
      render json: {
        id: connection.id,
        status: connection.status,
        initiated_by_me: true,
        other_user: {
          id: other_user.id,
          name: other_user.name,
          username: other_user.username,
          email_address: other_user.email_address
        },
        created_at: connection.created_at
      }, status: :created
    else
      render json: { errors: connection.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # PATCH /walker_connections/:id/accept
  def accept
    return render json: { error: 'Not authorized' }, status: :forbidden unless authorized_to_respond?

    if @connection.accept!
      render json: { message: 'Connection accepted', connection: format_connection(@connection) }
    else
      render json: { errors: @connection.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # PATCH /walker_connections/:id/decline
  def decline
    return render json: { error: 'Not authorized' }, status: :forbidden unless authorized_to_respond?

    if @connection.decline!
      render json: { message: 'Connection declined' }
    else
      render json: { errors: @connection.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # PATCH /walker_connections/:id/block
  def block
    if @connection.block!
      render json: { message: 'User blocked' }
    else
      render json: { errors: @connection.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # DELETE /walker_connections/:id
  def destroy
    return render json: { error: 'Not authorized' }, status: :forbidden unless authorized_to_manage?

    @connection.destroy
    render json: { message: 'Connection removed' }
  end

  private

  def set_connection
    @connection = WalkerConnection.find_by(id: params[:id])

    unless @connection && (@connection.user_id == @current_user.id || @connection.connected_user_id == @current_user.id)
      render json: { error: 'Connection not found' }, status: :not_found
    end
  end

  def authorized_to_respond?
    # Only the recipient can accept/decline
    @connection.connected_user_id == @current_user.id && @connection.status == 'pending'
  end

  def authorized_to_manage?
    # Both users can delete/block the connection
    @connection.user_id == @current_user.id || @connection.connected_user_id == @current_user.id
  end

  def format_connection(connection)
    other_user = connection.other_user(@current_user)
    {
      id: connection.id,
      status: connection.status,
      initiated_by_me: connection.initiated_by?(@current_user),
      other_user: {
        id: other_user.id,
        name: other_user.name,
        username: other_user.username,
        email_address: other_user.email_address
      },
      created_at: connection.created_at
    }
  end
end
