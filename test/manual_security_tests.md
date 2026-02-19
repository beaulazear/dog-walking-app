# Manual Security Testing Guide

This guide helps you manually test all security fixes implemented in the application.

## Prerequisites

1. Start the Rails server:
   ```bash
   rails server
   ```

2. Have `curl` or a tool like Postman/Insomnia ready

## Test 1: SQL Injection Protection

### Test SQL injection in poop reports endpoint

**Malicious Request:**
```bash
curl "http://localhost:3000/poop_reports/nearby?latitude=40.7');DROP%20TABLE%20blocks;--&longitude=74.0"
```

**Expected Result:**
- Should NOT return 500 Internal Server Error
- Should return 400, 401, or 422 with error message
- Database tables should remain intact

**Status:** ✅ PASS / ❌ FAIL

---

## Test 2: Stripe Subscription Cancellation

### Test that Stripe subscriptions are cancelled when pledges are deleted

**Setup:**
1. Create a test pledge with Stripe subscription (requires Stripe test mode)
2. Get the pledge ID and subscription ID from Stripe dashboard

**Test Request:**
```bash
# Login as client
curl -X POST http://localhost:3000/client/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Copy the token from response

# Delete pledge
curl -X DELETE http://localhost:3000/pledges/{PLEDGE_ID} \
  -H "Authorization: Bearer {YOUR_TOKEN}"
```

**Expected Result:**
- Check Stripe Dashboard (test mode)
- Subscription should be marked as "Cancelled"
- Database pledge status should be "cancelled"

**Status:** ✅ PASS / ❌ FAIL

---

## Test 3: Pledge Authorization

### Test unauthorized pledge enumeration

**Attempt 1: No authentication**
```bash
curl http://localhost:3000/pledges
```

**Expected Result:** 401 Unauthorized or 403 Forbidden

**Attempt 2: Client ID enumeration**
```bash
curl http://localhost:3000/pledges?client_id=1
```

**Expected Result:** 401 Unauthorized or 403 Forbidden

**Attempt 3: Block ID enumeration (without being active scooper)**
```bash
curl -H "Authorization: Bearer {NON_SCOOPER_TOKEN}" \
  http://localhost:3000/pledges?block_id=1
```

**Expected Result:** 403 Forbidden (unauthorized for that block)

**Status:** ✅ PASS / ❌ FAIL

---

## Test 4: GPS Boundary Validation

### Test cleanup creation with invalid GPS coordinates

**Setup:**
1. Login as a scooper who has an active block
2. Get a valid block ID

**Test Request:**
```bash
curl -X POST http://localhost:3000/cleanups \
  -H "Authorization: Bearer {SCOOPER_TOKEN}" \
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

**Expected Result:**
- 422 Unprocessable Entity
- Error message: "GPS coordinates are not within the block boundary"

**Status:** ✅ PASS / ❌ FAIL

---

## Test 5: Pledge Amount Modification Protection

### Test changing pledge amount after activation

**Setup:**
1. Create an active pledge with Stripe subscription
2. Note the current amount

**Test Request:**
```bash
curl -X PATCH http://localhost:3000/pledges/{PLEDGE_ID} \
  -H "Authorization: Bearer {CLIENT_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "pledge": {
      "amount": 5.00
    }
  }'
```

**Expected Result:**
- 422 Unprocessable Entity
- Error message about not being able to change active pledge amounts
- Stripe subscription amount remains unchanged

**Status:** ✅ PASS / ❌ FAIL

---

## Test 6: JWT Token Type Validation

### Test using client token on user endpoints

**Setup:**
1. Login as a client and get their token

**Test Request:**
```bash
curl -H "Authorization: Bearer {CLIENT_TOKEN}" \
  http://localhost:3000/me
```

**Expected Result:**
- 401 Unauthorized
- Client tokens should not work on user endpoints

**Status:** ✅ PASS / ❌ FAIL

---

## Test 7: User Enumeration Protection

### Test that user list endpoint is disabled

**Test Request:**
```bash
curl http://localhost:3000/users
```

**Expected Result:**
- 403 Forbidden
- Error message directing to use search endpoint

**Status:** ✅ PASS / ❌ FAIL

---

## Test 8: File Upload Validation

### Test uploading malicious files

**Test 1: Executable file**
```bash
# Create a fake executable
echo "malicious code" > malware.exe

