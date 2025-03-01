class ApplicationController < ActionController::API
  include ActionController::Cookies

  before_action :authorized
  before_action :block_direct_requests

  def authorized
    return render json: { error: "Not authorized" }, status: :unauthorized unless session.include?(:user_id)
  end

  def current_user
    @current_user = User.find_by(id: session[:user_id])
  end

  private

  def block_direct_requests
    # If the request is NOT an AJAX (fetch) request and expects HTML, serve React app
    if request.format.html? && !request.xhr?
      render file: Rails.public_path.join("index.html"), layout: false, status: :ok
    end
  end
end
