class WaitlistSignupsController < ApplicationController
  skip_before_action :authorized, only: [ :create ]
  skip_before_action :block_direct_requests, only: [ :create ]

  def create
    signup = WaitlistSignup.new(waitlist_params)
    signup.ip_address = request.remote_ip
    signup.user_agent = request.user_agent

    if signup.save
      render json: { message: "You're on the list! We'll email you when we launch." }, status: :created
    else
      if signup.errors[:email].include?("has already been taken")
        render json: { error: "This email is already on the waitlist!" }, status: :unprocessable_entity
      else
        render json: { error: signup.errors.full_messages.join(", ") }, status: :unprocessable_entity
      end
    end
  rescue StandardError => e
    render json: { error: "Something went wrong. Please try again." }, status: :internal_server_error
  end

  private

  def waitlist_params
    params.require(:waitlist_signup).permit(:email)
  end
end
