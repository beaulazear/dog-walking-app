# Scoop Project - Continuation Prompt for Claude

**Use this prompt when starting a new Claude chat to continue development**

---

## Project Context

I'm building **Scoop**, a hyperlocal marketplace mobile app where dog walkers (Scoopers) get paid by residents to clean dog waste from city blocks. This shares a backend with my existing app **Pocket Walks** (a dog walking business management app).

### What's Already Built

The **backend is 100% complete and deployed** to Render. Here's what exists:

#### ✅ Database (PostgreSQL on Render)
- **6 new Scoop tables**: blocks, coverage_regions, pledges, cleanups, poop_reports, scooper_milestones
- **Extended existing tables**: users (added `is_scooper`, Scoop stats), clients (added pledge references)
- **All migrations run successfully** on production
- **Uses regular lat/lng** instead of PostGIS (decision made due to deployment issues)

#### ✅ API (Rails 7.2, deployed to Render)
- **40+ RESTful endpoints** across 8 controllers:
  - `BlocksController` - CRUD, nearby search, stats
  - `CoverageRegionsController` - Scoopers claim blocks
  - `PledgesController` - Residents pledge money
  - `CleanupsController` - GPS-verified cleanup logging
  - `PoopReportsController` - Resident poop reports
  - `ScooperMilestonesController` - Achievement tracking
  - `StripeConnectController` - Payment onboarding (test mode)
  - `StripeWebhooksController` - Payment event handling

#### ✅ Business Logic (Fully Implemented)
- **Competitive pledge mechanics**: Multiple scoopers compete for blocks, first to reach funding wins
- **Automatic block activation**: When pledges reach monthly rate threshold
- **90-day warning system**: Churn prevention when funding drops
- **Automatic stat tracking**: Cleanups update block stats, scooper stats, check for milestones
- **Milestone achievements**: Auto-created at pickup/streak thresholds
- **GPS verification**: Cleanup locations validated
- **Photo uploads**: Active Storage + S3 (lifecycle policies not yet configured)

#### ✅ Authentication & Security
- **JWT authentication** shared with Pocket Walks
- **Role-based authorization**: scooper-only and client-only endpoints
- **API-only Rails app**: No CSRF, uses JWT tokens

#### ✅ Deployment Status
- **Render URL**: Check user's Render dashboard
- **All migrations completed**
- **Zero impact on existing Pocket Walks app** (verified)
- **Stripe configured** in test mode (Connect not yet enabled)

---

## Project Structure

```
dog-walking-app/
├── app/
│   ├── controllers/
│   │   ├── blocks_controller.rb          # Scoop
│   │   ├── coverage_regions_controller.rb # Scoop
│   │   ├── pledges_controller.rb          # Scoop
│   │   ├── cleanups_controller.rb         # Scoop
│   │   ├── poop_reports_controller.rb     # Scoop
│   │   ├── scooper_milestones_controller.rb # Scoop
│   │   ├── stripe_connect_controller.rb   # Scoop
│   │   ├── stripe_webhooks_controller.rb  # Scoop
│   │   └── [existing Pocket Walks controllers...]
│   ├── models/
│   │   ├── block.rb                      # Scoop
│   │   ├── coverage_region.rb            # Scoop
│   │   ├── pledge.rb                     # Scoop (has Stripe methods)
│   │   ├── cleanup.rb                    # Scoop
│   │   ├── poop_report.rb                # Scoop
│   │   ├── scooper_milestone.rb          # Scoop
│   │   ├── user.rb                       # Extended for Scoop
│   │   ├── client.rb                     # Extended for Scoop
│   │   └── [existing Pocket Walks models...]
│   └── ...
├── config/
│   ├── routes.rb                         # Scoop routes added (lines 138-186)
│   ├── database.yml                      # Standard PostgreSQL adapter
│   ├── initializers/stripe.rb            # Stripe configuration
│   └── ...
├── db/
│   ├── migrate/
│   │   ├── 20260215002833_enable_postgis.rb           # Skipped in production
│   │   ├── 20260215003047_create_blocks.rb            # No geometry columns
│   │   ├── 20260215003108_create_coverage_regions.rb
│   │   ├── 20260215003124_create_pledges.rb
│   │   ├── 20260215003142_create_cleanups.rb          # No geometry columns
│   │   ├── 20260215003201_create_poop_reports.rb      # No geometry columns
│   │   ├── 20260215003218_create_scooper_milestones.rb
│   │   ├── 20260215003236_add_scoop_fields_to_users_and_clients.rb
│   │   └── 20260215014013_add_stripe_customer_id_to_clients.rb
│   └── schema.rb                         # All tables defined
├── docs/
│   ├── CURRENT_STATUS.md                 # ⭐ READ THIS FIRST - Complete status
│   ├── NEXT_STEPS.md                     # ⭐ Priority TODO list
│   ├── SCOOP_BACKEND_SUMMARY.md          # Full API documentation
│   ├── SCOOP_STRIPE_CONNECT_SETUP.md     # How to enable payments
│   └── SCOOP_S3_LIFECYCLE_SETUP.md       # Photo auto-deletion setup
├── SCOOP_SAFETY_VERIFICATION.md          # Proof Pocket Walks unaffected
├── TEMPORARY_STRIPE_CONFIG.md            # What works without Connect
├── DEPLOYMENT_SUCCESS.md                 # Deployment guide
└── .env                                  # FRONTEND_URL configured
```

