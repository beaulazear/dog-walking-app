class ApplicationController < ActionController::API
  include ActionController::Cookies
  include JsonWebToken

  before_action :authorized
  before_action :block_direct_requests

  def authorized
    render json: { error: 'Not authorized' }, status: :unauthorized unless current_user
  end

  def current_user
    return @current_user if @current_user

    header = request.headers['Authorization']
    unless header
      Rails.logger.debug '❌ JWT Auth: No Authorization header present'
      return nil
    end

    token = header.split(' ').last
    Rails.logger.debug "🔑 JWT Auth: Token received (length: #{token&.length || 0})"

    decoded = jwt_decode(token)
    unless decoded
      Rails.logger.debug '❌ JWT Auth: Token decode failed'
      return nil
    end

    Rails.logger.debug "✅ JWT Auth: Token decoded successfully, user_id: #{decoded[:user_id]}"

    @current_user = User.find_by(id: decoded[:user_id])

    if @current_user
      Rails.logger.debug "✅ JWT Auth: User found - #{@current_user.username}"
    else
      Rails.logger.debug "❌ JWT Auth: User not found for id: #{decoded[:user_id]}"
    end

    @current_user
  end

  private

  def block_direct_requests
    # If the request is NOT an AJAX (fetch) request and expects HTML, serve React app
    return unless request.format.html? && !request.xhr?

    render file: Rails.public_path.join('index.html'), layout: false, status: :ok
  end
end
