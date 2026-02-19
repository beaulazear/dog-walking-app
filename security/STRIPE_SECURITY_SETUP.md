# Stripe Security Setup Guide

Complete Stripe configuration for Scoop marketplace.

---

## 1. Stripe Account Setup

### Create Account
1. Register at [dashboard.stripe.com/register](https://dashboard.stripe.com/register)
2. Complete business verification (required for Connect)
3. Enable **Stripe Connect**: Settings → Connect → Get started

### Get API Keys
- Navigate to: **Developers** → **API keys**
- You'll see test and live keys
- **NEVER commit keys to git!**

---

## 2. Configure Credentials

### Development (Test Mode)

```bash
EDITOR="code --wait" rails credentials:edit
```

Add test keys from [dashboard.stripe.com/test/apikeys](https://dashboard.stripe.com/test/apikeys):

```yaml
stripe:
  publishable_key: <from Stripe Dashboard - Publishable key>
  secret_key: <from Stripe Dashboard - Secret key>
  connect_client_id: <from Settings → Connect → Client ID>
  webhook_secret: <from Step 3 below>
```

### Production (Live Mode)

```bash
EDITOR="code --wait" rails credentials:edit --environment production
```

Add **LIVE** keys (same structure, use live keys from dashboard).

**⚠️ CRITICAL:**
- NEVER use live keys in development
- NEVER commit credentials files
- NEVER log API keys
- Back up `master.key` securely

---

## 3. Webhook Configuration

### Development (Stripe CLI)

```bash
# Install
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks (keep running)
stripe listen --forward-to localhost:3000/stripe/webhooks
```

Copy the `whsec_...` secret and add to credentials from Step 2.

### Production (Stripe Dashboard)

1. Go to **Developers** → **Webhooks** → **Add endpoint**
2. URL: `https://your-api-domain.com/stripe/webhooks`
3. Select events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
   - `invoice.payment_succeeded`
   - `account.updated`
4. Copy **Signing secret** → add to production credentials

**Test webhook:**
```bash
# From dashboard: click "Send test webhook"
# Verify in logs:
tail -f log/production.log | grep webhook
```

---

## 4. Stripe Connect Setup

### Enable Connect
1. **Settings** → **Connect** → **Get started**
2. Choose **Platform or marketplace**
3. Complete application

### Configure Platform Settings

**Branding:**
- Add Scoop logo
- Set brand color
- Add support email

**Platform Fee:**
- Set to **15%**
- Type: "Percentage of transaction"

**Payout Schedule:**
- Daily automatic payouts
- Minimum: $25

**Account Requirements:**
- ✅ Require business verification
- ✅ Collect beneficial owner information
- ✅ Require bank account for payouts

**Redirect URLs:**
- **Dev:** `http://localhost:3000/stripe_connect/callback`
- **Prod:** `https://your-api-domain.com/stripe_connect/callback`

**Get Connect Client ID:**
- Settings → Connect → Overview → Copy Client ID
- Add to credentials from Step 2

---

## 5. Verify Configuration

### Health Check
```bash
rails stripe:monitor:health
```

Expected output:
```
✅ Secret key: Configured (sk_test...)
✅ Publishable key: Configured (pk_test...)
✅ Connect client ID: Configured
✅ Webhook secret: Configured
```

### Test API Connection
```bash
rails console

# Test
Stripe::Account.retrieve
# Should return your account details
```

### Test Webhooks
```bash
# Terminal 1: Rails server
rails server

# Terminal 2: Stripe CLI
stripe listen --forward-to localhost:3000/stripe/webhooks

# Terminal 3: Trigger test event
stripe trigger payment_intent.succeeded
```

Check logs for: `Webhook payment_intent.succeeded processed successfully`

---

## 6. Production Deployment

### Pre-Deployment Checklist
- [ ] Production credentials with **LIVE** keys configured
- [ ] Webhook endpoint in Stripe Dashboard
- [ ] Webhook secret in production credentials
- [ ] SSL certificate installed
- [ ] Master key backed up
- [ ] Stripe Connect activated

### Deploy Credentials

**Heroku:**
```bash
heroku config:set RAILS_MASTER_KEY=<your_production_master_key>
```

**Render/Railway/Fly.io:**
Add `RAILS_MASTER_KEY` in dashboard environment variables.

**VPS:**
```bash
scp config/master.key user@server:/path/to/app/config/
```

### Post-Deployment Verification

```bash
# SSH to server
ssh user@server

# Test
rails console -e production
Stripe::Account.retrieve
Rails.application.credentials.dig(:stripe, :webhook_secret)
```

### Monitor
```bash
rails stripe:monitor:health
rails stripe:monitor:errors
rails stripe:monitor:check_cancelled_subscriptions
```

---

## 7. Security Checklist

### Credentials
- [ ] Master key NOT in git
- [ ] Production uses LIVE keys
- [ ] Development uses TEST keys
- [ ] Webhook secret configured
- [ ] API keys never logged
- [ ] Credentials backed up

### Webhooks
- [ ] Signature verification enabled
- [ ] HTTPS enforced
- [ ] Webhook secret rotated quarterly

### Connect
- [ ] Client ID kept secret
- [ ] OAuth URLs whitelisted
- [ ] Platform fee configured (15%)
- [ ] Payout schedule set

### Monitoring
- [ ] Error tracking configured (Sentry/Rollbar)
- [ ] Daily health checks scheduled
- [ ] Failed payment alerts enabled

---

## Testing

### Test Cards (Development)
- **Success:** 4242 4242 4242 4242
- **Declined:** 4000 0000 0000 0002
- **Insufficient funds:** 4000 0000 0000 9995
- **3D Secure:** 4000 0027 6000 3184

**Expiry:** Any future date (12/25)
**CVC:** Any 3 digits (123)
**ZIP:** Any 5 digits (12345)

### Test Connect Accounts
- SSN: 000-00-0000
- Bank routing: 110000000
- Account: 000123456789

---

## Monitoring Commands

```bash
# Daily health check
rails stripe:monitor:health

# Check errors
rails stripe:monitor:errors

# Validate scoopers
rails stripe:monitor:validate_scoopers

# Check subscription integrity
rails stripe:monitor:check_cancelled_subscriptions
```

---

## Common Issues

**"Stripe webhook secret not configured"**
```bash
EDITOR="vim" rails credentials:edit
# Add webhook_secret under stripe section
```

**Webhook signature verification failing**
- Wrong secret (test vs live mismatch)
- Request modified by proxy
- Timestamp too old

**Solution:** Get correct secret from dashboard, update credentials, restart.

**Connect account creation failing**
1. Check Connect client ID
2. Verify redirect URLs whitelisted
3. Complete business verification
4. Check dashboard for pending requirements

**"Subscription cancelled in DB but active in Stripe"**
```bash
rails stripe:monitor:check_cancelled_subscriptions
# Shows mismatches - cancel manually if needed
```

---

## Emergency Contacts

**Stripe Issues:**
- Dashboard: https://dashboard.stripe.com
- Status: https://status.stripe.com
- Support: support@stripe.com

**Payment Discrepancies:**
1. Check Stripe Dashboard logs
2. Run `rails stripe:monitor:check_cancelled_subscriptions`
3. Contact support with request IDs

---

## Related Documentation

- [Quick Start Guide](SECURITY_QUICK_START.md)
- [Security Fixes Summary](SECURITY_FIXES_SUMMARY.md)
- [Manual Tests](manual_security_tests.md)

---

**Stripe handles real money for Scoop LLC. Treat credentials with extreme care.** 💳🔒
