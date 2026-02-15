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
  def activate_stripe_subscription!
    # Create or retrieve Stripe customer for the client
    customer = ensure_stripe_customer

    # Create subscription
    subscription = Stripe::Subscription.create({
      customer: customer.id,
      items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: "Block Cleanup - #{block.neighborhood}",
            description: "Monthly pledge for #{block.block_id} cleanup"
          },
          recurring: { interval: 'month' },
          unit_amount: (amount * 100).to_i # Convert to cents
        }
      }],
      application_fee_percent: 15, # 15% platform fee
      transfer_data: {
        destination: coverage_region.user.stripe_connect_account_id
      },
      metadata: {
        pledge_id: id,
        block_id: block.id,
        coverage_region_id: coverage_region.id
      }
    })

    update!(
      stripe_subscription_id: subscription.id,
      stripe_customer_id: customer.id,
      status: 'active',
      activated_at: Time.current
    )

    subscription
  end

  def cancel_stripe_subscription!
    return unless stripe_subscription_id

    Stripe::Subscription.delete(stripe_subscription_id)
    update!(status: 'cancelled', cancelled_at: Time.current)
  end

  private

  def ensure_stripe_customer
    if client.stripe_customer_id
      Stripe::Customer.retrieve(client.stripe_customer_id)
    else
      customer = Stripe::Customer.create({
        email: client.user.email,
        name: client.name,
        metadata: { client_id: client.id, app: 'scoop' }
      })
      client.update!(stripe_customer_id: customer.id)
      customer
    end
  end

  def check_block_funding
    return unless status == "pending"

    # Check if this coverage region is now fully funded
    if coverage_region.fully_funded?
      # Check if this is the first to be funded
      if block.status != "active"
        # Activate the block for this scooper
        block.activate!(coverage_region.user, coverage_region.monthly_rate)

        # Notify all pledgers that block has activated
        # This would trigger notifications in the controller
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
