# Scoop Stripe Connect Integration

This document outlines the Stripe Connect marketplace integration for Scoop, where residents pledge money to scoopers for block cleanup services.

## Overview

Scoop uses **Stripe Connect** to enable marketplace payments:

- **Platform (Scoop)**: Takes 15-20% platform fee
- **Scoopers**: Receive 80-85% of pledge amounts
- **Residents**: Subscribe with monthly recurring payments
- **Payment Flow**: Resident → Stripe → Scooper (minus platform fee)

## Stripe Connect Account Type

**Recommended:** Express or Custom Connect accounts for scoopers

- **Express**: Simpler onboarding, Stripe-hosted UI
- **Custom**: More control, custom UI (more complex)

For MVP, use **Express** accounts.

## Setup Steps

### 1. Create Stripe Account

1. Sign up at [https://stripe.com](https://stripe.com)
2. Note your API keys:
   - **Test Mode**: Use for development
   - **Live Mode**: Use for production

### 2. Configure Rails Credentials

```bash
rails credentials:edit
```

Add Stripe keys:

```yaml
stripe:
  publishable_key: pk_test_... # or pk_live_...
  secret_key: sk_test_... # or sk_live_...
  connect_client_id: ca_... # From Stripe Connect settings
  webhook_secret: whsec_... # From Stripe webhooks
```

### 3. Environment Configuration

The Stripe gem is already added to the Gemfile. Create an initializer:

**`config/initializers/stripe.rb`**:
```ruby
Rails.configuration.stripe = {
  publishable_key: Rails.application.credentials.dig(:stripe, :publishable_key),
  secret_key: Rails.application.credentials.dig(:stripe, :secret_key),
  connect_client_id: Rails.application.credentials.dig(:stripe, :connect_client_id)
}

Stripe.api_key = Rails.configuration.stripe[:secret_key]
```

## Implementation

### User Model Extensions

Users already have `stripe_connect_account_id` field added in migration:
- `db/migrate/20260215003236_add_scoop_fields_to_users_and_clients.rb`

### Stripe Connect Controller

Create a controller to handle Stripe Connect onboarding:

**`app/controllers/stripe_connect_controller.rb`**:
```ruby
class StripeConnectController < ApplicationController
  before_action :require_scooper

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
```

### Pledge Activation with Stripe

Update the **Pledge model** to create Stripe subscriptions when activated:

**Add to `app/models/pledge.rb`**:
```ruby
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
      email: client.email,
      name: client.name,
      metadata: { client_id: client.id, app: 'scoop' }
    })
    client.update!(stripe_customer_id: customer.id)
    customer
  end
end
```

### Client Model Extensions

Add `stripe_customer_id` field to clients table:

```bash
rails generate migration AddStripeCustomerIdToClients stripe_customer_id:string
```

**Migration**:
```ruby
class AddStripeCustomerIdToClients < ActiveRecord::Migration[7.2]
  def change
    add_column :clients, :stripe_customer_id, :string
    add_index :clients, :stripe_customer_id
  end
end
```

### Webhook Handler

Create a webhook controller to handle Stripe events:

**`app/controllers/stripe_webhooks_controller.rb`**:
```ruby
class StripeWebhooksController < ApplicationController
  skip_before_action :authorized # Webhooks don't use JWT auth
  skip_before_action :verify_authenticity_token

  def create
    payload = request.body.read
    sig_header = request.env['HTTP_STRIPE_SIGNATURE']
    endpoint_secret = Rails.application.credentials.dig(:stripe, :webhook_secret)

    begin
      event = Stripe::Webhook.construct_event(
        payload, sig_header, endpoint_secret
      )
    rescue JSON::ParserError, Stripe::SignatureVerificationError => e
      return render json: { error: e.message }, status: :bad_request
    end

    # Handle the event
    case event.type
    when 'customer.subscription.deleted'
      handle_subscription_deleted(event.data.object)
    when 'customer.subscription.updated'
      handle_subscription_updated(event.data.object)
    when 'invoice.payment_failed'
      handle_payment_failed(event.data.object)
    when 'invoice.payment_succeeded'
      handle_payment_succeeded(event.data.object)
    when 'account.updated'
      handle_account_updated(event.data.object)
    end

    render json: { status: 'success' }
  end

  private

  def handle_subscription_deleted(subscription)
    pledge = Pledge.find_by(stripe_subscription_id: subscription.id)
    return unless pledge

    pledge.update!(status: 'cancelled', cancelled_at: Time.current)
  end

  def handle_subscription_updated(subscription)
    pledge = Pledge.find_by(stripe_subscription_id: subscription.id)
    return unless pledge

    # Update pledge status based on subscription status
    if subscription.status == 'active'
      pledge.update!(status: 'active')
    elsif subscription.status == 'canceled'
      pledge.update!(status: 'cancelled', cancelled_at: Time.current)
    end
  end

  def handle_payment_failed(invoice)
    # Notify client and scooper
    # Potentially mark pledge as at-risk
  end

  def handle_payment_succeeded(invoice)
    # Update payment history
    # Send receipt
  end

  def handle_account_updated(account)
    user = User.find_by(stripe_connect_account_id: account.id)
    return unless user

    # Update user's Connect status
    # Notify if charges_enabled changed
  end
end
```

### Routes

Add routes for Stripe Connect and webhooks:

```ruby
# Stripe Connect
post '/stripe_connect/onboard', to: 'stripe_connect#onboard'
get '/stripe_connect/status', to: 'stripe_connect#status'
get '/stripe_connect/dashboard', to: 'stripe_connect#dashboard'

# Stripe Webhooks
post '/stripe/webhooks', to: 'stripe_webhooks#create'
```

## Testing

### Test Mode

Use Stripe test cards for development:
- **Success**: `4242 4242 4242 4242`
- **Declined**: `4000 0000 0000 0002`
- **Requires Auth**: `4000 0025 0000 3155`

### Test Connect Accounts

In test mode, you can create Connect accounts and simulate onboarding.

### Webhook Testing

Use Stripe CLI to forward webhooks to localhost:

```bash
stripe listen --forward-to localhost:3000/stripe/webhooks
```

## Production Checklist

- [ ] Switch to live Stripe API keys
- [ ] Configure webhook endpoint in Stripe Dashboard
- [ ] Set `application_fee_percent` to final rate (15-20%)
- [ ] Test full payment flow end-to-end
- [ ] Set up payout schedule for Connected accounts
- [ ] Configure email notifications for payment events
- [ ] Add error monitoring for Stripe API calls

## Security Considerations

- Never expose secret keys in frontend code
- Validate webhook signatures
- Use HTTPS for all Stripe interactions
- Store minimal payment information in database
- Follow PCI compliance guidelines

## Cost Structure

**Stripe Fees:**
- 2.9% + $0.30 per successful card charge
- No monthly fees
- Connect accounts: included

**Scoop Platform Fee:**
- 15-20% of pledge amount
- Deducted automatically via `application_fee_percent`

**Example:**
- Resident pledges: $10/month
- Stripe fee: ~$0.59 (2.9% + $0.30)
- Platform fee (15%): $1.50
- Scooper receives: $7.91
- Platform receives: $1.50

## Resources

- [Stripe Connect Docs](https://stripe.com/docs/connect)
- [Stripe Subscriptions](https://stripe.com/docs/billing/subscriptions/overview)
- [Stripe Testing](https://stripe.com/docs/testing)
