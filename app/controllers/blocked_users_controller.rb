class BlockedUsersController < ApplicationController
  before_action :authorized

  # POST /users/:user_id/block
  # Block a user
  def create
    user_to_block = User.find_by(id: params[:user_id])

    unless user_to_block
      return render json: { error: "User not found" }, status: :not_found
    end

    if user_to_block.id == current_user.id
      return render json: { error: "You cannot block yourself" }, status: :unprocessable_entity
    end

    # Check if already blocked
    if current_user.blocking?(user_to_block)
      return render json: { error: "User already blocked" }, status: :unprocessable_entity
    end

    begin
      current_user.block!(user_to_block)

      render json: {
        message: "User blocked successfully",
        blocked_user: {
          id: user_to_block.id,
          username: user_to_block.username,
          name: user_to_block.name
        }
      }, status: :created
    rescue => e
      Rails.logger.error "Error blocking user: #{e.message}"
      render json: { error: "Failed to block user" }, status: :unprocessable_entity
    end
  end

  # DELETE /users/:user_id/unblock
  # Unblock a user
  def destroy
    user_to_unblock = User.find_by(id: params[:user_id])

    unless user_to_unblock
      return render json: { error: "User not found" }, status: :not_found
    end

    unless current_user.blocking?(user_to_unblock)
      return render json: { error: "User is not blocked" }, status: :unprocessable_entity
    end

    begin
      current_user.unblock!(user_to_unblock)

      render json: {
        message: "User unblocked successfully",
        unblocked_user: {
          id: user_to_unblock.id,
          username: user_to_unblock.username,
          name: user_to_unblock.name
        }
      }
    rescue => e
      Rails.logger.error "Error unblocking user: #{e.message}"
      render json: { error: "Failed to unblock user" }, status: :unprocessable_entity
    end
  end

  # GET /users/blocked
  # List all blocked users
  def index
    blocked_users = current_user.blocked_users_initiated.includes(:blocked).recent

    render json: {
      blocked_users: blocked_users.map { |bu| blocked_user_json(bu) },
      total: blocked_users.count
    }
  end

  private

  def blocked_user_json(blocked_user_record)
    user = blocked_user_record.blocked

    {
      id: user.id,
      username: user.username,
      name: user.name,
      blocked_at: blocked_user_record.created_at
    }
  end
end
