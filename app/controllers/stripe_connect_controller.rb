class StripeConnectController < ApplicationController
  before_action :require_scooper
  before_action :check_stripe_connect_configured

  # POST /stripe_connect/onboard
  # Initiate Stripe Connect onboarding for scooper
  def onboard
    if current_user.stripe_connect_account_id.present?
      # Account already exists, create login link
      account_link = create_login_link
    else
      # Create new Connect account
      account = create_connect_account
      current_user.update!(stripe_connect_account_id: account.id)
      account_link = create_account_link(account.id)
    end

    render json: {
      url: account_link.url,
      message: 'Redirecting to Stripe onboarding...'
    }
  rescue Stripe::StripeError => e
    render json: { error: e.message }, status: :unprocessable_entity
  end

  # GET /stripe_connect/status
  # Check Connect account status
  def status
    unless current_user.stripe_connect_account_id
      return render json: {
        connected: false,
        charges_enabled: false,
        details_submitted: false
      }
    end

    account = Stripe::Account.retrieve(current_user.stripe_connect_account_id)

    render json: {
      connected: true,
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
      details_submitted: account.details_submitted,
      requirements: account.requirements.to_h
    }
  rescue Stripe::StripeError => e
    render json: { error: e.message }, status: :unprocessable_entity
  end

  # GET /stripe_connect/dashboard
  # Create Express Dashboard link for scooper to view earnings
  def dashboard
    unless current_user.stripe_connect_account_id
      return render json: { error: 'No Stripe account connected' }, status: :bad_request
    end

    login_link = Stripe::Account.create_login_link(
      current_user.stripe_connect_account_id
    )

    render json: { url: login_link.url }
  rescue Stripe::StripeError => e
    render json: { error: e.message }, status: :unprocessable_entity
  end

  private

  def check_stripe_connect_configured
    unless Rails.configuration.stripe[:connect_client_id].present?
      render json: {
        error: 'Stripe Connect not configured',
        message: 'Please enable Stripe Connect to use payment features. See STRIPE_SETUP_INSTRUCTIONS.md'
      }, status: :service_unavailable
    end
  end

  def require_scooper
    unless current_user&.is_scooper
      render json: { error: 'You must be a scooper to use Stripe Connect' }, status: :forbidden
    end
  end

  def create_connect_account
    Stripe::Account.create({
      type: 'express',
      country: 'US',
      email: current_user.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true }
      },
      business_type: 'individual',
      metadata: {
        user_id: current_user.id,
        app: 'scoop'
      }
    })
  end

  def create_account_link(account_id)
    Stripe::AccountLink.create({
      account: account_id,
      refresh_url: "#{ENV['FRONTEND_URL']}/scooper/stripe/refresh",
      return_url: "#{ENV['FRONTEND_URL']}/scooper/stripe/success",
      type: 'account_onboarding'
    })
  end

  def create_login_link
    Stripe::AccountLink.create({
      account: current_user.stripe_connect_account_id,
      refresh_url: "#{ENV['FRONTEND_URL']}/scooper/stripe/refresh",
      return_url: "#{ENV['FRONTEND_URL']}/scooper/stripe/success",
      type: 'account_onboarding'
    })
  end
end
