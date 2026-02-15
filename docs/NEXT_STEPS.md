# Scoop - Next Steps & TODO List

**Priority ordered tasks to complete the MVP**

---

## 🎯 Phase 1: Testing & Verification (30 mins)

### ✅ Verify Deployment

**1. Test Basic Endpoints**
```bash
# Get your Render URL from dashboard (e.g., https://dog-walking-app.onrender.com)
export API_URL="https://your-app.onrender.com"

# Test blocks endpoint
curl $API_URL/blocks

# Should return: {"blocks":[],"meta":{...}}
```

**2. Test Pocket Walks Still Works**
```bash
# Verify existing app unaffected
curl $API_URL/appointments
curl $API_URL/pets
curl $API_URL/users

# All should work as before!
```

**3. Test Authentication**
```bash
# Login with existing user
curl -X POST $API_URL/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"yourpassword"}'

# Save the returned token
export TOKEN="eyJ..."

# Test authenticated endpoint
curl $API_URL/coverage_regions \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🛠️ Phase 2: Frontend Development (Current Focus)

### **You're working on this now!**

**Key Tasks:**
1. Update API base URL in React Native app
2. Implement map view with block markers
3. Build nearby blocks query
4. Create scooper claim flow
5. Implement cleanup logging with GPS + photo
6. Build poop report submission
7. Display milestones/achievements

**API Examples for Frontend:**

```javascript
// Find nearby blocks
const nearbyBlocks = await fetch(
  `${API_URL}/blocks/nearby?latitude=${lat}&longitude=${lng}&radius=1000`,
  { headers: { 'Authorization': `Bearer ${token}` }}
);

// Claim a block (scooper)
await fetch(`${API_URL}/coverage_regions`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    coverage_region: {
      block_id: blockId,
      monthly_rate: 50.00,
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true
    }
  })
});

// Create pledge (resident)
await fetch(`${API_URL}/pledges`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    coverage_region_id: coverageRegionId,
    pledge: {
      amount: 10.00,
      anonymous: true
    }
  })
});

// Log cleanup (scooper)
const formData = new FormData();
formData.append('cleanup[latitude]', latitude);
formData.append('cleanup[longitude]', longitude);
formData.append('cleanup[pickup_count]', pickupCount);
formData.append('cleanup[photo]', photoFile);

await fetch(`${API_URL}/cleanups?block_id=${blockId}`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData
});
```

---

## 📊 Phase 3: Create Test Data (1 hour)

### Option 1: Via Rails Console (Render Shell)

1. Go to Render Dashboard
2. Click on your service
3. Open "Shell" tab
4. Run:

```ruby
# Create test blocks
east_village = Block.create!(
  block_id: "EV_001",
  neighborhood: "East Village",
  borough: "Manhattan",
  status: "inactive",
  geojson: {
    type: "Polygon",
    coordinates: [[
      [-73.9851, 40.7589],
      [-73.9841, 40.7589],
      [-73.9841, 40.7579],
      [-73.9851, 40.7579],
      [-73.9851, 40.7589]
    ]]
  }
)

williamsburg = Block.create!(
  block_id: "WB_001",
  neighborhood: "Williamsburg",
  borough: "Brooklyn",
  status: "inactive",
  geojson: {
    type: "Polygon",
    coordinates: [[
      [-73.9571, 40.7081],
      [-73.9561, 40.7081],
      [-73.9561, 40.7071],
      [-73.9571, 40.7071],
      [-73.9571, 40.7081]
    ]]
  }
)

# Make existing user a scooper
user = User.first
user.update!(is_scooper: true)

# Test that it works
Block.count  # Should be 2
User.where(is_scooper: true).count  # Should be at least 1
```

### Option 2: Via API (with Postman or curl)

Use your frontend app to create data through the API endpoints!

---

## 💳 Phase 4: Enable Stripe Connect (Optional - When Ready for Payments)

**Current Status:** ⚠️ Test mode configured, Connect not enabled

### Steps to Enable:

**1. Go to Stripe Dashboard**
   - URL: https://dashboard.stripe.com/test/connect/accounts/overview
   - Click "Get started with Connect"
   - Choose "Platform or marketplace"

**2. Get Client ID**
   - After enabling, go to: https://dashboard.stripe.com/test/settings/connect
   - Copy your "Client ID" (starts with `ca_`)

**3. Update Rails Credentials**

```bash
# On your local machine
rails credentials:edit

# Add this line under stripe:
stripe:
  publishable_key: pk_test_...
  secret_key: sk_test_...
  connect_client_id: ca_XXXXXXXXXXXXXX  # <-- Add this!
  webhook_secret: whsec_XXXXXXXX        # <-- Add this later
```

**4. Set Environment Variable**

Already set in `.env` file:
```
FRONTEND_URL=http://localhost:19006
```

For production, update on Render:
- Render Dashboard → Your Service → Environment
- Add: `FRONTEND_URL=https://your-production-url.com`

**5. Configure Webhooks**

- Go to: https://dashboard.stripe.com/test/webhooks
- Click "Add endpoint"
- URL: `https://your-app.onrender.com/stripe/webhooks`
- Select events:
  - All subscription events
  - All invoice events
  - `account.updated`
- Copy the signing secret
- Add to credentials as `webhook_secret: whsec_...`

**6. Deploy & Test**

```bash
git add config/credentials.yml.enc
git commit -m "Add Stripe Connect credentials"
git push origin main
```

**7. Test Onboarding Flow**

- Login as scooper in mobile app
- Navigate to "Connect Stripe" screen
- Tap "Connect"
- API will return Stripe onboarding URL
- Complete Stripe Connect signup
- Return to app

**See:** `docs/SCOOP_STRIPE_CONNECT_SETUP.md` for detailed instructions

---

