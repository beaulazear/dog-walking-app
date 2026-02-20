class RecurringCleanup < ApplicationRecord
  # Associations
  belongs_to :poster, class_name: "User"
  belongs_to :scooper, class_name: "User", optional: true
  has_many :cleanup_jobs, dependent: :nullify

  # Serialization
  serialize :segments_selected, type: Array, coder: JSON

  # Validations
  validates :address, presence: true
  validates :latitude, :longitude, presence: true, numericality: true
  validates :frequency, presence: true, inclusion: { in: %w[weekly biweekly monthly] }
  validates :day_of_week, numericality: { only_integer: true, greater_than_or_equal_to: 0, less_than_or_equal_to: 6 },
                          allow_nil: true
  validates :price, presence: true, numericality: { greater_than: 0 }
  validates :status, presence: true, inclusion: { in: %w[pending active paused cancelled] }
  validates :job_type, presence: true, inclusion: { in: %w[poop litter both] }

  # Scopes
  scope :pending, -> { where(status: "pending") }
  scope :active, -> { where(status: "active") }
  scope :paused, -> { where(status: "paused") }
  scope :cancelled, -> { where(status: "cancelled") }
  scope :needs_job_generation, -> { active.where("next_job_date <= ?", Date.current) }

  # Callbacks
  before_create :set_next_job_date, if: -> { next_job_date.blank? }

  # Instance methods
  def activate!(stripe_subscription_id = nil)
    update!(
      status: "active",
      started_at: Time.current,
      stripe_subscription_id: stripe_subscription_id
    )
  end

  def pause!
    update!(status: "paused")
  end

  def cancel!
    transaction do
      cancel_stripe_subscription! if stripe_subscription_id.present?
      update!(
        status: "cancelled",
        cancelled_at: Time.current
      )
    end
  end

  def resume!
    return unless status == "paused"

    update!(status: "active")
  end

  # Generate the next cleanup job based on schedule
  def generate_next_job!
    return unless status == "active"
    return if next_job_date.blank? || next_job_date > Date.current

    job = CleanupJob.create!(
      poster: poster,
      scooper: scooper,
      latitude: latitude,
      longitude: longitude,
      address: address,
      price: price,
      job_type: job_type,
      segments_selected: segments_selected,
      poop_itemization: poop_itemization,
      litter_itemization: litter_itemization,
      note: "Recurring cleanup - #{frequency}",
      status: "open",
      job_expires_at: 24.hours.from_now,
      recurring_cleanup_id: id
    )

    # If scooper is assigned, auto-claim the job
    if scooper.present?
      job.update!(
        status: "claimed",
        claimed_at: Time.current
      )
    end

    update!(
      last_job_generated_at: Time.current,
      next_job_date: calculate_next_job_date
    )

    job
  end

  # Stripe subscription methods
  def create_stripe_subscription!(payment_method_id)
    raise ArgumentError, "payment_method_id is required" if payment_method_id.blank?
    raise ArgumentError, "scooper must be assigned" if scooper.blank?
    validate_scooper_stripe_account!

    # Create or retrieve Stripe customer
    customer = ensure_stripe_customer

    # Attach payment method
    payment_method = attach_payment_method_to_customer(customer.id, payment_method_id)

    # Create subscription
    subscription = Stripe::Subscription.create({
      customer: customer.id,
      items: [{
        price_data: {
          currency: "usd",
          product_data: {
            name: "Recurring Cleanup - #{frequency.capitalize}",
            description: "#{address} - #{job_type} cleanup"
          },
          recurring: { interval: "month" },
          unit_amount: (price * 100).to_i # Convert to cents
        }
      }],
      default_payment_method: payment_method.id,
      application_fee_percent: 15, # 15% platform fee
      transfer_data: {
        destination: scooper.stripe_connect_account_id
      },
      expand: ["latest_invoice.payment_intent"],
      metadata: {
        recurring_cleanup_id: id,
        frequency: frequency,
        app: "scoop"
      }
    })

    # Handle 3D Secure / SCA
    if subscription.latest_invoice.payment_intent.status == "requires_action"
      update!(
        stripe_subscription_id: subscription.id,
        stripe_customer_id: customer.id,
        status: "pending"
      )

      return {
        subscription: subscription,
        requires_action: true,
        client_secret: subscription.latest_invoice.payment_intent.client_secret
      }
    end

    # Activate subscription
    activate!(subscription.id)
    update!(stripe_customer_id: customer.id)

    { subscription: subscription, requires_action: false }
  rescue Stripe::StripeError => e
    Rails.logger.error("Stripe subscription creation failed for recurring_cleanup #{id}: #{e.message}")
    raise e
  end

  def cancel_stripe_subscription!
    return unless stripe_subscription_id

    Stripe::Subscription.cancel(stripe_subscription_id)
  rescue Stripe::StripeError => e
    Rails.logger.error("Failed to cancel Stripe subscription #{stripe_subscription_id}: #{e.message}")
  end

  private

  def ensure_stripe_customer
    if poster.stripe_customer_id
      Stripe::Customer.retrieve(poster.stripe_customer_id)
    else
      customer = Stripe::Customer.create({
        email: poster.email_address,
        name: poster.name,
        metadata: { user_id: poster.id, app: "scoop" }
      })
      poster.update!(stripe_customer_id: customer.id)
      customer
    end
  end

  def attach_payment_method_to_customer(customer_id, payment_method_id)
    payment_method = Stripe::PaymentMethod.attach(
      payment_method_id,
      { customer: customer_id }
    )

    Stripe::Customer.update(
      customer_id,
      invoice_settings: {
        default_payment_method: payment_method.id
      }
    )

    payment_method
  rescue Stripe::InvalidRequestError => e
    if e.message.include?("already been attached")
      Stripe::PaymentMethod.retrieve(payment_method_id)
    else
      raise e
    end
  end

  def validate_scooper_stripe_account!
    unless scooper.stripe_connect_account_id.present?
      raise Stripe::InvalidRequestError.new(
        "Scooper must complete Stripe Connect onboarding",
        "stripe_connect_account_id"
      )
    end

    account = Stripe::Account.retrieve(scooper.stripe_connect_account_id)

    unless account.charges_enabled
      raise Stripe::InvalidRequestError.new(
        "Scooper's Stripe account is not ready to receive payments",
        "charges_enabled"
      )
    end
  rescue Stripe::InvalidRequestError
    raise
  rescue Stripe::StripeError => e
    Rails.logger.error("Failed to validate scooper Stripe account: #{e.message}")
    raise Stripe::InvalidRequestError.new(
      "Unable to validate scooper's payment account",
      "stripe_account_validation"
    )
  end

  def calculate_next_job_date
    return nil unless frequency.present?

    base_date = next_job_date || Date.current

    case frequency
    when "weekly"
      base_date + 1.week
    when "biweekly"
      base_date + 2.weeks
    when "monthly"
      base_date + 1.month
    end
  end

  def set_next_job_date
    self.next_job_date ||= Date.current
  end
end
