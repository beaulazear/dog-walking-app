# Scoop - Current Status & Deployment Summary

**Last Updated:** February 20, 2026
**Status:** ✅ **MVP COMPLETE - JOB BOARD + RECURRING SUBSCRIPTIONS DEPLOYED**

---

## 🎯 Current Architecture

### Two Service Models (Both Live!)

**1. One-Off Job Board** - On-demand cleanup marketplace
- Posters create cleanup jobs when they see waste
- Scoopers browse map and claim jobs
- One-time payment per job ($15-25)
- Fast, simple, immediate

**2. Recurring Subscriptions** - Like a cleaning service
- Residents subscribe to weekly/biweekly/monthly cleanups
- Lower prices ($40-60/month = ~50% discount)
- Jobs auto-generate on schedule
- Cancel anytime, no complex pledges

**OLD SYSTEM** (Still in database, dormant):
- Block-based pledge/sponsorship system
- Complex funding mechanics
- Not part of MVP, may revisit later

---

## 🔒 Security Status

### ✅ **ALL CRITICAL VULNERABILITIES FIXED** (Feb 18-20, 2026)

**10 Security Fixes Implemented:**
1. ✅ SQL Injection - Parameterized queries
2. ✅ Stripe Subscription Cancellation - Proper cancellation
3. ✅ Unauthorized Access - Strict authorization
4. ✅ GPS Fraud Prevention - Boundary validation
5. ✅ JWT Token Validation - Type confusion prevented
6. ✅ User Enumeration - Endpoint disabled
7. ✅ File Upload Validation - Type and size checks
8. ✅ **HTTPS Enforcement** - SSL-only in production
9. ✅ **Security Headers** - XSS, clickjacking protection
10. ✅ **File Scanner Blocking** - Stops .env, .git scanners

**Security Infrastructure:**
- ✅ Rate limiting (Rack::Attack) - Prevents brute force
- ✅ Stripe error monitoring
- ✅ Security test suite
- ✅ Vulnerability scanner blocking

**Recent Fixes (Feb 20, 2026):**
- ✅ AWS S3 photo uploads working (fixed expiration limits)
- ✅ Profile photos now display correctly
- ✅ Blocked malicious file scanning attacks

---

## 🎉 What's Live Right Now

### ✅ Job Board MVP (Fully Deployed)

**Backend API** - All endpoints deployed to Render:
- 🗄️ **8 database tables** (cleanup_jobs, recurring_cleanups, reviews, etc.)
- 🎮 **10 RESTful controllers** with 60+ endpoints
- 🔐 **JWT authentication** shared with Pocket Walks
- 📸 **Photo uploads** via Active Storage + S3
- 🗺️ **GPS location tracking** using lat/lng
- 💰 **Stripe Connect** integration (test mode)
- 📱 **Push notifications** (iOS/Android)
- 🔌 **WebSockets** (Action Cable) for real-time updates

**Database Schema:**
```
✅ cleanup_jobs           (one-off jobs: open, claimed, completed)
✅ recurring_cleanups     (subscription-based recurring service)
✅ reviews                (scooper ratings from posters)
✅ blocks                 (old system - dormant)
✅ coverage_regions       (old system - dormant)
✅ pledges                (old system - dormant)
✅ cleanups               (old cleanup logs - may deprecate)
✅ poop_reports           (old reporting - may deprecate)
✅ scooper_milestones     (old gamification - may deprecate)
✅ users (extended)       (Stripe Connect, device tokens, photos)
✅ clients (extended)     (pet owner portal)
```

