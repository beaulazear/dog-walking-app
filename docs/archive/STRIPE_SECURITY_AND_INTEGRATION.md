# Stripe Security & Integration Guide for Scoop

**Last Updated:** 2026-02-15
**Status:** Production-Ready Implementation Guide

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Payment Flow](#payment-flow)
4. [Security Implementation](#security-implementation)
5. [API Reference](#api-reference)
6. [Testing Guide](#testing-guide)
7. [Production Checklist](#production-checklist)
8. [Troubleshooting](#troubleshooting)

---

## Overview

Scoop uses **Stripe Connect** to operate as a two-sided marketplace:
- **Platform (Scoop)**: Takes 15% application fee
- **Scoopers**: Receive 85% of monthly pledges via Stripe Express accounts
- **Residents**: Pay monthly subscriptions to support block cleanup

### Key Stripe Components

1. **Stripe Connect (Express)**: Onboard scoopers to receive payouts
2. **Subscriptions**: Monthly recurring payments from residents
3. **Application Fees**: 15% platform fee on each payment
4. **Webhooks**: Real-time event processing for subscription lifecycle

---

## Architecture

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│  Resident   │────────>│    Scoop     │────────>│   Scooper   │
│  (Client)   │         │  (Platform)  │         │    (User)   │
└─────────────┘         └──────────────┘         └─────────────┘
      │                        │                        │
      │ Creates Stripe         │ Takes 15% fee          │ Receives 85%
      │ Subscription           │ Manages marketplace    │ via Connect
      │                        │                        │
      ▼                        ▼                        ▼
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Stripe    │         │    Stripe    │         │   Stripe    │
│  Customer   │         │   Platform   │         │   Express   │
│             │         │   Account    │         │   Account   │
└─────────────┘         └──────────────┘         └─────────────┘
```

### Data Flow

```
1. Scooper claims block → Creates CoverageRegion
2. Scooper onboards → Creates Stripe Express Account
3. Resident pledges → Creates Pledge (pending)
4. Pledge reaches threshold → Block activates
5. Activation triggers → Create Stripe Subscription
6. Monthly charge → 85% to scooper, 15% to platform
7. Webhook events → Update pledge/block status
```

---

## Payment Flow

### Phase 1: Scooper Onboarding

**Endpoint:** `POST /stripe_connect/onboard`

**Flow:**
```
1. User enables scooper mode (is_scooper = true)
2. Frontend calls onboard endpoint
3. Backend creates Stripe Express account
4. Backend generates AccountLink for onboarding
5. Frontend redirects to Stripe onboarding
6. User completes identity verification
7. Stripe redirects back to return_url
8. Frontend calls status endpoint to verify
9. User can now claim blocks
```

**Security Checks:**
- ✅ User must be authenticated
- ✅ User must have `is_scooper = true`
- ✅ Stripe Connect must be configured
- ✅ Account charges_enabled verified before activation

**Code Reference:** `app/controllers/stripe_connect_controller.rb`

---

### Phase 2: Resident Pledge Creation

**Endpoint:** `POST /pledges`

**Flow:**
```
1. Client (resident) finds a block
2. Selects a competing scooper
3. Enters pledge amount (minimum $5)
4. Frontend collects payment method via Stripe Elements
5. Frontend sends pledge request with payment_method_id
6. Backend creates Pledge record (status: pending)
7. Backend checks if block funding threshold reached
8. If fully funded → Activate block (see Phase 3)
9. Return pledge details to frontend
```

**Security Checks:**
- ✅ Client must be authenticated
- ✅ Client can only have one pledge per block
- ✅ Amount must be >= $5.00
- ✅ CoverageRegion must exist
- ✅ Payment method must be valid and attached

**Code Reference:** `app/controllers/pledges_controller.rb#create`

---

### Phase 3: Block Activation & Subscription Creation

**Triggered by:** `Pledge#check_block_funding` callback

**Flow:**
```
1. New pledge saved → after_create callback fires
2. Check if coverage_region is fully funded
3. Check if block is not already active (race condition protection)
4. LOCK block record (pessimistic locking)
5. Verify funding still valid after lock
6. Call block.activate!(scooper, monthly_rate)
7. Activate all pledges for winning scooper
8. Dissolve all pledges for losing scoopers
9. Create Stripe subscriptions for active pledges
10. Update pledge status to "active"
```

**Stripe Subscription Creation:**
```ruby
Stripe::Subscription.create({
  customer: stripe_customer_id,
  items: [{
    price_data: {
      currency: "usd",
      product_data: {
        name: "Block Cleanup - #{neighborhood}",
        description: "Monthly pledge for block cleanup"
      },
      recurring: { interval: "month" },
      unit_amount: (amount * 100).to_i  # Cents
    }
  }],
  default_payment_method: payment_method_id,  # CRITICAL: Must be set
  application_fee_percent: 15,  # Platform fee
  transfer_data: {
    destination: scooper_stripe_connect_account_id
  },
  metadata: {
    pledge_id: id,
    block_id: block.id,
    coverage_region_id: coverage_region.id,
    app: "scoop"
  }
})
```

**Security Checks:**
- ✅ Pessimistic database locking to prevent race conditions
- ✅ Scooper must have charges_enabled Stripe account
- ✅ Payment method must be attached to customer
- ✅ Atomic transaction for block activation
- ✅ All state changes wrapped in transaction

**Code Reference:**
- `app/models/pledge.rb#check_block_funding`
- `app/models/pledge.rb#activate_stripe_subscription!`
- `app/models/block.rb#activate!`

---

### Phase 4: Webhook Event Processing

**Endpoint:** `POST /stripe/webhook`

**Supported Events:**
1. `customer.subscription.deleted` → Cancel pledge
2. `customer.subscription.updated` → Update pledge status
3. `invoice.payment_failed` → Handle failed payment
4. `invoice.payment_succeeded` → Confirm payment
5. `account.updated` → Update scooper Connect status

**Security Implementation:**

```ruby
# 1. Verify webhook signature
payload = request.body.read
sig_header = request.env["HTTP_STRIPE_SIGNATURE"]
endpoint_secret = Rails.application.credentials.dig(:stripe, :webhook_secret)

event = Stripe::Webhook.construct_event(
  payload,
  sig_header,
  endpoint_secret
)

# 2. Check idempotency (prevent duplicate processing)
return if WebhookEvent.exists?(stripe_event_id: event.id)

# 3. Process event
case event.type
when "customer.subscription.deleted"
  handle_subscription_deleted(event.data.object)
when "invoice.payment_failed"
  handle_payment_failed(event.data.object)
  # ... etc
end

# 4. Record processing
WebhookEvent.create!(
  stripe_event_id: event.id,
  event_type: event.type,
  processed_at: Time.current
)
```

**Security Checks:**
- ✅ Signature verification (cryptographic)
- ✅ Idempotency check (prevent duplicate processing)
- ✅ Event type validation
- ✅ Pledge ownership verification
- ✅ Transaction safety for state updates

**Code Reference:** `app/controllers/stripe_webhooks_controller.rb`

---

### Phase 5: Payment Collection

**Monthly Cycle:**
```
Day 1:  Stripe charges customer $X
        85% ($X * 0.85) transferred to scooper Connect account
        15% ($X * 0.15) held as application fee

Day 2:  Webhook: invoice.payment_succeeded
        Update pledge payment history
        Send receipt to resident
        Notify scooper of payment

Day 3:  Payout to scooper's bank account (Stripe Connect schedule)
```

**Failed Payment Handling:**
```
Day 1:  Stripe attempts charge → FAILS
        Webhook: invoice.payment_failed

Day 2:  Stripe retries automatically (Smart Retries)

Day 3:  If still failing → Send notification to resident
        Display "Update payment method" in app

Day 15: After X failures → Cancel subscription
        Update pledge status to "cancelled"
        Check if block funding drops below threshold
        If yes → Block enters warning state (90 days)
```

---

## Security Implementation

### 1. Payment Method Security

**CRITICAL:** Payment methods must be collected on the frontend using Stripe Elements (PCI compliant).

**Frontend Flow (React Native/Web):**
```javascript
// 1. Load Stripe.js
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

// 2. Collect payment method
const stripe = useStripe();
const elements = useElements();

const { paymentMethod, error } = await stripe.createPaymentMethod({
  type: 'card',
  card: elements.getElement(CardElement),
  billing_details: {
    name: clientName,
    email: clientEmail,
  },
});

// 3. Send to backend
const response = await fetch('/pledges', {
  method: 'POST',
  body: JSON.stringify({
    coverage_region_id: coverageRegionId,
    pledge: {
      amount: 15.00,
      anonymous: false,
      payment_method_id: paymentMethod.id  // CRITICAL
    }
  })
});
```

**Backend Processing:**
```ruby
# app/models/pledge.rb
def activate_stripe_subscription!(payment_method_id)
  # 1. Create or retrieve customer
  customer = ensure_stripe_customer

  # 2. Attach payment method to customer
  payment_method = Stripe::PaymentMethod.attach(
    payment_method_id,
    { customer: customer.id }
  )

  # 3. Set as default payment method
  Stripe::Customer.update(
    customer.id,
    invoice_settings: {
      default_payment_method: payment_method.id
    }
  )

  # 4. Create subscription with payment method
  subscription = Stripe::Subscription.create({
    customer: customer.id,
    items: [...],
    default_payment_method: payment_method.id,  # Set explicitly
    application_fee_percent: 15,
    transfer_data: { destination: scooper_connect_account_id },
    expand: ['latest_invoice.payment_intent']  # Get payment status
  })

  # 5. Handle incomplete payment
  if subscription.latest_invoice.payment_intent.status == 'requires_action'
    # Return client_secret to frontend for 3D Secure
    return {
      requires_action: true,
      client_secret: subscription.latest_invoice.payment_intent.client_secret
    }
  end

  # 6. Update pledge
  update!(
    stripe_subscription_id: subscription.id,
    stripe_customer_id: customer.id,
    stripe_payment_method_id: payment_method.id,
    status: "active",
    activated_at: Time.current
  )
end
```

**Security Notes:**
- Never send card details to your server
- Never log payment method IDs
- Always use Stripe.js/Elements for PCI compliance
- Handle 3D Secure (SCA) requirements
- Validate payment method before subscription creation

---

### 2. Stripe Connect Security

**Scooper Validation:**
```ruby
# Before allowing block activation
def validate_scooper_stripe_account!(user)
  unless user.stripe_connect_account_id.present?
    raise StripeError, "Scooper must complete Stripe Connect onboarding"
  end

  account = Stripe::Account.retrieve(user.stripe_connect_account_id)

  unless account.charges_enabled
    raise StripeError, "Scooper's Stripe account not ready (charges_enabled = false)"
  end

  unless account.payouts_enabled
    raise StripeError, "Scooper's Stripe account not ready (payouts_enabled = false)"
  end

  if account.requirements.currently_due.any?
    raise StripeError, "Scooper must complete additional verification: #{account.requirements.currently_due.join(', ')}"
  end

  true
end
```

**Connect Account Creation:**
```ruby
# app/controllers/stripe_connect_controller.rb
def create_connect_account
  Stripe::Account.create({
    type: "express",
    country: "US",
    email: current_user.email,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true }
    },
    business_type: "individual",
    metadata: {
      user_id: current_user.id,
      app: "scoop",
      created_at: Time.current.iso8601
    }
  })
end
```

**Security Notes:**
- Only create Express accounts (not Standard/Custom)
- Store account ID immediately after creation
- Validate charges_enabled before first payment
- Handle account.updated webhooks to track status
- Never expose Connect account secrets

---

### 3. Race Condition Prevention

**Problem:** Multiple pledges reaching threshold simultaneously could cause two scoopers to "win".

**Solution:** Pessimistic locking with database transactions.

```ruby
# app/models/pledge.rb
def check_block_funding
  return unless status == "pending"

  # Use transaction with pessimistic lock
  Block.transaction do
    # Lock the block record (FOR UPDATE)
    locked_block = Block.lock.find(block_id)

    # Reload coverage region to get fresh pledge totals
    coverage_region.reload

    # Check funding with locked data
    if coverage_region.fully_funded? && locked_block.status != "active"
      # Only one thread can reach here
      locked_block.activate!(coverage_region.user, coverage_region.monthly_rate)
    end
  end
rescue ActiveRecord::RecordNotFound
  # Block deleted, ignore
  nil
end
```

**Database Migration:**
```ruby
# Add unique index to enforce business rules
add_index :pledges, [:client_id, :block_id],
          unique: true,
          name: 'index_pledges_on_client_and_block'

add_index :coverage_regions, [:user_id, :block_id],
          unique: true,
          name: 'index_coverage_regions_on_user_and_block'

add_index :cleanups, [:user_id, :block_id, :cleanup_date],
          unique: true,
          name: 'index_cleanups_on_user_block_date'
```

**Security Notes:**
- Always use `lock` or `lock!` for critical sections
- Wrap in transactions for atomicity
- Handle deadlock exceptions gracefully
- Keep locked sections small (minimize lock time)
- Use unique indexes to enforce business rules at DB level

---

### 4. Webhook Security

**Signature Verification:**
```ruby
# CRITICAL: Always verify webhook signatures
def create
  payload = request.body.read
  sig_header = request.env["HTTP_STRIPE_SIGNATURE"]
  endpoint_secret = Rails.application.credentials.dig(:stripe, :webhook_secret)

  begin
    event = Stripe::Webhook.construct_event(
      payload,
      sig_header,
      endpoint_secret
    )
  rescue JSON::ParserError => e
    # Invalid payload
    Rails.logger.error("Webhook parsing error: #{e.message}")
    return render json: { error: "Invalid payload" }, status: :bad_request
  rescue Stripe::SignatureVerificationError => e
    # Invalid signature
    Rails.logger.error("Webhook signature verification failed: #{e.message}")
    return render json: { error: "Invalid signature" }, status: :unauthorized
  end

  # Process verified event...
end
```

**Idempotency:**
```ruby
# Prevent duplicate processing
def process_webhook_event(event)
  # Check if already processed
  if WebhookEvent.exists?(stripe_event_id: event.id)
    Rails.logger.info("Webhook #{event.id} already processed, skipping")
    return { status: "already_processed" }
  end

  # Process the event
  result = case event.type
    when "customer.subscription.deleted"
      handle_subscription_deleted(event.data.object)
    when "invoice.payment_failed"
      handle_payment_failed(event.data.object)
    # ...
  end

  # Record that we processed it
  WebhookEvent.create!(
    stripe_event_id: event.id,
    event_type: event.type,
    processed_at: Time.current,
    payload: event.to_json
  )

  result
end
```

**Security Notes:**
- NEVER skip signature verification
- Store webhook secret securely (Rails credentials)
- Implement idempotency checks
- Log all webhook events for audit trail
- Handle webhook retries gracefully
- Return 200 OK quickly (process asynchronously if slow)

---

## API Reference

### Scooper Endpoints

#### POST /stripe_connect/onboard
Initiate Stripe Connect onboarding for a scooper.

**Authentication:** Required (JWT)
**Authorization:** User must be scooper (`is_scooper = true`)

**Response:**
```json
{
  "url": "https://connect.stripe.com/setup/...",
  "message": "Redirecting to Stripe onboarding..."
}
```

**Errors:**
- `403 Forbidden`: User is not a scooper
- `503 Service Unavailable`: Stripe Connect not configured

---

#### GET /stripe_connect/status
Check Connect account status.

**Authentication:** Required (JWT)
**Authorization:** User must be scooper

**Response:**
```json
{
  "connected": true,
  "charges_enabled": true,
  "payouts_enabled": true,
  "details_submitted": true,
  "requirements": {
    "currently_due": [],
    "eventually_due": [],
    "past_due": []
  }
}
```

---

#### GET /stripe_connect/dashboard
Get link to Stripe Express Dashboard.

**Authentication:** Required (JWT)
**Authorization:** User must be scooper with Connect account

**Response:**
```json
{
  "url": "https://connect.stripe.com/express/..."
}
```

---

### Resident Endpoints

#### POST /pledges
Create a new pledge to support a scooper.

**Authentication:** Required (JWT)
**Authorization:** User must have client profile

**Request:**
```json
{
  "coverage_region_id": 123,
  "pledge": {
    "amount": 15.00,
    "anonymous": false,
    "payment_method_id": "pm_1234567890abcdef"
  }
}
```

**Response:**
```json
{
  "pledge": {
    "id": 456,
    "amount": 15.00,
    "status": "active",
    "block": { ... },
    "scooper": { ... },
    "stripe_subscription_id": "sub_1234567890abcdef"
  },
  "message": "Pledge created successfully!",
  "block_activated": true
}
```

**Errors:**
- `403 Forbidden`: No client profile
- `422 Unprocessable Entity`: Validation errors
  - Already have pledge on this block
  - Amount less than $5
  - Invalid payment method
  - Scooper not ready

---

#### DELETE /pledges/:id
Cancel a pledge (and Stripe subscription).

**Authentication:** Required (JWT)
**Authorization:** Must own the pledge

**Response:**
```json
{
  "message": "Pledge cancelled successfully"
}
```

**Side Effects:**
- Cancels Stripe subscription immediately
- Updates pledge status to "cancelled"
- If block funding drops below threshold → Warning state

---

### Webhook Endpoint

#### POST /stripe/webhook
Receive Stripe webhook events.

**Authentication:** Stripe signature verification
**Authorization:** None (public endpoint)

**Headers:**
```
Stripe-Signature: t=1234567890,v1=abc123...,v0=def456...
```

**Request:** Raw Stripe event JSON

**Response:**
```json
{
  "status": "success"
}
```

---

## Testing Guide

### Local Testing with Stripe CLI

**1. Install Stripe CLI:**
```bash
brew install stripe/stripe-cli/stripe
stripe login
```

**2. Forward webhooks to local server:**
```bash
# Terminal 1: Start Rails server
rails server

# Terminal 2: Forward webhooks
stripe listen --forward-to localhost:3000/stripe/webhook

# Copy webhook signing secret to credentials
# whsec_xxxxxxxxxxxxxxxxxxxxx
```

**3. Trigger test events:**
```bash
# Test subscription created
stripe trigger customer.subscription.created

# Test payment succeeded
stripe trigger invoice.payment_succeeded

# Test payment failed
stripe trigger invoice.payment_failed

# Test subscription cancelled
stripe trigger customer.subscription.deleted
```

**4. Test Connect flow:**
```bash
# Create test Express account
stripe accounts create --type=express

# Get account link
stripe account_links create \
  --account=acct_xxxxxxxxxx \
  --type=account_onboarding
```

---

### Test Scenarios

#### Scenario 1: Happy Path - Resident Pledges
```
1. Create scooper user → Complete Connect onboarding
2. Scooper claims block at $50/month
3. Resident 1 pledges $20
4. Resident 2 pledges $30
5. Block activates (total = $50)
6. Verify subscriptions created for both residents
7. Wait 30 days → Verify charges processed
8. Verify 85% transferred to scooper
```

#### Scenario 2: Payment Failure
```
1. Resident pledges with test card 4000000000000341 (charge_fails)
2. Verify payment_failed webhook received
3. Verify resident receives notification
4. Resident updates payment method
5. Stripe retries → Success
```

#### Scenario 3: Resident Cancels
```
1. Active pledge with monthly subscription
2. Resident cancels pledge
3. Verify Stripe subscription cancelled
4. Verify block funding recalculated
5. If below threshold → Block enters warning (90 days)
```

#### Scenario 4: Race Condition
```
1. Block at $48/50 (needs $2)
2. Two residents pledge $5 simultaneously (in separate threads)
3. Only ONE should activate the block
4. The first to acquire lock wins
5. Second pledge succeeds but doesn't trigger activation
```

---

### Test Cards

```
Success:           4242 4242 4242 4242
Decline:           4000 0000 0000 0002
Insufficient funds: 4000 0000 0000 9995
Requires 3DS:      4000 0025 0000 3155
```

---

## Production Checklist

### Before Launch

- [ ] **Enable Stripe Connect**
  - [ ] Apply for Stripe Connect in Dashboard
  - [ ] Wait for approval (can take 1-2 business days)
  - [ ] Get Connect Client ID
  - [ ] Add to Rails credentials: `stripe: { connect_client_id: "ca_..." }`

- [ ] **Configure Webhooks**
  - [ ] Add webhook endpoint in Stripe Dashboard
  - [ ] URL: `https://yourdomain.com/stripe/webhook`
  - [ ] Events to subscribe:
    - [ ] `customer.subscription.deleted`
    - [ ] `customer.subscription.updated`
    - [ ] `invoice.payment_failed`
    - [ ] `invoice.payment_succeeded`
    - [ ] `account.updated`
  - [ ] Copy webhook signing secret
  - [ ] Add to Rails credentials: `stripe: { webhook_secret: "whsec_..." }`

- [ ] **Update API Keys**
  - [ ] Get live API keys (not test keys)
  - [ ] Add to Rails credentials:
    ```yaml
    stripe:
      publishable_key: pk_live_...
      secret_key: sk_live_...
      connect_client_id: ca_...
      webhook_secret: whsec_...
    ```

- [ ] **Security Hardening**
  - [ ] Test webhook signature verification
  - [ ] Enable Stripe Radar (fraud detection)
  - [ ] Set up rate limiting (rack-attack)
  - [ ] Add unique database indexes (see migrations)
  - [ ] Test race condition fixes
  - [ ] Review CORS origins

- [ ] **Frontend Integration**
  - [ ] Implement Stripe Elements for payment collection
  - [ ] Handle 3D Secure (SCA) authentication
  - [ ] Test on iOS and Android (if React Native)
  - [ ] Test on multiple browsers (if web)

- [ ] **Monitoring & Logging**
  - [ ] Set up error tracking (Sentry, Rollbar, etc.)
  - [ ] Enable Stripe webhook event logging
  - [ ] Set up alerts for payment failures
  - [ ] Monitor subscription churn rate

- [ ] **Compliance**
  - [ ] Review Stripe Terms of Service
  - [ ] Update Privacy Policy (mention Stripe)
  - [ ] Update Terms of Service (payment terms)
  - [ ] Ensure PCI compliance (using Stripe.js)

- [ ] **End-to-End Testing**
  - [ ] Test full scooper onboarding flow
  - [ ] Test full resident pledge flow
  - [ ] Test subscription creation
  - [ ] Test monthly billing cycle
  - [ ] Test payment failures and retries
  - [ ] Test cancellation flow
  - [ ] Test payout to scoopers

---

### Switching to Live Mode

```bash
# 1. Update credentials
EDITOR="code --wait" rails credentials:edit

# Add live keys:
stripe:
  publishable_key: pk_live_xxxxx
  secret_key: sk_live_xxxxx
  connect_client_id: ca_xxxxx
  webhook_secret: whsec_xxxxx

# 2. Restart server
# 3. Test with real card (small amount)
# 4. Verify webhook delivery in Stripe Dashboard
# 5. Monitor logs for first 24 hours
```

---

## Troubleshooting

### Common Issues

#### "No such customer"
**Cause:** Customer ID stored in database doesn't exist in Stripe.
**Fix:** Check if you're using test vs. live mode consistently. Test customer IDs (starting with `cus_test_`) won't work in live mode.

#### "Destination account must have at least one of the following capabilities enabled: transfers, card_payments"
**Cause:** Scooper's Connect account not ready.
**Fix:** Check `account.charges_enabled` before creating subscription.

#### "No such payment method"
**Cause:** Payment method ID from frontend is invalid or from different mode.
**Fix:** Ensure frontend uses same publishable key mode (test/live) as backend.

#### Webhooks not being received
**Cause:** Webhook endpoint not configured or signature verification failing.
**Fix:**
1. Check webhook endpoint in Stripe Dashboard
2. Verify webhook secret matches credentials
3. Check server logs for signature errors
4. Test with Stripe CLI locally

#### Race condition - two scoopers both think they won
**Cause:** Database locking not working.
**Fix:** Ensure PostgreSQL transaction isolation level is correct and pessimistic locking is implemented.

#### Subscription created but payment failed
**Cause:** Payment method requires 3D Secure authentication.
**Fix:** Check subscription status, handle `requires_action` on frontend with `stripe.confirmCardPayment()`.

---

## Additional Resources

- [Stripe Connect Documentation](https://stripe.com/docs/connect)
- [Stripe Subscriptions Guide](https://stripe.com/docs/billing/subscriptions/overview)
- [Stripe Webhooks Best Practices](https://stripe.com/docs/webhooks/best-practices)
- [Stripe Testing Guide](https://stripe.com/docs/testing)
- [PCI Compliance with Stripe](https://stripe.com/docs/security/guide)

---

## Support

For Stripe-related issues:
- Stripe Support: https://support.stripe.com
- Stripe Status Page: https://status.stripe.com

For application-specific issues:
- Check logs: `tail -f log/production.log`
- Monitor webhooks: Stripe Dashboard → Developers → Webhooks
- Review failed payments: Stripe Dashboard → Payments
