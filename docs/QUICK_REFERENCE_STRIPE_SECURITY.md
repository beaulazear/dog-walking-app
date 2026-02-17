# Quick Reference: Stripe Security Implementation

**Status:** ✅ Production Ready (pending frontend implementation)
**Last Updated:** 2026-02-15

---

## 🚀 Quick Start

### 1. Run Database Migrations
```bash
rails db:migrate
```

This will create:
- Payment method fields on pledges
- Unique indexes to prevent race conditions
- WebhookEvent table for idempotency

### 2. Frontend Payment Collection (REQUIRED)

```javascript
// Collect payment method BEFORE creating pledge
const { paymentMethod } = await stripe.createPaymentMethod({
  type: 'card',
  card: cardElement,
});

// Send to backend
const response = await fetch('/pledges', {
  method: 'POST',
  body: JSON.stringify({
    coverage_region_id: coverageRegionId,
    pledge: {
      amount: 15.00,
      payment_method_id: paymentMethod.id  // REQUIRED!
    }
  })
});

// Handle 3D Secure if needed
if (response.requires_action) {
  await stripe.confirmCardPayment(response.client_secret);
}
```

### 3. Deploy to Production
```bash
# 1. Backup database
# 2. Deploy code
# 3. Run migrations
# 4. Test with real payment method
```

---

## 🔒 Security Features Implemented

| Feature | Status | Location |
|---------|--------|----------|
| Payment Method Collection | ✅ | `app/models/pledge.rb:63-128` |
| Stripe Connect Validation | ✅ | `app/models/pledge.rb:185-217` |
| Race Condition Prevention | ✅ | `app/models/pledge.rb:141-165` |
| Webhook Idempotency | ✅ | `app/controllers/stripe_webhooks_controller.rb:4-31` |
| GPS Validation | ✅ | `app/controllers/cleanups_controller.rb:240-245` |
| Database Constraints | ✅ | `db/migrate/*_add_unique_indexes_*.rb` |

---

## 📋 Pre-Launch Checklist

### Backend (Completed ✅)
- [x] Payment method collection implemented
- [x] Stripe Connect validation added
- [x] Race conditions fixed
- [x] Webhook idempotency added
- [x] GPS validation implemented
- [x] Database migrations created

### Frontend (TODO ⏳)
- [ ] Install `@stripe/stripe-js` and `@stripe/react-stripe-js`
- [ ] Implement CardElement for payment collection
- [ ] Send payment_method_id with pledge creation
- [ ] Handle 3D Secure authentication
- [ ] Test on iOS and Android

### Production Config (TODO ⏳)
- [ ] Add live Stripe keys to credentials
- [ ] Enable Stripe Connect in Dashboard
- [ ] Configure webhook endpoint
- [ ] Test end-to-end with real card
- [ ] Set up monitoring/alerts

---

## 🧪 Testing

### Test Payment Method Collection
```bash
# Use test card that requires 3DS
# Card: 4000 0027 6000 3184
# Expected: requires_action = true, client_secret returned
```

### Test Race Condition Fix
```bash
# Create 2 pledges simultaneously
# Expected: Only one block activation
```

### Test Duplicate Cleanup Prevention
```bash
# Try to log 2 cleanups for same block/day
# Expected: Second fails with RecordNotUnique
```

### Test Webhook Idempotency
```bash
stripe listen --forward-to localhost:3000/stripe/webhook
stripe trigger customer.subscription.created
# Send event twice
# Expected: Second returns "already_processed"
```

---

## 🚨 Critical Endpoints

### Payment Flow
```
POST /pledges
  ↓
  Requires: payment_method_id
  ↓
  Creates: Stripe Subscription
  ↓
  Returns: { requires_action, client_secret }
```

### Stripe Connect
```
POST /stripe_connect/onboard
  ↓
  Validates: is_scooper = true
  ↓
  Creates: Express Account
  ↓
  Returns: Onboarding URL
```

### Webhooks
```
POST /stripe/webhook
  ↓
  Verifies: Signature
  ↓
  Checks: Idempotency
  ↓
  Processes: Event
```

---

## 📊 Key Models & Methods

### Pledge
- `activate_stripe_subscription!(payment_method_id)` - Creates subscription
- `validate_scooper_stripe_account!` - Validates Connect account
- `check_block_funding` - Handles block activation (with locks)

### Block
- `activate!(scooper, monthly_rate)` - Activates block for winner
- Uses `lock!` to prevent race conditions

### WebhookEvent
- Stores all processed webhooks
- Prevents duplicate processing
- Provides audit trail

---

## 🔍 Monitoring Queries

### Check for stuck pledges
```ruby
Pledge.where(status: 'pending', created_at: ..2.days.ago)
```

### Check webhook health
```ruby
WebhookEvent.where('created_at > ?', 24.hours.ago).count
```

### Check payment success rate
```ruby
Pledge.where(status: 'active')
      .where('created_at > ?', 7.days.ago).count
```

---

## 📚 Documentation

- **[Full Stripe Integration Guide](./STRIPE_SECURITY_AND_INTEGRATION.md)** - Complete documentation
- **[Security Fixes Applied](./SECURITY_FIXES_APPLIED.md)** - Detailed changelog
- **[Stripe Testing Guide](https://stripe.com/docs/testing)** - Test cards and scenarios

---

## 🆘 Troubleshooting

| Error | Cause | Fix |
|-------|-------|-----|
| "payment_method_id is required" | Frontend not sending payment method | Add payment collection |
| "Scooper must complete onboarding" | Connect account not ready | Complete Stripe Connect |
| "Already logged cleanup today" | Duplicate cleanup attempt | This is working correctly! |
| "No such payment method" | Test/live mode mismatch | Check API keys match |

---

## 📞 Support

- **Stripe Issues:** https://support.stripe.com
- **Race Conditions:** Check database locks and transaction logs
- **Payment Failures:** Review Stripe Dashboard → Failed Payments

---

**Ready to launch? Complete the frontend implementation and test thoroughly!**
