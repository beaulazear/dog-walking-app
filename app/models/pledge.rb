class Pledge < ApplicationRecord
  # Associations
  belongs_to :client
  belongs_to :block
  belongs_to :coverage_region

  # Validations
  validates :amount, presence: true, numericality: { greater_than: 0 }
  validates :status, presence: true, inclusion: { in: %w[pending active cancelled dissolved] }
  validates :client_id, uniqueness: { scope: :block_id, message: "already has a pledge on this block" }

  # Callbacks
  after_create :check_block_funding
  after_destroy :check_block_funding_after_cancellation
  after_update :check_block_funding, if: :saved_change_to_amount?

  # Scopes
  scope :pending, -> { where(status: "pending") }
  scope :active, -> { where(status: "active") }
  scope :cancelled, -> { where(status: "cancelled") }
  scope :dissolved, -> { where(status: "dissolved") }

  # Instance methods
  def activate!
    update!(
      status: "active",
      activated_at: Time.current
    )
  end

  def cancel!
    update!(
      status: "cancelled",
      cancelled_at: Time.current
    )
  end

  def dissolve!
    update!(status: "dissolved")
  end

  def switch_to_coverage_region!(new_coverage_region)
    transaction do
      old_coverage_region = coverage_region

      update!(coverage_region: new_coverage_region)

      # Check if old coverage region is still funded
      old_coverage_region.reload
      unless old_coverage_region.fully_funded?
        # If this was the active scooper, trigger warning
        if block.active_scooper_id == old_coverage_region.user_id
          block.enter_warning_state!
        end
      end

      # Check if new coverage region is now funded
      check_block_funding
    end
  end

  # Stripe Integration Methods
  def activate_stripe_subscription!(payment_method_id)
    # CRITICAL: Payment method ID must be provided
    raise ArgumentError, "payment_method_id is required" if payment_method_id.blank?

    # Validate scooper's Stripe Connect account before proceeding
    validate_scooper_stripe_account!

    # Create or retrieve Stripe customer for the client
    customer = ensure_stripe_customer

    # Attach payment method to customer
    payment_method = attach_payment_method_to_customer(customer.id, payment_method_id)

    # Create subscription with payment method
    subscription = Stripe::Subscription.create({
      customer: customer.id,
      items: [ {
        price_data: {
          currency: "usd",
          product_data: {
            name: "Block Cleanup - #{block.neighborhood}",
            description: "Monthly pledge for #{block.block_id} cleanup"
          },
          recurring: { interval: "month" },
          unit_amount: (amount * 100).to_i # Convert to cents
        }
      } ],
      default_payment_method: payment_method.id, # CRITICAL: Set payment method
      application_fee_percent: 15, # 15% platform fee
      transfer_data: {
        destination: coverage_region.user.stripe_connect_account_id
      },
      expand: [ "latest_invoice.payment_intent" ], # Get payment status
      metadata: {
        pledge_id: id,
        block_id: block.id,
        coverage_region_id: coverage_region.id,
        app: "scoop"
      }
    })

    # Handle 3D Secure / SCA requirements
    if subscription.latest_invoice.payment_intent.status == "requires_action"
      # Payment requires additional authentication (3DS)
      # Frontend will need to handle this with stripe.confirmCardPayment()
      update!(
        stripe_subscription_id: subscription.id,
        stripe_customer_id: customer.id,
        stripe_payment_method_id: payment_method.id,
        status: "pending", # Keep as pending until payment confirmed
        requires_action: true,
        client_secret: subscription.latest_invoice.payment_intent.client_secret
      )

      return {
        subscription: subscription,
        requires_action: true,
        client_secret: subscription.latest_invoice.payment_intent.client_secret
      }
    end

    # Payment successful or doesn't require action
    update!(
      stripe_subscription_id: subscription.id,
      stripe_customer_id: customer.id,
      stripe_payment_method_id: payment_method.id,
      status: "active",
      activated_at: Time.current,
      requires_action: false
    )

    { subscription: subscription, requires_action: false }
  rescue Stripe::StripeError => e
    Rails.logger.error("Stripe subscription creation failed for pledge #{id}: #{e.message}")
    raise e
  end

  def cancel_stripe_subscription!
    return unless stripe_subscription_id

    Stripe::Subscription.delete(stripe_subscription_id)
    update!(status: "cancelled", cancelled_at: Time.current)
  end

  private

  def ensure_stripe_customer
    if client.stripe_customer_id
      Stripe::Customer.retrieve(client.stripe_customer_id)
    else
      customer = Stripe::Customer.create({
        email: client.email,
        name: client.full_name,
        metadata: { client_id: client.id, app: "scoop" }
      })
      client.update!(stripe_customer_id: customer.id)
      customer
    end
  end

  def attach_payment_method_to_customer(customer_id, payment_method_id)
    # Attach the payment method to the customer
    payment_method = Stripe::PaymentMethod.attach(
      payment_method_id,
      { customer: customer_id }
    )

    # Set as the default payment method for subscriptions
    Stripe::Customer.update(
      customer_id,
      invoice_settings: {
        default_payment_method: payment_method.id
      }
    )

    payment_method
  rescue Stripe::InvalidRequestError => e
    # Payment method might already be attached
    if e.message.include?("already been attached")
      Stripe::PaymentMethod.retrieve(payment_method_id)
    else
      raise e
    end
  end

  def validate_scooper_stripe_account!
    scooper = coverage_region.user

    unless scooper.stripe_connect_account_id.present?
      raise Stripe::InvalidRequestError.new(
        "Scooper must complete Stripe Connect onboarding before receiving payments",
        "stripe_connect_account_id"
      )
    end

    # Retrieve the Connect account to check status
    account = Stripe::Account.retrieve(scooper.stripe_connect_account_id)

    unless account.charges_enabled
      raise Stripe::InvalidRequestError.new(
        "Scooper's Stripe account is not ready to receive payments (charges not enabled)",
        "charges_enabled"
      )
    end

    unless account.payouts_enabled
      Rails.logger.warn("Scooper #{scooper.id} can receive charges but payouts not enabled")
    end

    if account.requirements.currently_due.any?
      Rails.logger.warn(
        "Scooper #{scooper.id} has pending requirements: #{account.requirements.currently_due.join(', ')}"
      )
    end

    true
  rescue Stripe::InvalidRequestError
    raise
  rescue Stripe::StripeError => e
    Rails.logger.error("Failed to validate scooper Stripe account: #{e.message}")
    raise Stripe::InvalidRequestError.new(
      "Unable to validate scooper's payment account. Please try again later.",
      "stripe_account_validation"
    )
  end

  def check_block_funding
    return unless status == "pending"

    # Use pessimistic locking to prevent race conditions
    Block.transaction do
      # Lock the block record for the duration of this transaction
      locked_block = Block.lock.find(block_id)

      # Reload coverage region to get fresh pledge totals
      coverage_region.reload

      # Check if this coverage region is now fully funded
      if coverage_region.fully_funded? && locked_block.status != "active"
        # This is the winning scooper - activate the block
        locked_block.activate!(coverage_region.user, coverage_region.monthly_rate)

        # Activate all pledges for this scooper and create Stripe subscriptions
        activate_winning_pledges!

        # Notify all pledgers that block has activated
        # TODO: Send notifications
      end
    end
  rescue ActiveRecord::RecordNotFound
    # Block was deleted, ignore
    Rails.logger.warn("Block #{block_id} not found during funding check")
    nil
  end

  def activate_winning_pledges!
    # Find all pending pledges for this coverage region
    winning_pledges = coverage_region.pledges.where(status: "pending")

    winning_pledges.each do |pledge|
      begin
        # Create Stripe subscription using stored payment method
        result = pledge.activate_stripe_subscription!(pledge.stripe_payment_method_id)

        # If payment requires action (3DS), subscription created but pending
        # Webhook will handle final activation after payment confirms
        unless result[:requires_action]
          Rails.logger.info("Activated pledge #{pledge.id} with subscription #{result[:subscription].id}")
        else
          Rails.logger.info("Pledge #{pledge.id} requires payment authentication")
        end
      rescue Stripe::StripeError => e
        # Log error but don't fail the entire activation
        Rails.logger.error("Failed to activate pledge #{pledge.id}: #{e.message}")

        # Mark pledge as failed
        pledge.update(
          status: "failed",
          error_message: e.message
        )
      end
    end
  end

  def check_block_funding_after_cancellation
    # If this was on an active block, check if it's still funded
    if block.status == "active" && block.active_scooper_id == coverage_region.user_id
      remaining_total = coverage_region.total_pledges

      if remaining_total < coverage_region.monthly_rate
        block.enter_warning_state!
      end
    end
  end
end