# Attempt upload
curl -X POST http://localhost:3000/cleanups \
  -H "Authorization: Bearer {SCOOPER_TOKEN}" \
  -F "block_id=1" \
  -F "cleanup[latitude]=40.7" \
  -F "cleanup[longitude]=74.0" \
  -F "cleanup[pickup_count]=5" \
  -F "cleanup[photo]=@malware.exe"
```

**Expected Result:** 422 with error about invalid file type

**Test 2: Oversized file**
```bash
# Create a large file (>10MB)
dd if=/dev/zero of=large_file.jpg bs=1M count=11

# Attempt upload
curl -X POST http://localhost:3000/cleanups \
  -H "Authorization: Bearer {SCOOPER_TOKEN}" \
  -F "block_id=1" \
  -F "cleanup[latitude]=40.7" \
  -F "cleanup[longitude]=74.0" \
  -F "cleanup[pickup_count]=5" \
  -F "cleanup[photo]=@large_file.jpg"
```

**Expected Result:** 422 with error about file size

**Status:** ✅ PASS / ❌ FAIL

---

## Test 9: Rate Limiting

### Test rate limits are enforced

**Test Login Rate Limit:**
```bash
# Attempt 6 login requests in rapid succession (limit is 5/hour)
for i in {1..6}; do
  echo "Attempt $i"
  curl -X POST http://localhost:3000/login \
    -H "Content-Type: application/json" \
    -d '{"username":"test","password":"wrong"}'
  echo
done
```

**Expected Result:**
- First 5 requests: Normal responses (401 Unauthorized)
- 6th request: 429 Too Many Requests with rate limit headers

**Test Cleanup Rate Limit:**
```bash
# Make 51 cleanup requests in a day (limit is 50)
# This would need to be done over time or with a test script
```

**Status:** ✅ PASS / ❌ FAIL

---

## Test 10: Mass Assignment Protection

### Test user signup with malicious rates

**Test Request:**
```bash
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{
    "username": "hacker",
    "password": "password123",
    "password_confirmation": "password123",
    "name": "Test Hacker",
    "email_address": "hacker@test.com",
    "thirty": 999999,
    "fortyfive": 999999,
    "sixty": 999999
  }'
```

**Expected Result:**
- User created successfully
- Rates are set to DEFAULT values (30, 40, 50), NOT the provided values (999999)

**Verification:**
```bash
# Login and check rates
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{"username":"hacker","password":"password123"}'

# Use returned token to check user
curl -H "Authorization: Bearer {TOKEN}" \
  http://localhost:3000/me
```

**Check:** Rates should be default values, not 999999

**Status:** ✅ PASS / ❌ FAIL

---

## Security Monitoring Checklist

After deploying, monitor these metrics:

- [ ] Check Rails logs for Rack::Attack warnings
- [ ] Monitor Stripe dashboard for failed subscription cancellations
- [ ] Check error tracking service for 429 rate limit errors
- [ ] Review authentication failures (could indicate brute force)
- [ ] Monitor file upload sizes and types
- [ ] Check for unusual GPS coordinate patterns in cleanups

---

## Quick Test Commands

**Test all endpoints are up:**
```bash
curl http://localhost:3000/health  # Add a health endpoint
```

**Check rate limit headers:**
```bash
curl -v http://localhost:3000/ | grep -i ratelimit
```

**Monitor logs for security events:**
```bash
tail -f log/development.log | grep -i "rack::attack\|security\|unauthorized"
```

---

## Troubleshooting

### Rate limiting not working
- Check `config/initializers/rack_attack.rb` exists
- Verify `config/application.rb` has `config.middleware.use Rack::Attack`
- Restart Rails server after changes

### GPS validation failing in development
- `within_block_boundary?` returns true in development mode
- Test in production/staging with PostGIS enabled

### File upload validation not working
- Check content_type is being sent correctly
- Verify ActiveStorage is configured
- Check S3 credentials if using S3

---

## Next Steps

1. Run automated security test suite: `ruby test/security_test.rb`
2. Complete all manual tests above
3. Set up continuous security monitoring
4. Schedule regular security audits
5. Review and update rate limits based on usage patterns
