# New Session Context Prompt

**Purpose:** Use this prompt when starting a new Claude Code session to implement MVP changes, UI/UX updates, or new features.

**Last Updated:** February 20, 2026

---

## Copy This Prompt to Start New Sessions

```
I'm working on a Rails API + React Native mobile app ecosystem with multiple products. I have new MVP/UI/UX documentation that needs to be implemented. Before we start, please familiarize yourself with the current state of the project.

## Project Overview

**Main Repository:** /Users/beaulazear/Desktop/dog-walking-app
**Mobile App:** /Users/beaulazear/Desktop/scoop-mobile (or specify which mobile app)
**Landing Page:** /Users/beaulazear/Desktop/scoopers_web

### Products in Production

1. **Pocket Walks** - Dog walking appointment management
   - Web: https://www.pocket-walks.com
   - Mobile: React Native app (iOS/Android)

2. **Trainer** - Dog training session tracker
   - Web: Separate Next.js app
   - Uses same Rails API backend

3. **Scoop** - Dog waste cleanup marketplace (MVP in development)
   - Mobile: /Users/beaulazear/Desktop/scoop-mobile
   - Landing page: https://beaulazear.github.io
   - Two service models:
     - One-off cleanup jobs (job board)
     - Recurring cleanup subscriptions

### Current Technical Stack

**Backend (Rails API):**
- Rails 7.2
- PostgreSQL database
- AWS S3 for file storage
- Stripe for payments (test mode)
- JWT authentication (prioritized over sessions)
- Deployed on Render: https://dog-walking-app.onrender.com

**Frontend:**
- React Native (Expo) for mobile apps
- React (Vite) for web landing page
- JWT token authentication across all platforms

**Authentication:**
- All products now use JWT-only authentication
- Backend supports both User (walkers/scoopers) and Client (pet owners/residents) tokens
- Tokens stored in localStorage (web) or SecureStore (mobile)

### Recent Major Changes (Feb 18-20, 2026)

✅ **Security Hardening:**
- HTTPS enforcement
- Security headers
- Rate limiting (Rack::Attack)
- File scanner blocking
- 10 critical vulnerabilities fixed

✅ **Recurring Cleanup Subscriptions:**
- Full subscription service added to Scoop
- Weekly/biweekly/monthly frequency options
- Auto-job generation via cron
- Stripe subscription integration
- Complete backend implementation

✅ **JWT Authentication Consolidation:**
- Fixed all products to use JWT-only
- Removed session cookie dependencies
- Fixed CORS issues on landing page
- Consistent auth pattern across all 5 products

✅ **Infrastructure Documentation:**
- Complete guides for Redis, Sidekiq, Cron jobs
- Step-by-step implementation plans
- Cost breakdowns and service requirements

### Important Documentation Files

**Current Status & Architecture:**
- `docs/CURRENT_STATUS.md` - Complete project status
- `docs/SESSION_SUMMARY_FEB_20_2026.md` - Latest session changes
- `docs/SCOOP_MVP_TESTING_GUIDE.md` - API testing guide
- `docs/FRONTEND_INTEGRATION_PROMPT.md` - Frontend integration specs

**Infrastructure & Setup:**
- `docs/INFRASTRUCTURE_SERVICES_GUIDE.md` - Services needed (Redis, etc.)
- `docs/INFRASTRUCTURE_IMPLEMENTATION_PLAN.md` - Step-by-step setup

**API Reference:**
- `docs/SCOOP_BACKEND_SUMMARY.md` - Complete API documentation
- 60+ endpoints documented

### Database Schema Overview

**Scoop MVP (Current Focus):**
- `cleanup_jobs` - One-off job board listings
- `recurring_cleanups` - Subscription-based recurring service
- `reviews` - Scooper ratings

**Scoop Legacy (Dormant - not part of MVP):**
- `blocks`, `coverage_regions`, `pledges` - Complex sponsorship system
- `cleanups`, `poop_reports`, `scooper_milestones` - Old tracking

**Pocket Walks:**
- `users`, `pets`, `appointments`, `invoices`
- `walker_connections`, `appointment_shares`
- `pet_sits`, `training_sessions`, `walk_groups`

**Client Portal:**
- `clients` - Pet owners using client portal
- Separate JWT authentication (`client_id` instead of `user_id`)

### Key Technical Decisions

1. **JWT-First Authentication** - All platforms use JWT tokens, no session cookies
2. **Job Board Model** - Simple marketplace vs complex pledge system
3. **Dual Service Model** - Both one-off jobs AND recurring subscriptions
4. **Rails 7.2** - Using latest stable Rails with Active Storage
5. **No PostGIS** - Using lat/lng decimal fields instead of geometry

### What's Ready for Changes

**Backend:**
- ✅ Fully deployed and tested
- ✅ All migrations run
- ✅ Security hardened
- ✅ API endpoints working
- ⚠️ Redis/Sidekiq/Cron not set up yet (optional infrastructure)

**Frontend:**
- ⚠️ Mobile app needs UI implementation
- ⚠️ Needs to match new MVP/UX docs
- ✅ Auth system ready (JWT)
- ✅ API endpoints available

### What I Need Help With

I have new MVP/UI/UX documentation that includes:
[PASTE YOUR NEW DOCUMENTS HERE]

Please:
1. Review the new requirements
2. Compare to current implementation (use docs above as reference)
3. Identify what needs to change in the backend (migrations, models, endpoints)
4. Identify what needs to be built in the frontend (screens, components, flows)
5. Create a plan for implementation
6. Ask any clarifying questions before we start coding

### Important Constraints

- ✅ DO NOT break Pocket Walks or Trainer products (shared database/API)
- ✅ Keep JWT authentication pattern consistent
- ✅ Follow existing API naming conventions
- ✅ Update documentation as we make changes
- ✅ Test changes don't break existing products
- ⚠️ Be cautious with database migrations (production data exists)

### Working Directories

When you need to reference files, here are the key paths:
- **Rails API:** `/Users/beaulazear/Desktop/dog-walking-app/`
- **Scoop Mobile:** `/Users/beaulazear/Desktop/scoop-mobile/`
- **Scoopers Web:** `/Users/beaulazear/Desktop/scoopers_web/`
- **Voxxy Rails (Reference):** `/Users/beaulazear/Desktop/voxxy-rails/`
- **Voxxy Mobile (Reference):** `/Users/beaulazear/Desktop/voxxy-mobile/`

The voxxy projects are reference implementations - use them to understand patterns but don't modify them.

---

Ready to review the new MVP documentation and create an implementation plan!
```

