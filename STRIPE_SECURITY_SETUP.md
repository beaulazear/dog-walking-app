# Stripe Security Setup Guide

This guide walks you through securely configuring Stripe for your Scoop marketplace.

## Table of Contents
1. [Stripe Account Setup](#stripe-account-setup)
2. [Credentials Configuration](#credentials-configuration)
3. [Webhook Configuration](#webhook-configuration)
4. [Stripe Connect Setup](#stripe-connect-setup)
5. [Testing Configuration](#testing-configuration)
6. [Production Deployment](#production-deployment)
7. [Security Checklist](#security-checklist)

---

## 1. Stripe Account Setup

### Create Your Stripe Account

1. Go to [https://dashboard.stripe.com/register](https://dashboard.stripe.com/register)
2. Create an account for your Scoop LLC
3. Complete business verification (required for Connect)
4. Enable **Stripe Connect** in your dashboard

### Get Your API Keys

1. Navigate to **Developers** → **API keys**
2. You'll see two sets of keys:
   - **Test mode keys** (for development)
   - **Live mode keys** (for production)

**IMPORTANT:** NEVER commit these keys to git!

---

## 2. Credentials Configuration

### Rails Encrypted Credentials

Rails uses encrypted credentials to store secrets securely. Here's how to configure them:

### For Development (Test Mode)

```bash
# Open Rails credentials file (creates if doesn't exist)
EDITOR="code --wait" rails credentials:edit

# Or use vim
EDITOR="vim" rails credentials:edit
```

Add your Stripe credentials:

```yaml
stripe:
  publishable_key: <paste your test publishable key from Stripe Dashboard>
  secret_key: <paste your test secret key from Stripe Dashboard>
  connect_client_id: <paste your Connect client ID from Stripe Dashboard>
  webhook_secret: <paste your webhook signing secret from Stripe CLI>
```

**Where to find these:**

- **publishable_key**: Dashboard → Developers → API keys → Publishable key (test)
- **secret_key**: Dashboard → Developers → API keys → Secret key (test)
- **connect_client_id**: Dashboard → Settings → Connect → Client ID
- **webhook_secret**: Dashboard → Developers → Webhooks → Add endpoint → Signing secret

Save and close the editor. Rails will encrypt the file automatically.

### For Production (Live Mode)

```bash
# Edit production credentials
EDITOR="code --wait" rails credentials:edit --environment production
```

Add your **LIVE** Stripe keys:

```yaml
stripe:
  publishable_key: <paste your LIVE publishable key from Stripe Dashboard>
  secret_key: <paste your LIVE secret key from Stripe Dashboard>
  connect_client_id: <paste your LIVE Connect client ID from Stripe Dashboard>
  webhook_secret: <paste your LIVE webhook signing secret from Stripe Dashboard>
```

**⚠️  CRITICAL SECURITY NOTES:**

1. **NEVER** use live keys in development
2. **NEVER** commit credentials files to git
3. **NEVER** log API keys
4. Keep your `master.key` and `production.key` files secure
5. Back up your master keys in a secure password manager

---

## 3. Webhook Configuration

Webhooks notify your app about Stripe events (payments, subscription changes, etc.).

### Development (Using Stripe CLI)

1. **Install Stripe CLI:**
   ```bash
   brew install stripe/stripe-cli/stripe
   ```

2. **Login:**
   ```bash
   stripe login
   ```

3. **Forward webhooks to local server:**
   ```bash
   stripe listen --forward-to localhost:3000/stripe/webhooks
   ```

4. **Copy the webhook signing secret** (starts with `whsec_`) and add to credentials:
   ```bash
   EDITOR="code --wait" rails credentials:edit
   ```

### Production (Stripe Dashboard)

1. Go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Enter your production URL:
   ```
   https://your-api-domain.com/stripe/webhooks
   ```

4. Select events to listen for:
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `invoice.payment_failed`
   - ✅ `invoice.payment_succeeded`
   - ✅ `account.updated` (for Connect)

5. Copy the **Signing secret** and add to production credentials

6. **Test the webhook:**
   ```bash
   # From Stripe Dashboard
   Click "Send test webhook"
   ```

7. **Verify in your logs:**
   ```bash
   tail -f log/production.log | grep webhook
   ```

---

## 4. Stripe Connect Setup

Stripe Connect allows scoopers to receive payments directly.

### Enable Connect in Stripe Dashboard

1. Go to **Settings** → **Connect**
2. Click **Get started**
3. Choose **Platform or marketplace** (this is you - Scoop)
4. Complete the Connect application

### Platform Settings

Configure these settings in the Connect dashboard:

#### 1. Branding
- Add your Scoop logo
- Set brand color
- Add support email

#### 2. Platform Fee
- Set to **15%** (as per your business model)
- Choose "percentage of transaction"

#### 3. Payout Schedule
- **Recommended:** Daily automatic payouts
- Minimum payout threshold: $25

#### 4. Account Requirements
- ✅ Require business verification (prevents fraud)
- ✅ Collect beneficial owner information
- ✅ Require bank account for payouts

#### 5. Redirect URLs (for OAuth flow)

**Development:**
```
http://localhost:3000/stripe_connect/callback
```

**Production:**
```
https://your-api-domain.com/stripe_connect/callback
```

### Get Your Connect Client ID

1. Dashboard → Settings → Connect → Overview
2. Copy the **Client ID** (starts with `ca_`)
3. Add to credentials

---

## 5. Testing Configuration

### Verify Your Setup

Run the Stripe health check:

```bash
rails stripe:monitor:health
```

Expected output:
```
🔍 Stripe Integration Health Check
============================================================
📋 API Keys Configuration
------------------------------------------------------------
✅ Secret key: Configured (sk_test...)
✅ Publishable key: Configured (pk_test...)
✅ Connect client ID: Configured
...
```

### Test Stripe API Connection

```bash
rails console

# Test API connection
Stripe::Account.retrieve

# Should return your Stripe account details
```

### Test Webhook Endpoint

```bash
# In one terminal, start Rails server
rails server

# In another terminal, forward webhooks
stripe listen --forward-to localhost:3000/stripe/webhooks

# In third terminal, trigger a test event
stripe trigger payment_intent.succeeded
```

Check Rails logs for webhook processing:
```
Webhook payment_intent.succeeded processed successfully
```

---

## 6. Production Deployment

### Pre-Deployment Checklist

- [ ] Production credentials configured with LIVE keys
- [ ] Webhook endpoint configured in Stripe Dashboard
- [ ] Webhook secret added to production credentials
- [ ] SSL certificate installed (webhooks require HTTPS)
- [ ] Environment variables set on hosting platform (if using)
- [ ] Master key backed up securely
- [ ] Stripe Connect fully activated

### Deploy Credentials to Production

**If using Heroku:**
```bash
# Set master key as environment variable
heroku config:set RAILS_MASTER_KEY=<your_production_master_key>
```

**If using Render/Railway/Fly.io:**
Add `RAILS_MASTER_KEY` as an environment variable in dashboard.

**If using VPS (EC2, DigitalOcean):**
```bash
# Copy master key to server
scp config/master.key user@yourserver:/path/to/app/config/
```

### Verify Production Setup

```bash
# SSH into production server
ssh user@yourserver

# Check credentials are readable
rails console -e production

# Test Stripe connection
Stripe::Account.retrieve

# Check webhook secret
Rails.application.credentials.dig(:stripe, :webhook_secret)
```

### Monitor Stripe Operations

```bash
# Check recent errors
rails stripe:monitor:errors

# Validate scooper accounts
rails stripe:monitor:validate_scoopers

# Check for subscription mismatches
rails stripe:monitor:check_cancelled_subscriptions
```

---

## 7. Security Checklist

### Credentials Security

- [ ] Master key NOT committed to git
- [ ] Production credentials use LIVE keys
- [ ] Development credentials use TEST keys
- [ ] Webhook secret properly configured
- [ ] API keys never logged or exposed in responses
- [ ] Credentials backed up in secure password manager

### Webhook Security

- [ ] Webhook signature verification enabled
- [ ] HTTPS enforced for webhook endpoint
- [ ] Webhook endpoint NOT publicly listed
- [ ] Idempotency checks implemented (duplicate event handling)
- [ ] Webhook secret rotated quarterly

### Connect Security

- [ ] Connect client ID kept secret
- [ ] OAuth redirect URLs whitelisted
- [ ] Scooper account validation scheduled
- [ ] Platform fee properly configured (15%)
- [ ] Payout schedule configured correctly

### Monitoring

- [ ] Error tracking service configured (Sentry/Rollbar)
- [ ] Critical Stripe errors alert via email/Slack
- [ ] Daily health checks scheduled
- [ ] Subscription cancellation mismatches monitored
- [ ] Failed payment notifications enabled

### Compliance

- [ ] PCI DSS compliance reviewed (Stripe handles card data)
- [ ] Terms of Service updated for marketplace
- [ ] Privacy Policy includes payment processing
- [ ] Refund policy documented
- [ ] Tax handling configured (if applicable)

---

## Common Issues & Solutions

### Issue: "Stripe webhook secret not configured"

**Solution:**
```bash
EDITOR="vim" rails credentials:edit
# Add webhook_secret to stripe section
```

### Issue: Webhook signature verification failing

**Possible causes:**
1. Wrong webhook secret (test vs live mode mismatch)
2. Request modified by proxy/load balancer
3. Timestamp too old (replay attack protection)

**Solution:**
```bash
# Get correct secret from Stripe Dashboard
# Update credentials
rails credentials:edit

# Restart server
```

### Issue: Connect account creation failing

**Solution:**
1. Check Connect client ID is correct
2. Verify redirect URLs are whitelisted
3. Ensure business verification is complete
4. Check Stripe Dashboard for pending requirements

### Issue: "Subscription cancelled in DB but active in Stripe"

**Solution:**
```bash
# Find mismatches
rails stripe:monitor:check_cancelled_subscriptions

# Manually cancel in Stripe Dashboard or via console:
rails console
subscription = Stripe::Subscription.retrieve('sub_XXX')
Stripe::Subscription.cancel('sub_XXX')
```

---

## Testing in Stripe Test Mode

### Test Cards

Use these test cards for development:

- **Success:** 4242 4242 4242 4242
- **Declined:** 4000 0000 0000 0002
- **Insufficient funds:** 4000 0000 0000 9995
- **3D Secure required:** 4000 0027 6000 3184

**Expiry:** Any future date (e.g., 12/25)
**CVC:** Any 3 digits (e.g., 123)
**ZIP:** Any 5 digits (e.g., 12345)

### Test Connect Accounts

When testing scooper onboarding in test mode:

1. Use test data for all fields
2. Use test SSN: 000-00-0000
3. Use test bank account: Routing 110000000, Account 000123456789

---

## Monitoring Commands

### Daily Health Check
```bash
rails stripe:monitor:health
```

### Check Recent Errors
```bash
rails stripe:monitor:errors
```

### Validate Scoopers
```bash
rails stripe:monitor:validate_scoopers
```

### Check Subscription Integrity
```bash
rails stripe:monitor:check_cancelled_subscriptions
```

---

## Support & Resources

- **Stripe Documentation:** https://stripe.com/docs
- **Connect Documentation:** https://stripe.com/docs/connect
- **Stripe Status Page:** https://status.stripe.com/
- **Support:** https://support.stripe.com/

---

## Emergency Contacts

If you encounter critical Stripe issues:

1. **Stripe Support:** support@stripe.com (reply within hours)
2. **Phone:** Available in Dashboard for verified businesses
3. **Status Updates:** https://status.stripe.com/

For payment discrepancies:
1. Check Stripe Dashboard logs
2. Run `rails stripe:monitor:check_cancelled_subscriptions`
3. Contact support with request IDs from logs

---

**Remember:** Stripe is handling real money for your Scoop LLC. Treat credentials with extreme care and monitor operations daily.