## 📸 Phase 5: Configure S3 Photo Auto-Deletion (30 mins)

**Current Status:** ✅ Photos upload to S3, ❌ Don't auto-delete after 14 days

### Steps:

**1. Log in to AWS Console**
   - Go to https://console.aws.amazon.com/s3/

**2. Navigate to Your Bucket**
   - Click on bucket: `beaubucketone`

**3. Create Lifecycle Rule**
   - Click "Management" tab
   - Click "Create lifecycle rule"
   - Rule name: `scoop-photos-auto-delete`
   - Scope: "Limit the scope" (optional - can apply to all)

**4. Configure Expiration**
   - Check: "Expire current versions of objects"
   - Days: **14** (or 7 if you want faster deletion)
   - Check: "Delete expired object delete markers"

**5. Save**
   - Review and create

**6. Verify**
   - Upload a test photo through the app
   - Check S3 object properties
   - Should show "Expiration date" 14 days from now

**See:** `docs/SCOOP_S3_LIFECYCLE_SETUP.md` for detailed instructions with screenshots

---

## 🗺️ Phase 6: Import NYC Block Data (Optional - Future)

**For production, you'll want real NYC block boundaries**

### Options:

**1. NYC Open Data API**
   - Source: https://data.cityofnewyork.us/
   - Dataset: "LION - Single Line Street Base Map"
   - Download GeoJSON
   - Import via Rails task

**2. Manual Creation** (For MVP)
   - Create blocks via API/console as needed
   - Start with just a few test blocks
   - Expand as users request coverage

**3. User-Generated** (Future Feature)
   - Allow scoopers to "propose" new blocks
   - Admin approval process
   - Gradual expansion

**For Now:** Create 5-10 test blocks manually to demo the app

---

## 🚨 Phase 7: Production Readiness (Before Public Launch)

### Required Before Going Live:

- [ ] **Form LLC** (Recommended for marketplace liability)
  - Cost: $50-$200 depending on state
  - Get EIN from IRS (free, 5 minutes)
  - Open business bank account

- [ ] **Switch Stripe to Live Mode**
  - Get live API keys
  - Update Rails credentials
  - Re-verify Connect onboarding
  - Test payment flow end-to-end

- [ ] **Set Up Error Monitoring**
  - Options: Sentry, Rollbar, Bugsnag
  - Track API errors
  - Monitor payment failures
  - Alert on critical issues

- [ ] **Configure Email Notifications**
  - SendGrid or Mailgun
  - Welcome emails
  - Payment receipts
  - Block activation notifications
  - Milestone achievements

- [ ] **Set Up Analytics**
  - Track user signups
  - Monitor pledge creation
  - Track cleanup frequency
  - Measure engagement

- [ ] **Review Terms of Service & Privacy Policy**
  - Mention photo auto-deletion (14 days)
  - Clarify platform fees (15%)
  - Address GDPR/CCPA compliance
  - Liability disclaimers

- [ ] **Final Testing**
  - End-to-end user journeys
  - Payment flow
  - Photo uploads
  - Edge cases
  - Load testing (optional)

---

## 📋 Optional Enhancements (Post-MVP)

### Features to Consider:

- **Push Notifications**
  - New poop reports in your area
  - Milestone achievements
  - Payment confirmations
  - Block activation alerts

- **Leaderboards**
  - Top scoopers by neighborhood
  - Most active blocks
  - Streak leaders

- **Reviews & Ratings**
  - Residents rate scoopers
  - Display average rating
  - Impact on pledge decisions

- **Referral Program**
  - Invite friends → earn credits
  - Scooper recruitment bonuses
  - Resident referral rewards

- **Advanced Statistics Dashboard**
  - Charts and graphs
  - Historical trends
  - Neighborhood comparisons
  - Impact metrics

- **Social Features**
  - Share milestone achievements
  - Block activity feed
  - Community updates

- **Block Reservation**
  - "Hold" a block while recruiting pledgers
  - Time-limited holds
  - Prevents sniping

---

## 🎯 Current Priorities (This Week)

1. **✅ Verify deployment** - Test all endpoints
2. **🚧 Build frontend** - Focus on core user flows
3. **📊 Create test data** - 5-10 blocks to demo
4. **🎨 Design UI** - Map view, dashboards, forms
5. **📸 Test photo uploads** - Cleanup and report submissions

---

## 📞 Need Help?

- **API Documentation**: `docs/SCOOP_BACKEND_SUMMARY.md`
- **Stripe Setup**: `docs/SCOOP_STRIPE_CONNECT_SETUP.md`
- **S3 Setup**: `docs/SCOOP_S3_LIFECYCLE_SETUP.md`
- **Current Status**: `docs/CURRENT_STATUS.md`
- **Safety Verification**: `SCOOP_SAFETY_VERIFICATION.md`

---

## ✅ Success Metrics to Track

**Week 1:**
- [ ] 5+ test blocks created
- [ ] 3+ test users (scoopers + residents)
- [ ] 5+ test cleanups logged
- [ ] Frontend map view working

**Week 2:**
- [ ] End-to-end pledge flow working
- [ ] Photo uploads tested
- [ ] Milestone achievements working
- [ ] Competitive pledge mechanics tested

**Week 3:**
- [ ] Stripe Connect enabled (optional)
- [ ] Full payment flow tested
- [ ] S3 lifecycle configured
- [ ] Ready for beta testing

**Week 4:**
- [ ] 5-10 beta testers recruited
- [ ] Feedback collected
- [ ] Bugs fixed
- [ ] Performance optimized

---

## 🚀 You're Ready!

The backend is deployed and rock-solid. Now focus on building a beautiful, intuitive mobile experience!

**Remember:** Start simple, iterate quickly, and ship early. You can always add features later!

Good luck! 🎉
