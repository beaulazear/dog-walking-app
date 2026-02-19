# Security Quick Start Guide

This guide helps you get started with the newly implemented security features in 5 minutes.

## Step 1: Install Dependencies (1 minute)

```bash
cd /Users/beaulazear/Desktop/dog-walking-app
bundle install
```

This will install:
- `rack-attack` for rate limiting
- All other dependencies

## Step 2: Configure Stripe Credentials (2 minutes)

### For Development (Test Mode)

```bash
# Open encrypted credentials
EDITOR="code --wait" rails credentials:edit
```

Add your Stripe test keys:

```yaml
stripe:
  publishable_key: pk_test_YOUR_KEY_HERE
  secret_key: sk_test_YOUR_KEY_HERE
  connect_client_id: ca_YOUR_ID_HERE
  webhook_secret: whsec_YOUR_SECRET_HERE
```

**Where to get these:**
1. Go to [https://dashboard.stripe.com/test/apikeys](https://dashboard.stripe.com/test/apikeys)
2. Copy your test keys
3. For webhook secret, see "Step 3" below

Save and close (Cmd+S, then close editor).

## Step 3: Set Up Webhooks (1 minute)

### Using Stripe CLI (Recommended for Development)

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login to Stripe
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/stripe/webhooks
```

The CLI will output a webhook signing secret (`whsec_...`). Copy it and add to credentials:

```bash
EDITOR="code --wait" rails credentials:edit
# Add the whsec_... value to webhook_secret
```

## Step 4: Verify Configuration (30 seconds)

```bash
./bin/check_stripe_config
```

You should see all green checkmarks ✅

If you see errors, review the output and fix the indicated issues.

## Step 5: Test Security Features (1 minute)

### Run Automated Tests

```bash
ruby test/security_test.rb
```

Expected output:
```
🔒 Security Testing Suite
============================================================
📋 SQL Injection Protection
  ✅ PASS: SQL injection blocked in poop reports
📋 Pledge Authorization
  ✅ PASS: Unauthenticated pledge access blocked
...
✨ All critical security tests passed!
```

### Manual Quick Test

```bash
# Start the server in one terminal
rails server

# In another terminal, test rate limiting
for i in {1..6}; do
  echo "Request $i"
  curl -X POST http://localhost:3000/login \
    -H "Content-Type: application/json" \
    -d '{"username":"test","password":"wrong"}'
done
```

Request 6 should return:
```json
{"error":"Rate limit exceeded. Please try again later.","retry_after":...}
```

## Step 6: Monitor Stripe Health

```bash
rails stripe:monitor:health
```

You should see:
```
✅ Secret key: Configured (sk_test...)
✅ Publishable key: Configured (pk_test...)
✅ Webhook secret: Configured
```

---

## Quick Reference Commands

### Security Testing
```bash
# Run automated security tests
ruby test/security_test.rb

# Check Stripe configuration
./bin/check_stripe_config

# Manual tests (see detailed guide)
cat test/manual_security_tests.md
```

### Stripe Monitoring
```bash
# Overall health check
rails stripe:monitor:health

# Check recent errors
rails stripe:monitor:errors

# Validate scooper accounts
rails stripe:monitor:validate_scoopers

# Check subscription integrity
rails stripe:monitor:check_cancelled_subscriptions
```

### Development Workflow
```bash
# Terminal 1: Rails server
rails server

# Terminal 2: Stripe webhook forwarding
stripe listen --forward-to localhost:3000/stripe/webhooks

# Terminal 3: Monitor logs
tail -f log/development.log | grep -E "Stripe|Rack::Attack|Security"
```

---

## Common Issues & Quick Fixes

### "Stripe webhook secret not configured"

```bash
EDITOR="code --wait" rails credentials:edit
# Add webhook_secret under stripe section
```

### "Master key not found"

The `config/master.key` file is missing. If you're the original developer, you should have it. If not, you'll need to:

```bash
# Remove old credentials
rm config/credentials.yml.enc

# Create new credentials
EDITOR="code --wait" rails credentials:edit
# Add all your keys again
```

### Rate limiting not working

```bash
# Restart the server after any changes to rack_attack.rb
rails server
```

### Webhooks not arriving

```bash
# Make sure Stripe CLI is running
stripe listen --forward-to localhost:3000/stripe/webhooks

# Test manually
stripe trigger payment_intent.succeeded
```

---

## Next Steps

1. **Read Full Documentation:**
   - `STRIPE_SECURITY_SETUP.md` - Complete Stripe configuration
   - `SECURITY_FIXES_SUMMARY.md` - All security improvements
   - `test/manual_security_tests.md` - Manual testing guide

2. **Set Up Production:**
   - Follow `STRIPE_SECURITY_SETUP.md` section 6
   - Use LIVE Stripe keys
   - Configure webhooks in Stripe Dashboard

3. **Enable Monitoring:**
   - Set up Sentry or Rollbar
   - Configure email alerts
   - Schedule daily health checks

4. **Test Thoroughly:**
   - Run manual security tests
   - Test subscription cancellation flow
   - Verify GPS boundary validation

---

## Security Checklist ✅

Before deploying to production:

- [ ] Bundle install completed
- [ ] Stripe credentials configured (LIVE keys for production)
- [ ] Webhook secret configured
- [ ] `./bin/check_stripe_config` passes all checks
- [ ] `ruby test/security_test.rb` passes all tests
- [ ] Tested subscription cancellation manually
- [ ] Verified rate limiting works
- [ ] GPS validation tested
- [ ] File upload validation tested
- [ ] Master key backed up securely
- [ ] Error monitoring service configured
- [ ] SSL certificate installed (production)

---

## Support

- **Stripe Setup:** See `STRIPE_SECURITY_SETUP.md`
- **Security Fixes:** See `SECURITY_FIXES_SUMMARY.md`
- **Manual Testing:** See `test/manual_security_tests.md`
- **Stripe Dashboard:** https://dashboard.stripe.com/

For issues, run diagnostics:
```bash
./bin/check_stripe_config
rails stripe:monitor:health
ruby test/security_test.rb
```

---

**You're all set!** 🎉

Your application now has enterprise-grade security for handling financial transactions through Stripe.
