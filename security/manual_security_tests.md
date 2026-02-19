# Manual Security Testing Guide

**Prerequisites:** Rails server running (`rails server`)

---

## 1. SQL Injection Protection

**Test:** Malicious input should be rejected
```bash
curl "http://localhost:3000/poop_reports/nearby?latitude=40.7');DROP%20TABLE%20blocks;--&longitude=74.0"
```

**Expected:** 400/401/422 (NOT 500), tables intact
**Status:** ✅ PASS / ❌ FAIL

---

## 2. Stripe Subscription Cancellation

**Test:** Subscription cancelled in Stripe when pledge deleted

```bash
# 1. Login
curl -X POST http://localhost:3000/client/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# 2. Delete pledge (use token from login)
curl -X DELETE http://localhost:3000/pledges/{PLEDGE_ID} \
  -H "Authorization: Bearer {TOKEN}"
```

**Expected:** Stripe Dashboard shows subscription "Cancelled"
**Status:** ✅ PASS / ❌ FAIL

---

## 3. Unauthorized Pledge Access

**Test:** Users can't enumerate other people's pledges

```bash
# Without authentication
curl http://localhost:3000/pledges

# With invalid client_id
curl http://localhost:3000/pledges?client_id=999
```

**Expected:** 401 or 403 Forbidden
**Status:** ✅ PASS / ❌ FAIL

---

## 4. GPS Boundary Validation

**Test:** Fake GPS coordinates rejected

```bash
# Login first, then:
curl -X POST http://localhost:3000/cleanups \
  -H "Authorization: Bearer {TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "block_id": 1,
    "cleanup": {
      "latitude": 0.0,
      "longitude": 0.0,
      "pickup_count": 5
    }
  }'
```

**Expected:** 422 "GPS coordinates are not within the block boundary"
**Status:** ✅ PASS / ❌ FAIL

---

## 5. Pledge Amount Modification

**Test:** Can't change amount on active subscriptions

```bash
# Update pledge with active subscription
curl -X PATCH http://localhost:3000/pledges/{ACTIVE_PLEDGE_ID} \
  -H "Authorization: Bearer {TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"pledge": {"amount": 99.99}}'
```

**Expected:** 422 "Cannot change pledge amount for active subscriptions"
**Status:** ✅ PASS / ❌ FAIL

---

## 6. JWT Token Type Confusion

**Test:** Client tokens rejected on user endpoints

```bash
# 1. Get client token
curl -X POST http://localhost:3000/client/login \
  -H "Content-Type: application/json" \
  -d '{"email":"client@example.com","password":"password123"}'

# 2. Try using client token on user endpoint
curl http://localhost:3000/me \
  -H "Authorization: Bearer {CLIENT_TOKEN}"
```

**Expected:** 401 Unauthorized
**Status:** ✅ PASS / ❌ FAIL

---

## 7. User Enumeration

**Test:** Can't list all users

```bash
curl http://localhost:3000/users
```

**Expected:** 403 "This endpoint is no longer available"
**Status:** ✅ PASS / ❌ FAIL

---

## 8. File Upload Validation

**Test:** Malicious files rejected

```bash
# Create test file
echo "malicious script" > test.exe

# Try uploading
curl -X POST http://localhost:3000/cleanups \
  -H "Authorization: Bearer {TOKEN}" \
  -F "block_id=1" \
  -F "cleanup[latitude]=40.7" \
  -F "cleanup[longitude]=-74.0" \
  -F "cleanup[pickup_count]=5" \
  -F "photo=@test.exe"
```

**Expected:** 422 "Invalid file type"
**Status:** ✅ PASS / ❌ FAIL

**Test:** Oversized files rejected

```bash
# Create 11MB file
dd if=/dev/zero of=large.jpg bs=1m count=11

# Try uploading
curl -X POST http://localhost:3000/cleanups \
  -H "Authorization: Bearer {TOKEN}" \
  -F "block_id=1" \
  -F "cleanup[latitude]=40.7" \
  -F "cleanup[longitude]=-74.0" \
  -F "cleanup[pickup_count]=5" \
  -F "photo=@large.jpg"
```

**Expected:** 422 "File too large"
**Status:** ✅ PASS / ❌ FAIL

---

## 9. Rate Limiting

**Test:** Excessive requests blocked

```bash
# Make 6 login attempts rapidly
for i in {1..6}; do
  echo "Request $i"
  curl -X POST http://localhost:3000/login \
    -H "Content-Type: application/json" \
    -d '{"username":"test","password":"wrong"}'
done
```

**Expected:** Request 6 returns 429 with "Rate limit exceeded"
**Status:** ✅ PASS / ❌ FAIL

---

## 10. Webhook Signature Validation

**Test:** Invalid webhook signatures rejected

```bash
curl -X POST http://localhost:3000/stripe/webhooks \
  -H "Content-Type: application/json" \
  -H "Stripe-Signature: invalid_signature" \
  -d '{"type":"customer.created"}'
```

**Expected:** 400 "Webhook signature verification failed"
**Status:** ✅ PASS / ❌ FAIL

---

## Quick Test All

Run automated suite:
```bash
ruby security/security_test.rb
```

Run health check:
```bash
rails stripe:monitor:health
```

---

## Testing Tips

**Getting Auth Tokens:**
```bash
# User token
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{"username":"youruser","password":"yourpass"}' \
  | jq -r '.token'

# Client token
curl -X POST http://localhost:3000/client/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"yourpass"}' \
  | jq -r '.token'
```

**Monitoring Logs:**
```bash
# Watch all activity
tail -f log/development.log

# Filter security events
tail -f log/development.log | grep -E "Stripe|Rack::Attack|Security"

# Check critical errors
tail -f log/stripe_critical_errors.log
```

**Cleanup:**
```bash
rm test.exe large.jpg  # Remove test files
```

---

## Test Results Template

Copy and fill out:

```
Security Test Results - [DATE]

1. SQL Injection:          ✅ / ❌
2. Stripe Cancellation:    ✅ / ❌
3. Pledge Authorization:   ✅ / ❌
4. GPS Validation:         ✅ / ❌
5. Amount Modification:    ✅ / ❌
6. Token Type Confusion:   ✅ / ❌
7. User Enumeration:       ✅ / ❌
8. File Upload:            ✅ / ❌
9. Rate Limiting:          ✅ / ❌
10. Webhook Signature:     ✅ / ❌

Notes:
- [Any issues found]
- [Environment: development/staging/production]
- [Tester name]
```

---

**For automated tests, see:** [security_test.rb](security_test.rb)
