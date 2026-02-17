class StripeWebhooksController < ApplicationController
  skip_before_action :authorized # Webhooks don't use JWT auth

  def create
    payload = request.body.read
    sig_header = request.env["HTTP_STRIPE_SIGNATURE"]
    endpoint_secret = Rails.application.credentials.dig(:stripe, :webhook_secret)

    begin
      event = Stripe::Webhook.construct_event(
        payload, sig_header, endpoint_secret
      )
    rescue JSON::ParserError => e
      Rails.logger.error("Webhook parsing error: #{e.message}")
      return render json: { error: "Invalid payload" }, status: :bad_request
    rescue Stripe::SignatureVerificationError => e
      Rails.logger.error("Webhook signature verification failed: #{e.message}")
      return render json: { error: "Invalid signature" }, status: :unauthorized
    end

    # Check for duplicate processing (idempotency)
    if WebhookEvent.exists?(stripe_event_id: event.id)
      Rails.logger.info("Webhook #{event.id} already processed, skipping")
      return render json: { status: "already_processed" }
    end

    # Process the event
    result = process_webhook_event(event)

    # Record that we processed this event
    WebhookEvent.create!(
      stripe_event_id: event.id,
      event_type: event.type,
      payload: payload,
      processed_at: Time.current
    )

    render json: { status: "success", result: result }
  rescue StandardError => e
    # Log unexpected errors but still return 200 to Stripe
    Rails.logger.error("Unexpected webhook processing error: #{e.message}")
    Rails.logger.error(e.backtrace.join("\n"))
    render json: { status: "error", message: e.message }, status: :ok
  end

  private

  def process_webhook_event(event)
    case event.type
    when "customer.subscription.deleted"
      handle_subscription_deleted(event.data.object)
    when "customer.subscription.updated"
      handle_subscription_updated(event.data.object)
    when "invoice.payment_failed"
      handle_payment_failed(event.data.object)
    when "invoice.payment_succeeded"
      handle_payment_succeeded(event.data.object)
    when "account.updated"
      handle_account_updated(event.data.object)
    else
      Rails.logger.info("Unhandled webhook event type: #{event.type}")
      { handled: false, event_type: event.type }
    end
  end

  def handle_subscription_deleted(subscription)
    pledge = Pledge.find_by(stripe_subscription_id: subscription.id)
    return unless pledge

    pledge.update!(status: "cancelled", cancelled_at: Time.current)

    # TODO: Notify client and scooper
    # TODO: Check if block needs to enter warning state
  end

  def handle_subscription_updated(subscription)
    pledge = Pledge.find_by(stripe_subscription_id: subscription.id)
    return unless pledge

    # Update pledge status based on subscription status
    if subscription.status == "active"
      pledge.update!(status: "active")
    elsif subscription.status == "canceled"
      pledge.update!(status: "cancelled", cancelled_at: Time.current)
    end
  end

  def handle_payment_failed(invoice)
    # Find subscription and related pledge
    subscription = Stripe::Subscription.retrieve(invoice.subscription) rescue nil
    return unless subscription

    pledge = Pledge.find_by(stripe_subscription_id: subscription.id)
    return unless pledge

    # TODO: Notify client and scooper
    # TODO: Potentially mark pledge as at-risk
    # TODO: Send retry payment link to client
    Rails.logger.warn("Payment failed for pledge #{pledge.id}: #{invoice.id}")
  end

  def handle_payment_succeeded(invoice)
    # Find subscription and related pledge
    subscription = Stripe::Subscription.retrieve(invoice.subscription) rescue nil
    return unless subscription

    pledge = Pledge.find_by(stripe_subscription_id: subscription.id)
    return unless pledge

    # TODO: Update payment history
    # TODO: Send receipt to client
    # TODO: Notify scooper of successful payment
    Rails.logger.info("Payment succeeded for pledge #{pledge.id}: #{invoice.id}")
  end

  def handle_account_updated(account)
    user = User.find_by(stripe_connect_account_id: account.id)
    return unless user

    # TODO: Update user's Connect status
    # TODO: Notify if charges_enabled changed
    # TODO: Alert if account requires action

    if account.charges_enabled
      Rails.logger.info("Stripe Connect enabled for user #{user.id}")
    else
      Rails.logger.warn("Stripe Connect disabled for user #{user.id}")
    end
  end
end