---

## Key Technical Decisions & Constraints

### 1. **No PostGIS Geometry Columns**
   - **Decision**: Use regular `latitude`/`longitude` decimal fields instead
   - **Why**: Deployment issues with PostGIS configuration on Render
   - **Impact**: Nearby queries use simple bounding box math (works great for MVP!)
   - **Implementation**:
     ```ruby
     # In Block.nearby(lat, lng, radius)
     lat_offset = radius / 111320.0
     lng_offset = radius / (111320.0 * Math.cos(lat * Math::PI / 180))

     Block.where(
       latitude: (lat - lat_offset)..(lat + lat_offset),
       longitude: (lng - lng_offset)..(lng + lng_offset)
     )
     ```

### 2. **Stripe Connect Temporarily Optional**
   - **Status**: Test mode keys configured, Connect Client ID NOT added yet
   - **Impact**: All pledge business logic works, but doesn't create actual Stripe subscriptions
   - **Location**: Credentials configured in `config/credentials.yml.enc`
   - **To Enable**: See `docs/SCOOP_STRIPE_CONNECT_SETUP.md`

### 3. **Shared Database with Pocket Walks**
   - **Users table**: Extended with `is_scooper` boolean and Scoop stats
   - **Clients table**: Extended with `current_block_id`, `current_pledge_id`, `stripe_customer_id`
   - **Authentication**: Same JWT system, same User model
   - **Safety**: Verified zero impact on existing Pocket Walks functionality

### 4. **API-Only Rails App**
   - **No CSRF protection** (API mode)
   - **JWT tokens** for authentication
   - **Don't use**: `skip_before_action :verify_authenticity_token` (doesn't exist in API mode)

---

## Current Status Summary

### ✅ **COMPLETE & WORKING**
- All database tables and migrations
- All API controllers and routes
- Competitive pledge mechanics
- Automatic stat tracking
- Milestone achievements
- GPS-verified cleanups
- Photo uploads (S3)
- Deployment to Render
- Pocket Walks safety verified

### ⚠️ **NEEDS CONFIGURATION** (Optional for Testing)
- Stripe Connect Client ID (for real payments)
- S3 lifecycle policy (for auto-deleting photos after 14 days)
- NYC block data import (can use test data for now)

### 🚧 **IN PROGRESS** (Your Focus)
- Frontend development (React Native + Expo)
- Testing with real data
- User experience refinement

---

## What to Work On Next

Read `docs/NEXT_STEPS.md` for the complete prioritized task list. Quick summary:

### Immediate Priorities:

1. **Test Deployed API** (5 mins)
   - Verify endpoints work
   - Test authentication
   - Confirm Pocket Walks unaffected

2. **Create Test Data** (1 hour)
   - Create 5-10 test blocks
   - Make users scoopers
   - Create test coverage regions
   - Test pledge creation

3. **Continue Frontend Development** (ongoing)
   - Connect to Render API
   - Build map view
   - Implement claim flow
   - Test cleanup logging

### Future Tasks:

4. **Enable Stripe Connect** (when ready for payments)
5. **Configure S3 Lifecycle** (when ready for photo deletion)
6. **Import NYC Block Data** (optional, can use test data)
7. **Production Readiness** (error monitoring, analytics, etc.)

---

## Important Files to Reference

