module ApplicationCable
  class Connection < ActionCable::Connection::Base
    identified_by :current_user

    def connect
      self.current_user = find_verified_user
    end

    private

    def find_verified_user
      # Extract token from query params (e.g., ws://api.com/cable?token=xxx)
      token = request.params[:token]

      if token.present?
        begin
          decoded = JWT.decode(
            token,
            Rails.application.credentials.secret_key_base,
            true,
            { algorithm: "HS256" }
          )
          user_id = decoded[0]["user_id"]
          user = User.find_by(id: user_id)

          return user if user
        rescue JWT::DecodeError, ActiveRecord::RecordNotFound
          reject_unauthorized_connection
        end
      end

      reject_unauthorized_connection
    end
  end
end