---

## How to Use This Prompt

### For Mobile App Changes:
1. Open new Claude Code session in `/Users/beaulazear/Desktop/scoop-mobile/`
2. Paste the prompt above
3. Add your new MVP/UI/UX documents where indicated
4. Claude will analyze and create implementation plan

### For Backend/API Changes:
1. Open new Claude Code session in `/Users/beaulazear/Desktop/dog-walking-app/`
2. Paste the prompt above
3. Add your new MVP/UI/UX documents where indicated
4. Claude will analyze migrations, models, endpoints needed

### For Full-Stack Changes:
1. Start with backend session first (API changes)
2. Once backend is deployed, do mobile session
3. Or work in parallel if changes are independent

---

## Customization Tips

### If working on specific product:
Add after "What I Need Help With":
```
**Specific Product:** Scoop (cleanup marketplace)
**Focus Area:** [Scooper view / Poster view / Both]
```

### If you have mockups/designs:
Add after pasting documents:
```
**Design Files:** [Describe or reference Figma/design files]
**Key Screens:** [List main screens that changed]
```

### If this is a bug fix vs new feature:
Add at the beginning:
```
**Session Type:** [Bug Fix / New Feature / UI Polish / Refactor]
**Urgency:** [Critical / High / Medium / Low]
```

---

## What Claude Will Do

When you paste this prompt + new docs, Claude Code will:

1. ✅ Read current documentation files
2. ✅ Understand existing architecture
3. ✅ Compare new requirements to current implementation
4. ✅ Identify gaps and changes needed
5. ✅ Create implementation plan
6. ✅ Ask clarifying questions
7. ✅ Execute changes safely (without breaking existing products)
8. ✅ Update documentation
9. ✅ Test and verify changes

---

## Quick Reference: Key Files to Check

Before starting new session, check these files are up to date:

**Must Read:**
- [ ] `docs/CURRENT_STATUS.md` - Project status
- [ ] `docs/SCOOP_MVP_TESTING_GUIDE.md` - API guide
- [ ] `docs/FRONTEND_INTEGRATION_PROMPT.md` - Frontend specs

**Optional Reference:**
- [ ] `docs/SESSION_SUMMARY_FEB_20_2026.md` - Latest changes
- [ ] `docs/SCOOP_BACKEND_SUMMARY.md` - Full API reference
- [ ] `docs/INFRASTRUCTURE_SERVICES_GUIDE.md` - Services needed

---

## Example Session Starts

### Example 1: New Scooper Profile Screen

```
[Paste prompt above]

**New MVP Documentation:**

I need to add a scooper profile screen to the mobile app with:
- Profile photo upload
- Bio/description (max 500 chars)
- Service areas (map view)
- Ratings & reviews display
- Completed jobs count
- Badge/milestone display

[Paste any designs or additional specs]
```

### Example 2: Backend API Changes

```
[Paste prompt above]

**New MVP Documentation:**

We need to add these features to the CleanupJob API:
- Tipping functionality (add tip to final payment)
- Job templates (save common job settings)
- Batch job creation (create multiple jobs at once)
- Scooper availability calendar

[Paste detailed requirements]
```

### Example 3: Complete New Feature

```
[Paste prompt above]

**New MVP Documentation:**

New Feature: "Scoop Teams" - Allow scoopers to form teams and collaborate

Backend needs:
- Teams table (name, members, split_rules)
- Team invitations
- Shared job assignments
- Payment splitting logic

Frontend needs:
- Create team screen
- Invite members flow
- Team dashboard
- Job assignment interface

[Paste full spec document]
```

---

**Save this file and reference it when starting new sessions!**