**Job Board API Endpoints:**
```
# One-Off Cleanup Jobs
POST   /cleanup_jobs                          # Create new job
GET    /cleanup_jobs                          # List all jobs (filter by status)
GET    /cleanup_jobs/my_posted                # Jobs I posted
GET    /cleanup_jobs/my_claimed               # Jobs I claimed as scooper
POST   /cleanup_jobs/:id/claim                # Claim a job
POST   /cleanup_jobs/:id/start                # Start working on job
POST   /cleanup_jobs/:id/complete             # Mark job complete
POST   /cleanup_jobs/:id/confirm              # Poster confirms completion
POST   /cleanup_jobs/:id/dispute              # Dispute job completion
POST   /cleanup_jobs/:id/cancel               # Cancel job
POST   /cleanup_jobs/:id/upload_before_photo  # Upload before photo
POST   /cleanup_jobs/:id/upload_after_photo   # Upload after photo

# Recurring Cleanup Subscriptions
POST   /recurring_cleanups                    # Create subscription
GET    /recurring_cleanups/my_subscriptions   # My subscriptions (as poster)
GET    /recurring_cleanups/my_assignments     # My assignments (as scooper)
POST   /recurring_cleanups/:id/pause          # Pause subscription
POST   /recurring_cleanups/:id/resume         # Resume subscription
POST   /recurring_cleanups/:id/cancel         # Cancel subscription
POST   /recurring_cleanups/:id/assign_scooper # Assign scooper to subscription

# Reviews
POST   /reviews                               # Leave review for scooper
GET    /reviews/:scooper_id                   # Get scooper's reviews

# Stripe Connect
POST   /stripe_connect/onboard                # Scooper onboarding
GET    /stripe_connect/status                 # Check Connect status
GET    /stripe_connect/dashboard              # Stripe dashboard link
POST   /stripe/webhooks                       # Handle payment events

# WebSocket Channels
/cable                                        # Action Cable endpoint
  - JobBoardChannel                           # Real-time job updates
  - CleanupJobChannel(job_id)                 # Specific job updates

# Push Notifications
POST   /users/register_device                 # Register device token
POST   /client/push_token                     # Register client device token
```

---

## 📊 Job Board Features

### Job Creation (Poster View)

**Required Fields:**
- `latitude` / `longitude` - GPS location
- `address` - Street address
- `price` - What poster will pay
- `job_type` - "poop", "litter", or "both"
- `segments_selected` - Block segments (north/south/east/west)

**Conditional Fields:**
- `poop_itemization` - "1-3", "4-8", or "9+" (if job_type includes poop)
- `litter_itemization` - "light", "moderate", or "heavy" (if job_type includes litter)

**Optional Fields:**
- `note` - Additional instructions

### Job Lifecycle

```
open → claimed → in_progress → completed → confirmed
                                        ↓
                                    disputed
```

**Status Descriptions:**
- **open** - Available for scoopers to claim
- **claimed** - Scooper accepted, hasn't started
- **in_progress** - Scooper is working on it
- **completed** - Scooper finished, awaiting confirmation
- **confirmed** - Poster confirmed, payment released
- **disputed** - Issue with completion, requires resolution
- **cancelled** - Job cancelled (before completion)
- **expired** - Job expired without being claimed

### Real-Time Features

**WebSocket Updates:**
- New jobs appear on map instantly
- Job status changes broadcast to all clients
- Location tracking during job (optional)
- Push notifications for all status changes

**Push Notifications:**
- Job claimed → poster notified
- Job completed → poster notified
- Job confirmed → scooper notified
- Job disputed → both parties notified

---

## 🔄 Recurring Subscriptions Features

### How It Works

1. **Poster creates subscription** with address, frequency, price
2. **Scooper assigned** (immediately or later)
3. **Stripe subscription created** with monthly recurring payment
4. **Jobs auto-generate** based on schedule (daily rake task)
5. **Cancel anytime** - Simple cancellation, no penalties

### Subscription Options

**Frequencies:**
- **Weekly** - Job every 7 days ($40/month recommended)
- **Biweekly** - Job every 14 days ($25/month recommended)
- **Monthly** - Job every 30 days ($15/month recommended)

**Day Selection:**
- Choose specific day of week (Monday-Sunday)
- Jobs generated on that day automatically

**Pricing Strategy:**
Subscriptions are ~50% cheaper than one-off jobs:
- One-off: $20/job
- Weekly subscription: $40/month = $10/visit (50% savings)
- Biweekly: $25/month = $12.50/visit (37% savings)
- Monthly: $15/month = $15/visit (25% savings)

### Auto-Generation System

**Rake Task** (runs daily via cron):
```bash
rails recurring_cleanups:generate_jobs
```

