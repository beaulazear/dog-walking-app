# Stripe Integration Guide - Complete Setup

**Application:** Scoop Dog Waste Cleanup Marketplace
**Integration Type:** Stripe Connect (Two-Sided Marketplace)
**Version:** Production Ready
**Last Updated:** 2026-02-15

---

## Table of Contents

1. [Overview](#overview)
2. [Stripe Account Setup](#stripe-account-setup)
3. [Backend Configuration](#backend-configuration)
4. [Frontend Implementation](#frontend-implementation)
5. [Testing](#testing)
6. [Production Deployment](#production-deployment)
7. [Monitoring & Maintenance](#monitoring--maintenance)
8. [Troubleshooting](#troubleshooting)

---

## Overview

### What is Scoop's Payment Model?

Scoop operates as a **two-sided marketplace**:

```
Residents pay monthly subscriptions
         ↓
    Stripe processes payment
         ↓
    85% goes to Scooper
    15% stays with platform (Scoop)
```

### Stripe Products Used

1. **Stripe Connect (Express Accounts)**
   - Scoopers create Express accounts
   - Platform manages onboarding
   - Automatic payouts to scoopers

2. **Subscriptions**
   - Residents pay monthly recurring charges
   - Automatic billing on subscription anniversary
   - Smart retries for failed payments

3. **Application Fees**
   - 15% taken from each payment
   - Automatically handled by Stripe
   - No manual calculation needed

4. **Webhooks**
   - Real-time notifications for events
   - Subscription lifecycle management
   - Payment status updates

---

## Stripe Account Setup

### Step 1: Create Stripe Account

1. **Go to:** https://dashboard.stripe.com/register
2. **Sign up** with your business email
3. **Verify email** address
4. **Complete business profile:**
   - Business name: "Scoop" (or your LLC name)
   - Country: United States
   - Business type: Company or Individual
   - Tax ID: Your EIN (if LLC) or SSN

### Step 2: Activate Your Account

1. **Dashboard → Get Started**
2. **Provide business details:**
   - Legal business name
   - Business address
   - Phone number
   - Website URL (once live)
   - Product description: "Two-sided marketplace for dog waste cleanup services"

3. **Add bank account** for payouts:
   - Navigate to: Settings → Business settings → Payout details
   - Enter bank routing and account numbers
   - Verify with micro-deposits (takes 1-2 days)

### Step 3: Enable Stripe Connect

**CRITICAL:** This is required for the marketplace to function.

1. **Navigate to:** Dashboard → Connect → Get Started
2. **Select platform type:** "Platform or marketplace"
3. **Fill out application:**
   - **Platform name:** Scoop
   - **Platform description:** "Marketplace connecting residents with professional scoopers for block cleanup services"
   - **Customer payment types:** Subscriptions
   - **Connected account types:** Express accounts
   - **Industry:** Service marketplace

4. **Submit application**
   - Review takes 1-2 business days
   - Stripe may request additional documentation
   - You'll receive email when approved

5. **After approval, get your Client ID:**
   - Navigate to: Connect → Settings
   - Copy your **Client ID** (starts with `ca_`)
   - Save this securely - you'll need it for backend configuration

### Step 4: Configure Webhook Endpoints

1. **Navigate to:** Developers → Webhooks
2. **Click:** Add endpoint
3. **Enter endpoint URL:**
   - Development: `https://your-dev-url.com/stripe/webhook`
   - Production: `https://your-domain.com/stripe/webhook`

4. **Select events to listen to:**
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `invoice.upcoming`
   - `account.updated`
   - `charge.failed`

5. **Click:** Add endpoint
6. **Reveal signing secret:**
   - Click on the webhook endpoint you just created
   - Click "Reveal" next to Signing secret
   - Copy the secret (starts with `whsec_`)
   - Save this securely - you'll need it for backend configuration

### Step 5: Get API Keys

1. **Navigate to:** Developers → API keys
2. **Copy your keys:**

   **For Development/Testing:**
   - Publishable key: `pk_test_...`
   - Secret key: `sk_test_...`

   **For Production (switch when ready):**
   - Click "View test data" toggle (turns off)
   - Publishable key: `pk_live_...`
   - Secret key: `sk_live_...`

   ⚠️ **NEVER COMMIT SECRET KEYS TO GIT**

### Step 6: Enable Additional Security Features

1. **Stripe Radar** (Fraud Detection):
   - Navigate to: Radar → Settings
   - Enable "Evaluate all payments"
   - Review recommended rules

2. **Email Receipts**:
   - Navigate to: Settings → Email receipts
   - Customize receipt template
   - Add your logo

3. **Billing Settings**:
   - Navigate to: Settings → Billing
   - Set default statement descriptor: "SCOOP CLEANUP"
   - This appears on customer credit card statements

---

## Backend Configuration

### Step 1: Store Credentials Securely

**NEVER store keys in code or environment files!**

Use Rails encrypted credentials:

```bash
# Open encrypted credentials file
EDITOR="code --wait" rails credentials:edit

# Add your Stripe keys (replace with your actual keys)
```

Add this structure to the credentials file:

```yaml
# config/credentials.yml.enc (decrypted)

stripe:
  # Development/Test keys
  test:
    publishable_key: pk_test_51ABC...
    secret_key: sk_test_51ABC...
    webhook_secret: whsec_test_...

  # Production/Live keys
  live:
    publishable_key: pk_live_51ABC...
    secret_key: sk_live_51ABC...
    connect_client_id: ca_ABC...
    webhook_secret: whsec_live_...

# Active configuration (change for production)
stripe_mode: test  # or 'live' for production

# Select the appropriate keys based on mode
stripe:
  publishable_key: <%= Rails.application.credentials.dig(:stripe, Rails.application.credentials[:stripe_mode] || :test, :publishable_key) %>
  secret_key: <%= Rails.application.credentials.dig(:stripe, Rails.application.credentials[:stripe_mode] || :test, :secret_key) %>
  connect_client_id: <%= Rails.application.credentials.dig(:stripe, :live, :connect_client_id) %>  # Only in live
  webhook_secret: <%= Rails.application.credentials.dig(:stripe, Rails.application.credentials[:stripe_mode] || :test, :webhook_secret) %>
```

**Or, simplified version:**

```yaml
stripe:
  publishable_key: pk_test_51ABC...  # Change to pk_live_ for production
  secret_key: sk_test_51ABC...        # Change to sk_live_ for production
  connect_client_id: ca_ABC...        # Add after Connect approved
  webhook_secret: whsec_test_...      # Change to whsec_live_ for production
```

Save and close the editor. The file will be encrypted automatically.

### Step 2: Verify Configuration

Check that Stripe initializer loads correctly:

```bash
# Start Rails console
rails console

# Check configuration
Rails.configuration.stripe
# => {
#   :publishable_key => "pk_test_...",
#   :secret_key => "sk_test_...",
#   :connect_client_id => "ca_..."
# }

# Check Stripe gem can connect
Stripe::Account.retrieve
# Should return your Stripe account info
```

### Step 3: Test Webhook Locally

Install Stripe CLI for local webhook testing:

```bash
# macOS
brew install stripe/stripe-cli/stripe

# Login to Stripe
stripe login
# Opens browser to authenticate

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/stripe/webhook

# In another terminal, start Rails
rails server

# Trigger a test event
stripe trigger customer.subscription.created

# Check Rails logs for webhook processing
```

Expected output in Rails logs:
```
Stripe webhook received: customer.subscription.created
Webhook evt_ABC... processed successfully
```

### Step 4: Run Database Migrations

```bash
# Run all pending migrations
rails db:migrate

# Verify critical tables exist
rails console
WebhookEvent.count  # Should return 0 (table exists)
Pledge.column_names.include?('stripe_payment_method_id')  # Should return true
```

### Step 5: Environment-Specific Configuration

**For staging/production deployments:**

```bash
# Heroku
heroku config:set RAILS_MASTER_KEY=your_master_key -a your-app-name

# Render (in dashboard)
# Add environment variable: RAILS_MASTER_KEY = your_master_key

# The master key decrypts credentials.yml.enc
# Find it in: config/master.key (never commit this file!)
```

---

## Frontend Implementation

### Step 1: Install Stripe.js

**For React Native (Expo):**

```bash
npm install @stripe/stripe-react-native
npx pod-install  # iOS only
```

**For React Web:**

```bash
npm install @stripe/stripe-js @stripe/react-stripe-js
```

### Step 2: Initialize Stripe

**React Native (App.tsx or App.jsx):**

```javascript
import { StripeProvider } from '@stripe/stripe-react-native';

const STRIPE_PUBLISHABLE_KEY = 'pk_test_...';  // From your Stripe dashboard

export default function App() {
  return (
    <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
      {/* Your app components */}
    </StripeProvider>
  );
}
```

**React Web (App.tsx or App.jsx):**

```javascript
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe('pk_test_...');  // From your Stripe dashboard

export default function App() {
  return (
    <Elements stripe={stripePromise}>
      {/* Your app components */}
    </Elements>
  );
}
```

### Step 3: Implement Payment Collection Component

**React Native:**

```javascript
import React, { useState } from 'react';
import { View, Button, Alert } from 'react-native';
import { CardField, useStripe } from '@stripe/stripe-react-native';

export default function PledgePaymentScreen({ coverageRegionId, amount }) {
  const { createPaymentMethod } = useStripe();
  const [loading, setLoading] = useState(false);

  const handlePledge = async () => {
    setLoading(true);

    try {
      // 1. Create payment method
      const { paymentMethod, error } = await createPaymentMethod({
        paymentMethodType: 'Card',
        paymentMethodData: {
          billingDetails: {
            email: 'user@example.com',  // Get from your user state
          },
        },
      });

      if (error) {
        Alert.alert('Error', error.message);
        setLoading(false);
        return;
      }

      // 2. Send to backend
      const response = await fetch('https://your-api.com/pledges', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${yourJWTToken}`,  // Your auth token
        },
        body: JSON.stringify({
          coverage_region_id: coverageRegionId,
          pledge: {
            amount: amount,
            anonymous: false,
            payment_method_id: paymentMethod.id,  // CRITICAL
          },
        }),
      });

      const result = await response.json();

      // 3. Handle 3D Secure if required
      if (result.requires_action && result.client_secret) {
        const { error: confirmError } = await confirmPayment(result.client_secret, {
          paymentMethodType: 'Card',
        });

        if (confirmError) {
          Alert.alert('Payment Failed', confirmError.message);
        } else {
          Alert.alert('Success', 'Pledge created! Payment confirmed.');
        }
      } else {
        Alert.alert('Success', 'Pledge created successfully!');
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <CardField
        postalCodeEnabled={true}
        placeholder={{
          number: '4242 4242 4242 4242',
        }}
        cardStyle={{
          backgroundColor: '#FFFFFF',
          textColor: '#000000',
        }}
        style={{
          width: '100%',
          height: 50,
          marginVertical: 30,
        }}
      />
      <Button
        title={`Pledge $${amount}/month`}
        onPress={handlePledge}
        disabled={loading}
      />
    </View>
  );
}
```

**React Web:**

```javascript
import React, { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

export default function PledgePaymentForm({ coverageRegionId, amount }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    if (!stripe || !elements) {
      return;
    }

    try {
      // 1. Create payment method
      const { paymentMethod, error } = await stripe.createPaymentMethod({
        type: 'card',
        card: elements.getElement(CardElement),
        billing_details: {
          email: 'user@example.com',  // Get from your user state
        },
      });

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      // 2. Send to backend
      const response = await fetch('https://your-api.com/pledges', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${yourJWTToken}`,
        },
        body: JSON.stringify({
          coverage_region_id: coverageRegionId,
          pledge: {
            amount: amount,
            anonymous: false,
            payment_method_id: paymentMethod.id,
          },
        }),
      });

      const result = await response.json();

      // 3. Handle 3D Secure if required
      if (result.requires_action && result.client_secret) {
        const { error: confirmError } = await stripe.confirmCardPayment(
          result.client_secret
        );

        if (confirmError) {
          setError(confirmError.message);
        } else {
          alert('Pledge created successfully!');
        }
      } else if (result.error) {
        setError(result.error);
      } else {
        alert('Pledge created successfully!');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardElement
        options={{
          style: {
            base: {
              fontSize: '16px',
              color: '#424770',
              '::placeholder': {
                color: '#aab7c4',
              },
            },
            invalid: {
              color: '#9e2146',
            },
          },
        }}
      />
      {error && <div style={{ color: 'red', marginTop: 10 }}>{error}</div>}
      <button
        type="submit"
        disabled={!stripe || loading}
        style={{ marginTop: 20 }}
      >
        {loading ? 'Processing...' : `Pledge $${amount}/month`}
      </button>
    </form>
  );
}
```

### Step 4: Implement Scooper Connect Onboarding

**React Native:**

```javascript
import { Linking } from 'react-native';

async function handleConnectOnboarding() {
  try {
    const response = await fetch('https://your-api.com/stripe_connect/onboard', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${yourJWTToken}`,
      },
    });

    const { url } = await response.json();

    // Open Stripe Connect onboarding in browser
    await Linking.openURL(url);
  } catch (error) {
    Alert.alert('Error', error.message);
  }
}
```

**React Web:**

```javascript
async function handleConnectOnboarding() {
  try {
    const response = await fetch('https://your-api.com/stripe_connect/onboard', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${yourJWTToken}`,
      },
    });

    const { url } = await response.json();

    // Redirect to Stripe Connect onboarding
    window.location.href = url;
  } catch (error) {
    alert('Error: ' + error.message);
  }
}
```

### Step 5: Handle Return from Stripe Connect

After scoopers complete onboarding, Stripe redirects them back to your app.

**Setup return URLs in backend:**

Already configured in `app/controllers/stripe_connect_controller.rb`:
```ruby
refresh_url: "#{ENV['FRONTEND_URL']}/scooper/stripe/refresh"
return_url: "#{ENV['FRONTEND_URL']}/scooper/stripe/success"
```

**Frontend route handling:**

```javascript
// React Router example
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function StripeConnectSuccess() {
  const navigate = useNavigate();

  useEffect(() => {
    // Check Connect status
    fetch('https://your-api.com/stripe_connect/status', {
      headers: {
        'Authorization': `Bearer ${yourJWTToken}`,
      },
    })
      .then(res => res.json())
      .then(data => {
        if (data.charges_enabled) {
          alert('Stripe Connect setup complete! You can now receive payments.');
          navigate('/dashboard');
        } else {
          alert('Almost done! Please complete the remaining steps.');
          // Trigger onboarding again if needed
        }
      });
  }, []);

  return <div>Processing your Stripe account setup...</div>;
}
```

### Step 6: Environment Configuration

**Create environment files:**

```javascript
// .env.development
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_51ABC...
REACT_APP_API_URL=http://localhost:3000

// .env.production
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_51ABC...
REACT_APP_API_URL=https://api.your-domain.com
```

**Use in code:**

```javascript
const STRIPE_KEY = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY;
const API_URL = process.env.REACT_APP_API_URL;
```

---

## Testing

### Test Cards

Stripe provides test cards for different scenarios:

**Success:**
- `4242 4242 4242 4242` - Succeeds immediately
- CVC: Any 3 digits
- Expiry: Any future date

**Requires 3D Secure:**
- `4000 0027 6000 3184` - Triggers 3D Secure authentication

**Declined:**
- `4000 0000 0000 0002` - Card declined

**Insufficient Funds:**
- `4000 0000 0000 9995` - Insufficient funds

**Full list:** https://stripe.com/docs/testing

### Test Scenarios

#### 1. Test Scooper Onboarding

```bash
# 1. Create test user in app
# 2. Enable scooper mode (is_scooper = true)
# 3. Click "Connect Stripe" in app
# 4. Fill out test Connect account form
# Use test data:
#   - SSN: 000000000
#   - DOB: 01/01/1901
#   - Account: 000123456789
#   - Routing: 110000000
# 5. Complete onboarding
# 6. Verify charges_enabled = true
```

#### 2. Test Pledge Creation

```bash
# 1. Create test client
# 2. Find a block with coverage region
# 3. Use test card: 4242 4242 4242 4242
# 4. Create pledge
# Expected: Subscription created, status = pending or active
```

#### 3. Test 3D Secure

```bash
# Use test card: 4000 0027 6000 3184
# Expected: requires_action = true, client_secret returned
# Frontend should show authentication popup
# Complete authentication
# Expected: Subscription becomes active
```

#### 4. Test Webhook Processing

```bash
# Using Stripe CLI
stripe listen --forward-to localhost:3000/stripe/webhook

# Trigger events
stripe trigger customer.subscription.created
stripe trigger invoice.payment_succeeded
stripe trigger invoice.payment_failed

# Check Rails logs
tail -f log/development.log

# Check WebhookEvent table
rails console
WebhookEvent.all
```

#### 5. Test Block Activation

```bash
# 1. Scooper creates coverage region at $30/month
# 2. Resident 1 pledges $20
# Expected: Block still inactive
# 3. Resident 2 pledges $10
# Expected: Block activates, both subscriptions created
# 4. Verify only one block activation occurred
```

#### 6. Test Payment Failure

```bash
# Use test card: 4000 0000 0000 0341 (charge_fails)
# Expected: invoice.payment_failed webhook
# Check that pledge status updated correctly
```

### Testing Checklist

- [ ] Scooper can complete Connect onboarding
- [ ] Connect status shows charges_enabled = true
- [ ] Resident can create pledge with valid card
- [ ] Subscription is created in Stripe Dashboard
- [ ] 3D Secure works with test card
- [ ] Block activates when fully funded
- [ ] Only one scooper wins if multiple reach threshold simultaneously
- [ ] Webhooks are received and processed
- [ ] WebhookEvent table records all events
- [ ] Payment failures are handled gracefully
- [ ] Resident can cancel pledge
- [ ] Subscription is cancelled in Stripe
- [ ] Block enters warning state if funding drops

---

## Production Deployment

### Step 1: Switch to Live Mode

**Update credentials:**

```bash
EDITOR="code --wait" rails credentials:edit

# Change stripe keys to live keys
stripe:
  publishable_key: pk_live_51ABC...  # Changed from pk_test_
  secret_key: sk_live_51ABC...        # Changed from sk_test_
  connect_client_id: ca_ABC...
  webhook_secret: whsec_live_...      # Changed from whsec_test_
```

**Update frontend environment:**

```bash
# .env.production
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_51ABC...
```

### Step 2: Configure Production Webhook

1. **In Stripe Dashboard**, switch to Live mode (toggle off "View test data")
2. **Go to:** Developers → Webhooks
3. **Add endpoint:** `https://your-production-domain.com/stripe/webhook`
4. **Select same events** as test mode
5. **Copy new signing secret** (starts with `whsec_live_`)
6. **Update credentials** with new webhook secret

### Step 3: Enable Production Features

**Force SSL:**

```ruby
# config/environments/production.rb
config.force_ssl = true  # Uncomment this line
```

**Update CORS:**

```ruby
# config/initializers/cors.rb
# Remove localhost origins, keep only production domains
origins "https://your-domain.com", "https://www.your-domain.com"
```

**Set Frontend URL:**

```bash
# Heroku
heroku config:set FRONTEND_URL=https://your-domain.com -a your-app-name

# Render
# Add environment variable in dashboard:
# FRONTEND_URL = https://your-domain.com
```

### Step 4: Database Preparation

```bash
# Production environment
# Heroku
heroku run rails db:migrate -a your-app-name

# Render
# Migrations run automatically on deploy

# Verify
heroku run rails console -a your-app-name
WebhookEvent.count  # Should return 0
```

### Step 5: Deploy Code

```bash
# Git deploy
git add .
git commit -m "Configure production Stripe integration"
git push production main

# Or platform-specific
git push heroku main
```

### Step 6: Verify Deployment

**Test webhook endpoint:**

```bash
# Use Stripe CLI with live keys
stripe login

# Trigger test event in live mode
stripe trigger --live customer.subscription.created

# Check Stripe Dashboard → Developers → Webhooks
# Should show successful delivery
```

**Test full flow with real card:**

```bash
# Use a real credit card with SMALL amount ($5 minimum)
# 1. Complete scooper Connect onboarding (real info!)
# 2. Create real pledge
# 3. Verify in Stripe Dashboard → Payments
# 4. Check Connect Dashboard for scooper's earnings
# 5. Cancel immediately after testing (to avoid monthly charges)
```

### Step 7: Enable Monitoring

**Stripe Dashboard Monitoring:**
- Dashboard → Payments (monitor charges)
- Dashboard → Connect → Accounts (monitor scoopers)
- Dashboard → Developers → Webhooks (monitor delivery)

**Application Monitoring:**

```ruby
# Add error tracking (Sentry example)
# Gemfile
gem 'sentry-ruby'
gem 'sentry-rails'

# config/initializers/sentry.rb
Sentry.init do |config|
  config.dsn = Rails.application.credentials.dig(:sentry, :dsn)
  config.environment = Rails.env
  config.traces_sample_rate = 0.1
end
```

### Step 8: Post-Deployment Verification

**Checklist:**
- [ ] Webhook endpoint responding (check Stripe Dashboard)
- [ ] Scoopers can complete real Connect onboarding
- [ ] Real pledges create real subscriptions
- [ ] Funds transfer to scoopers correctly (85%)
- [ ] Platform receives correct fee (15%)
- [ ] Error tracking working
- [ ] Logs show no errors

---

## Monitoring & Maintenance

### Daily Monitoring

**Check Stripe Dashboard:**
- Failed payments (should be <5%)
- Webhook delivery rate (should be 100%)
- Disputed charges
- Connect account status

**Check Application:**

```ruby
# Rails console
rails console

# Check for stuck pledges
Pledge.where(status: 'pending').where('created_at < ?', 2.days.ago)

# Check webhook processing
WebhookEvent.where('created_at > ?', 24.hours.ago).group(:event_type).count

# Check recent errors
WebhookEvent.where("payload LIKE '%error%'").where('created_at > ?', 24.hours.ago)
```

### Weekly Tasks

1. **Review failed payments:**
```ruby
# Find pledges with failed payments
failed_subs = Pledge.active.select { |p|
  sub = Stripe::Subscription.retrieve(p.stripe_subscription_id) rescue nil
  sub && sub.status == 'past_due'
}
```

2. **Check Connect account health:**
```ruby
# Find scoopers with requirements
users_needing_action = User.where(is_scooper: true).select { |u|
  next unless u.stripe_connect_account_id
  account = Stripe::Account.retrieve(u.stripe_connect_account_id) rescue nil
  account && account.requirements.currently_due.any?
}
```

3. **Webhook delivery audit:**
   - Stripe Dashboard → Webhooks
   - Check for failed deliveries
   - Retry if needed

### Monthly Tasks

1. **Review fraud/disputes:**
   - Stripe Dashboard → Radar
   - Review blocked payments
   - Adjust rules if needed

2. **Financial reconciliation:**
   - Compare Stripe payouts to expected amounts
   - Verify 15% platform fee applied correctly
   - Check for chargebacks

3. **Performance review:**
   - Average pledge amount
   - Subscription churn rate
   - Payment success rate
   - Connect account approval rate

### Alerts to Set Up

**Critical Alerts:**
- Webhook delivery failure rate > 5%
- Payment success rate < 90%
- Subscription creation failures
- Connect account creation failures

**Warning Alerts:**
- Chargeback received
- Unusual payment volume
- Multiple failed payments from same customer

**Stripe Alert Configuration:**
- Dashboard → Settings → Notifications
- Enable email alerts for disputes, failed payouts, etc.

---

## Troubleshooting

### Common Issues

#### "No such customer: cus_..."

**Cause:** Customer ID in database doesn't match Stripe
**Solution:**
```ruby
# Check if using test vs. live keys consistently
Rails.configuration.stripe[:secret_key]  # Should start with sk_live_ in production

# Customer IDs from test mode (cus_test_...) won't work in live mode
```

#### "Destination account must have capabilities enabled"

**Cause:** Scooper's Connect account not fully set up
**Solution:**
```ruby
# Check scooper's account status
user = User.find(123)
account = Stripe::Account.retrieve(user.stripe_connect_account_id)
account.charges_enabled  # Must be true
account.requirements.currently_due  # Should be empty array
```

If false or has requirements:
- Contact scooper to complete onboarding
- Check email for Stripe notifications
- Use onboard endpoint to regenerate link

#### "No such payment method: pm_..."

**Cause:** Payment method ID invalid or from different mode
**Solution:**
- Verify frontend using correct publishable key
- Check test vs. live mode consistency
- Payment methods from test mode won't work in live mode

#### Webhook not being received

**Diagnosis:**
```bash
# Check webhook endpoint
curl -X POST https://your-domain.com/stripe/webhook

# Should return 400 (signature required, but endpoint is up)
```

**Solutions:**
1. Verify webhook URL in Stripe Dashboard
2. Check server logs for errors
3. Verify webhook secret in credentials
4. Test with Stripe CLI:
```bash
stripe listen --forward-to https://your-domain.com/stripe/webhook
stripe trigger customer.subscription.created
```

#### 3D Secure payment stuck pending

**Cause:** Customer didn't complete authentication
**Solution:**
- Provide "Complete Payment" link in app
- Use client_secret stored in pledge record
- Frontend calls `stripe.confirmCardPayment(client_secret)`

#### Subscription created but payment failed

**Cause:** Payment method requires authentication or is invalid
**Diagnosis:**
```ruby
pledge = Pledge.find(123)
sub = Stripe::Subscription.retrieve(pledge.stripe_subscription_id)
sub.status  # Check status
sub.latest_invoice.payment_intent.status  # Check payment status
```

**If requires_action:**
- Send client_secret to frontend
- Have customer complete authentication

**If card declined:**
- Notify customer
- Request new payment method

### Support Contacts

**Stripe Support:**
- Email: support@stripe.com
- Dashboard: Click "?" icon → Contact Support
- Phone: Available for accounts with significant volume

**Documentation:**
- https://stripe.com/docs
- https://stripe.com/docs/connect
- https://stripe.com/docs/billing/subscriptions

**Status Page:**
- https://status.stripe.com

---

## Appendix

### A. Credentials Template

```yaml
# config/credentials.yml.enc (decrypted)

# Stripe Configuration
stripe:
  publishable_key: pk_test_OR_pk_live_...
  secret_key: sk_test_OR_sk_live_...
  connect_client_id: ca_...
  webhook_secret: whsec_test_OR_whsec_live_...

# Sentry (Error Tracking)
sentry:
  dsn: https://...@sentry.io/...

# AWS (for photo storage)
aws:
  access_key_id: AKIA...
  secret_access_key: ...
  region: us-east-1
  bucket: scoop-production

# Other secrets
secret_key_base: ...  # Auto-generated by Rails
```

### B. Environment Variables

**Required for Production:**

```bash
# Rails
RAILS_ENV=production
RAILS_MASTER_KEY=...  # Decrypts credentials.yml.enc
SECRET_KEY_BASE=...   # Or in credentials

# Database
DATABASE_URL=postgresql://...

# Frontend
FRONTEND_URL=https://your-domain.com

# Optional
RAILS_LOG_TO_STDOUT=true
RAILS_SERVE_STATIC_FILES=true  # If not using CDN
```

### C. API Endpoint Reference

**Stripe Connect Endpoints:**
- `POST /stripe_connect/onboard` - Start Connect onboarding
- `GET /stripe_connect/status` - Check Connect account status
- `GET /stripe_connect/dashboard` - Get Express Dashboard link

**Payment Endpoints:**
- `POST /pledges` - Create pledge with payment method
- `DELETE /pledges/:id` - Cancel pledge and subscription
- `POST /pledges/:id/switch_scooper` - Switch to different scooper

**Webhook Endpoint:**
- `POST /stripe/webhook` - Receive Stripe events

### D. Test Data

**Test Connect Account:**
```
SSN: 000000000
DOB: 01/01/1901
Account Number: 000123456789
Routing Number: 110000000
```

**Test Cards:**
```
Success: 4242 4242 4242 4242
3D Secure: 4000 0027 6000 3184
Decline: 4000 0000 0000 0002
Insufficient: 4000 0000 0000 9995
```

### E. Migration Checklist

**From Test to Live:**

- [ ] Update all credentials to live keys
- [ ] Configure live webhook endpoint
- [ ] Test webhook delivery
- [ ] Force SSL in production
- [ ] Update CORS to production domain only
- [ ] Update frontend publishable key
- [ ] Test Connect onboarding with real info
- [ ] Create test pledge with real card ($5)
- [ ] Verify subscription in Dashboard
- [ ] Cancel test subscription
- [ ] Monitor for 24 hours
- [ ] Enable Stripe Radar
- [ ] Configure email notifications
- [ ] Set up error tracking

---

**Document Version:** 1.0
**Last Updated:** 2026-02-15
**Next Review:** After first production deployment

**Questions?** Review the troubleshooting section or contact Stripe support.
