class ApplicationController < ActionController::API
  include ActionController::Cookies
  include JsonWebToken

  before_action :authorized
  before_action :block_direct_requests

  def authorized
    render json: { error: "Not authorized" }, status: :unauthorized unless current_user
  end

  def admin_only
    render json: { error: "Admin access required" }, status: :forbidden unless current_user&.admin?
  end

  def current_user
    return @current_user if @current_user

    # Try JWT authentication first (for mobile app and future web app)
    header = request.headers["Authorization"]
    if header
      token = header.split(" ").last
      Rails.logger.debug "🔑 JWT Auth: Token received (length: #{token&.length || 0})" if Rails.env.development?

      decoded = jwt_decode(token)
      if decoded
        # CRITICAL SECURITY: Reject client tokens on user endpoints
        if decoded[:user_type] == "client"
          Rails.logger.warn "🚫 Security: Client token rejected on User endpoint (#{request.path})"
          return nil
        end

        Rails.logger.debug "✅ JWT Auth: Token decoded successfully, user_id: #{decoded[:user_id]}" if Rails.env.development?
        @current_user = User.find_by(id: decoded[:user_id])

        if @current_user
          Rails.logger.debug "✅ JWT Auth: User found - #{@current_user.username}" if Rails.env.development?
          return @current_user
        else
          Rails.logger.debug "❌ JWT Auth: User not found for id: #{decoded[:user_id]}" if Rails.env.development?
        end
      else
        Rails.logger.debug "❌ JWT Auth: Token decode failed" if Rails.env.development?
      end
    end

    # Fall back to session authentication (for web app compatibility)
    if session[:user_id]
      Rails.logger.debug "🔄 Session Auth: Checking session user_id: #{session[:user_id]}" if Rails.env.development?
      @current_user = User.find_by(id: session[:user_id])

      if @current_user
        Rails.logger.debug "✅ Session Auth: User found - #{@current_user.username}" if Rails.env.development?
      else
        Rails.logger.debug "❌ Session Auth: User not found for id: #{session[:user_id]}" if Rails.env.development?
      end
    else
      Rails.logger.debug "❌ No JWT token or session found" if Rails.env.development?
    end

    @current_user
  end

  private

  def block_direct_requests
    # If the request is NOT an AJAX (fetch) request and expects HTML, serve React app
    return unless request.format.html? && !request.xhr?

    render file: Rails.public_path.join("index.html"), layout: false, status: :ok
  end
end