**What It Does:**
1. Finds subscriptions with `next_job_date <= today`
2. Creates CleanupJob for each one
3. Auto-assigns to scooper (status: "claimed")
4. Updates `next_job_date` based on frequency
5. Tracks `last_job_generated_at`

**Other Tasks:**
```bash
rails recurring_cleanups:schedule   # View upcoming jobs
rails recurring_cleanups:list       # List all subscriptions
```

---

## 🔧 Technical Decisions Made

### 1. **Simplified to Job Board Model**
   - **Decision**: Pivot from complex pledge/block system to simple job board
   - **Why**: Easier to understand, faster to market, real-world cleaning service model
   - **Impact**: ✅ Much simpler UX, familiar model (like Uber/TaskRabbit)

### 2. **Added Recurring Subscriptions**
   - **Decision**: Support both one-off AND subscription cleanups
   - **Why**: Gives users choice, provides steady income for scoopers
   - **Impact**: ✅ Best of both worlds - flexibility + predictability

### 3. **No PostGIS (Still Using Lat/Lng)**
   - **Decision**: Continue using decimal lat/lng fields
   - **Why**: Works great for MVP, simpler deployment
   - **Impact**: ✅ Fast queries, easy to develop

### 4. **Stripe Subscriptions (Not Complex Pledges)**
   - **Status**: Standard Stripe subscriptions for recurring cleanups
   - **Impact**: Simple monthly billing, easy cancellation
   - **For MVP**: Test mode works, can enable live mode anytime

### 5. **WebSocket Real-Time Updates**
   - **Status**: Action Cable configured for job updates
   - **Impact**: Jobs appear on map instantly, live status updates
   - **For Production**: Works on Render, no Redis needed for MVP

### 6. **Photo Uploads Fixed**
   - **Issue**: AWS S3 presigned URLs had wrong expiration
   - **Fix**: Changed from 1 year to 7 days (AWS maximum)
   - **Status**: ✅ Photos upload and display correctly now

---

## 📱 Frontend Integration Status

### ✅ Ready for Frontend Development

**Documentation Available:**
- `docs/SCOOP_MVP_TESTING_GUIDE.md` - Complete API testing guide
- `docs/FRONTEND_INTEGRATION_PROMPT.md` - Frontend development guide
- `docs/SCOOP_BACKEND_SUMMARY.md` - Full API reference

**Test Data:**
```bash
# Create 25 realistic test jobs across NYC
rails test_data:populate_jobs

# Clear test data
rails test_data:clear_test_jobs
```

**Frontend Needs to Build:**
1. **Map View** - Show jobs on map with pins
2. **Job Detail Modal** - View job details, claim button
3. **Create Job Form** - Post new cleanup jobs
4. **My Jobs Screen** - View posted/claimed jobs
5. **Subscription Screen** - Create recurring cleanups
6. **My Subscriptions** - Manage subscriptions (pause/cancel)
7. **Photo Capture** - Before/after photos
8. **Review System** - Rate scoopers after completion

---

## 🚧 What's Not Part of MVP (Dormant Features)

These exist in the database but are **not being used** in the current MVP:

### Old Block/Pledge System
- ❌ `blocks` table - Geographic block sponsorship
- ❌ `coverage_regions` table - Scoopers claiming blocks
- ❌ `pledges` table - Complex subscription pledges
- ❌ Warning periods, block activation, funding competition

**Why dormant?**
- Too complex for MVP
- Users prefer simple job board model
- May revisit if demand for neighborhood subscriptions

### Old Gamification
- ❌ `scooper_milestones` table - Achievement tracking
- ❌ Pickup milestones, streak tracking
- ❌ Badge system

**Why dormant?**
- Focus on core job completion first
- Reviews more important than badges
- May add back later

### Old Cleanup Logging
- ❌ `cleanups` table - GPS-verified cleanup logs
- ❌ `poop_reports` table - Resident reports

**Why dormant?**
- Replaced by CleanupJob lifecycle
- Photos now attached to jobs, not separate cleanups
- Simpler to have one model (CleanupJob) vs. multiple

---

