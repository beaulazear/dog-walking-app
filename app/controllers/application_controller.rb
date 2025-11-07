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
    return nil unless header

    token = header.split(' ').last
    decoded = jwt_decode(token)
    return nil unless decoded

    @current_user = User.find_by(id: decoded[:user_id])
  end

  private

  def block_direct_requests
    # If the request is NOT an AJAX (fetch) request and expects HTML, serve React app
    return unless request.format.html? && !request.xhr?

    render file: Rails.public_path.join('index.html'), layout: false, status: :ok
  end
end