### Documentation (START HERE):
- **`docs/CURRENT_STATUS.md`** - Complete overview of what's built
- **`docs/NEXT_STEPS.md`** - Prioritized TODO list
- **`docs/SCOOP_BACKEND_SUMMARY.md`** - Full API documentation

### Models with Complex Logic:
- **`app/models/block.rb`** - Block activation, warning state, nearby queries
- **`app/models/pledge.rb`** - Competitive mechanics, Stripe integration
- **`app/models/cleanup.rb`** - Stat tracking, milestone detection
- **`app/models/coverage_region.rb`** - Fully funded checks

### Controllers:
- All in `app/controllers/*_controller.rb`
- Look at serialization methods in each controller
- Authorization patterns: `before_action :require_scooper` or `:require_client`

---

## Common Tasks & How to Do Them

### Create Test Blocks
```ruby
# Via Rails console on Render or locally
Block.create!(
  block_id: "TEST001",
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
```

### Make User a Scooper
```ruby
user = User.find_by(email: "user@example.com")
user.update!(is_scooper: true)
```

### Test API Endpoint
```bash
# Get Render URL from dashboard
curl https://your-app.onrender.com/blocks

# Test authenticated endpoint
curl https://your-app.onrender.com/coverage_regions \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Add Stripe Connect Client ID
```bash
# When ready for payments
rails credentials:edit

# Add under stripe:
stripe:
  publishable_key: pk_test_...
  secret_key: sk_test_...
  connect_client_id: ca_XXXXXX  # <-- Add this
  webhook_secret: whsec_XXXXX   # <-- And this
```

---

## Example API Calls for Frontend

### Find Nearby Blocks
```javascript
const response = await fetch(
  `${API_URL}/blocks/nearby?latitude=40.7589&longitude=-73.9851&radius=1000`,
  { headers: { 'Authorization': `Bearer ${token}` }}
);
const { blocks } = await response.json();
```

### Scooper Claims Block
```javascript
const response = await fetch(`${API_URL}/coverage_regions`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    block_id: blockId,
    coverage_region: {
      monthly_rate: 50.00,
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true
    }
  })
});
```

### Resident Creates Pledge
```javascript
const response = await fetch(`${API_URL}/pledges`, {
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
```

### Log Cleanup with Photo
```javascript
const formData = new FormData();
formData.append('cleanup[latitude]', latitude);
formData.append('cleanup[longitude]', longitude);
formData.append('cleanup[pickup_count]', pickupCount);
formData.append('cleanup[photo]', {
  uri: photoUri,
  type: 'image/jpeg',
  name: 'cleanup.jpg'
});

const response = await fetch(`${API_URL}/cleanups?block_id=${blockId}`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData
});
```

---

## Common Issues & Solutions

### Issue: "undefined method `geometry`"
**Cause**: Trying to use PostGIS geometry columns
**Solution**: We're NOT using PostGIS. Use `latitude`/`longitude` decimal fields instead.

### Issue: Stripe API errors
**Cause**: Connect Client ID not configured
**Solution**: This is expected! Stripe Connect is optional for testing. Enable when ready: `docs/SCOOP_STRIPE_CONNECT_SETUP.md`

### Issue: Can't find nearby blocks
**Cause**: No test blocks created yet
**Solution**: Create test blocks via Rails console or API (see above)

### Issue: User can't create pledges
**Cause**: User doesn't have a Client profile
**Solution**: Ensure user has an associated Client record

### Issue: Photos not auto-deleting
**Cause**: S3 lifecycle policy not configured
**Solution**: See `docs/SCOOP_S3_LIFECYCLE_SETUP.md` (optional for now)

---

## Questions to Ask Me

If you need context, ask me:

1. **"What's the Render URL for the deployed API?"**
2. **"Do we have any test blocks created yet?"**
3. **"What user accounts exist that I can test with?"**
4. **"Is Stripe Connect enabled yet?"**
5. **"What specific feature should I work on next?"**
6. **"Are there any bugs or issues with the current deployment?"**

---

## Your Task

Please help me continue building Scoop. I've given you the complete context above.

**First**: Read `docs/CURRENT_STATUS.md` to understand what's built.

**Then**: Ask me what I'd like to work on, or review `docs/NEXT_STEPS.md` and suggest what to tackle next based on priority.

**Remember**:
- The backend is 100% deployed and working
- No PostGIS (using lat/lng instead)
- Stripe Connect is optional for testing
- Pocket Walks is completely unaffected
- Focus on creating test data and building frontend features

Let's continue building! 🚀