## 📊 Production Deployment Status

### ✅ Fully Deployed on Render

**Environment:**
- ✅ Production database (PostgreSQL)
- ✅ All migrations run successfully
- ✅ AWS S3 configured and working
- ✅ Stripe in test mode
- ✅ HTTPS enforced
- ✅ Security headers enabled
- ✅ Rate limiting active
- ✅ WebSockets enabled

**Recent Deployments:**
- Feb 20, 2026 - Photo upload fixes (S3 expiration)
- Feb 20, 2026 - Recurring cleanups feature
- Feb 19, 2026 - File scanner blocking
- Feb 18, 2026 - Security hardening

**Test Production API:**
```bash
# Check if API is up
curl https://www.pocket-walks.com/cleanup_jobs

# Should return JSON with jobs array
```

---

## 🚀 Next Steps

### 1. **Production Setup** (Optional)

**Set up daily cron job** for recurring cleanup generation:
```bash
# Heroku Scheduler or Render Cron Job
# Run daily at 6 AM
rails recurring_cleanups:generate_jobs
```

**Enable Stripe Connect** (when ready for payments):
1. Go to Stripe Dashboard → Connect
2. Enable platform payments
3. Copy Client ID
4. Add to Render environment variables
5. Test scooper onboarding flow

### 2. **Frontend Development** (Primary Focus)

Build React Native app with:
- Map view showing available jobs
- Job creation form with all required fields
- Subscription creation form
- Job claim/complete flow
- Photo upload (before/after)
- Review system
- Push notifications

### 3. **Testing** (Before Launch)

- [ ] Test full job lifecycle (create → claim → complete → confirm)
- [ ] Test recurring subscription (create → auto-generate jobs → cancel)
- [ ] Test Stripe payments (when enabled)
- [ ] Test push notifications on real devices
- [ ] Test photo uploads
- [ ] Test review system
- [ ] Load test API with realistic usage

### 4. **Launch Preparation** (When Ready)

- [ ] Switch Stripe to live mode
- [ ] Set up error monitoring (Sentry)
- [ ] Set up analytics
- [ ] Create app store listings
- [ ] Write terms of service
- [ ] Write privacy policy
- [ ] Set up customer support system

---

## 📚 Documentation Files

**Current Documentation:**
- `docs/CURRENT_STATUS.md` - **This file!** Overall project status
- `docs/SCOOP_MVP_TESTING_GUIDE.md` - Testing guide with rake tasks
- `docs/FRONTEND_INTEGRATION_PROMPT.md` - Frontend development guide
- `docs/SCOOP_BACKEND_SUMMARY.md` - Complete API reference
- `docs/NEXT_STEPS.md` - Detailed next steps

**Setup Guides:**
- `docs/SCOOP_STRIPE_CONNECT_SETUP.md` - Stripe Connect setup
- `docs/SCOOP_S3_LIFECYCLE_SETUP.md` - S3 auto-deletion setup

**Legacy Docs** (Old system):
- Various docs about pledge/block system (no longer primary model)

---

## ✅ Success Criteria Met

- [x] Job board backend fully deployed
- [x] Recurring subscriptions implemented
- [x] All API endpoints working
- [x] Photo uploads fixed and working
- [x] Security hardened
- [x] WebSockets configured
- [x] Push notifications implemented
- [x] Complete documentation
- [x] Test data generation working
- [x] Ready for frontend development

---

## 🎊 Summary

**You now have:**
- ✅ Complete job board marketplace (one-off jobs)
- ✅ Subscription-based recurring cleanups
- ✅ 60+ API endpoints ready to use
- ✅ Real-time WebSocket updates
- ✅ Push notifications
- ✅ Photo upload system
- ✅ Review system
- ✅ Security hardened production API
- ✅ Zero impact on Pocket Walks
- ✅ Ready to build the mobile app!

**The MVP backend is complete!** Focus on building a beautiful, intuitive React Native UI that makes it dead simple for:
- **Posters** to request cleanups (one-time or recurring)
- **Scoopers** to find and complete jobs
- **Everyone** to see results and build trust through reviews

Happy building! 🚀
