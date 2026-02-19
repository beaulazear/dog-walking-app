# Security Quick Start Guide

Get security features running in 5 minutes.

## 1. Install Dependencies (1 min)

```bash
bundle install
```

## 2. Configure Stripe (2 min)

```bash
EDITOR="code --wait" rails credentials:edit
```

Add your Stripe test keys from [dashboard.stripe.com/test/apikeys](https://dashboard.stripe.com/test/apikeys):

```yaml
stripe:
  publishable_key: <your test publishable key>
  secret_key: <your test secret key>
  connect_client_id: <your Connect client ID>
  webhook_secret: <from Step 3>
```

## 3. Set Up Webhooks (1 min)

```bash
# Install and login
brew install stripe/stripe-cli/stripe
stripe login

# Forward webhooks (keep running)
stripe listen --forward-to localhost:3000/stripe/webhooks
```

Copy the `whsec_...` secret and add it to credentials in Step 2.

## 4. Verify Setup (30 sec)

```bash
./bin/check_stripe_config
```

Should show all ✅. If errors, fix indicated issues.

## 5. Test Security (30 sec)

```bash
ruby security/security_test.rb
```

Should show: `✨ All critical security tests passed!`

## 6. Monitor Health

```bash
rails stripe:monitor:health
```

---

## Quick Reference

### Daily Commands
```bash
# Health check
rails stripe:monitor:health

# Check errors
rails stripe:monitor:errors

# Run security tests
ruby security/security_test.rb
```

### Development Setup
```bash
# Terminal 1: Rails server
rails server

# Terminal 2: Stripe webhooks
stripe listen --forward-to localhost:3000/stripe/webhooks
```

---

## Common Issues

**"Stripe webhook secret not configured"**
```bash
EDITOR="code --wait" rails credentials:edit
# Add webhook_secret under stripe section
```

**"Master key not found"**
```bash
rm config/credentials.yml.enc
EDITOR="code --wait" rails credentials:edit
# Re-add all keys
```

**Webhooks not arriving**
```bash
stripe listen --forward-to localhost:3000/stripe/webhooks
stripe trigger payment_intent.succeeded
```

---

## Pre-Production Checklist

- [ ] `bundle install` completed
- [ ] Stripe credentials configured (LIVE keys for production)
- [ ] `./bin/check_stripe_config` passes
- [ ] `ruby security/security_test.rb` passes
- [ ] Master key backed up securely
- [ ] SSL certificate installed (production only)

---

## Next Steps

1. **Full Setup**: Read [STRIPE_SECURITY_SETUP.md](STRIPE_SECURITY_SETUP.md)
2. **Security Details**: Read [SECURITY_FIXES_SUMMARY.md](SECURITY_FIXES_SUMMARY.md)
3. **Manual Tests**: Read [manual_security_tests.md](manual_security_tests.md)

**You're ready!** 🎉 Your app now has enterprise-grade security.
