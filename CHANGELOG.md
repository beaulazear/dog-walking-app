# Changelog

All notable changes to this project will be documented in this file.

## [MVP v3 Block Sponsorships System] - 2026-02-22

### ✨ New Features (MAJOR RELEASE)

#### Scoop MVP v3 - Complete Replacement of Previous System

**Background:** The previous Scoop system (Feb 14-15) used a competitive blocks/pledges/cleanups model. MVP v3 completely replaces this with a simpler, more focused block sponsorship subscription system.

**What Changed:**
- ❌ **Removed:** blocks, coverage_regions, pledges, cleanups, poop_reports, scooper_milestones tables
- ✅ **Added:** sponsorships, sweeps, contributions, sponsorship_ratings tables

#### Core Features Added

1. **Block Sponsorships** (`/api/sponsorships`)
   - Monthly subscription model for block cleanup
   - Sponsors set budget and schedule (weekly/biweekly)
   - Display preferences (anonymous, first name, business name)
   - Payment splits: 82% scooper, 18% platform
   - Status machine: open → claimed → active (or paused/cancelled)

2. **First-Tap-Wins Claiming**
   - Database-level locking prevents race conditions
   - Dog walkers claim open sponsorships
   - Only one scooper can claim each block

3. **GPS-Verified Sweeps** (`/api/sponsorships/:id/sweeps`)
   - ~150m tolerance for GPS verification
   - Photo uploads with 7-day S3 expiration
   - Automatic payout calculation
   - Updates sponsorship stats automatically

4. **Neighbor Contributions** (`/api/sponsorships/:id/contributions`)
   - Neighbors contribute monthly to reduce sponsor cost
   - Sponsor cost = budget - contributions (never below $0)
   - Auto-updates sponsorship cost on changes

5. **Monthly Ratings** (`/api/sponsorships/:id/ratings`)
   - 4-category ratings (quality, thoroughness, timeliness, communication)
   - Database constraint: one rating per month per sponsorship
   - Auto-calculates overall rating
   - Updates dog walker's overall_rating

6. **Public Map API** (`/api/map/*`)
   - NO authentication required
   - Browse neighborhood stats without signup
   - View block details publicly

7. **User Role Toggle** (`PATCH /users/toggle_roles`)
   - Users can be poster AND dog walker simultaneously
   - Easy role switching for testing

### 📊 Database Schema

**New Tables:**
- `sponsorships` (21 columns) - Core subscription records
- `sweeps` (17 columns) - GPS-verified maintenance logs
- `contributions` (8 columns) - Neighbor support payments
- `sponsorship_ratings` (13 columns) - Monthly feedback

**Migrations:**
- `20260221221759_add_dog_walker_fields_to_users.rb`
- `20260221221918_create_sponsorships.rb`
- `20260221221939_create_sweeps.rb`
- `20260221221957_create_contributions.rb`
- `20260221222014_create_sponsorship_ratings.rb`
- `20260221233416_add_gps_verified_to_sweeps.rb`

### 🎯 Controllers & Routes

**New Controllers:**
- `Api::SponsorshipsController` (index, show, create, update, claim, pause, resume, cancel)
- `Api::SweepsController` (index, create)
- `Api::ContributionsController` (index, create, update, destroy)
- `Api::SponsorshipRatingsController` (index, create)
- `Api::MapController` (stats, block_detail, neighborhoods)

**Total New Endpoints:** 19+ across 5 controllers

### 🔐 Security Features

- ✅ Authorization checks on all modify operations
- ✅ GPS boundary validation (prevents fraud)
- ✅ First-tap-wins database locking (prevents race conditions)
- ✅ Rate limiting via Rack::Attack
- ✅ JWT token expiration (24 hours)

### 📚 Documentation

**Created:**
- `docs/MVP_V3_BACKEND_COMPLETE.md` - 1000+ line technical reference
- `docs/MVP_V3_HANDOFF_PROMPT.md` - Session handoff for new Claude sessions
- `docs/SECURITY_QUICK_WINS.md` - Security implementation guide
- `docs/MONTHLY_CRON_SETUP.md` - Monthly maintenance tasks

**Updated:**
- `README.md` - Updated for MVP v3
- `PROJECT_STATUS.md` - Updated status overview
- `DOCUMENTATION_INDEX.md` - Updated navigation

**Archived:**
- Old Scoop system docs moved to `docs/archive/old-scoop-system/`
- Outdated prompts moved to `docs/archive/old-prompts/`

### 🧪 Testing

**Test Data Generation:**
```bash
bundle exec rake test_data:create_sponsorships  # Creates 10 test sponsorships
bundle exec rake test_data:clear_sponsorships   # Clears test data
```

**Creates:**
- 10 sponsorships across Brooklyn neighborhoods
- 3 test dog walkers with profiles
- 27 completed sweeps with GPS verification
- Random contributions and ratings
- Mix of statuses (open, claimed, active, paused)

### 🐛 Bug Fixes During Implementation

Fixed 11 schema mismatches during testing:
1. Segment names (NW/NE/SW/SE instead of cardinal directions)
2. Display preference values (first_name not name)
3. Removed non-existent columns (clean_since, scheduled_date, last_sweep_at, etc.)
4. Fixed Contribution to use contributor_id (User reference)
5. Fixed SponsorshipRating column names (review_text not notes)
6. Added missing methods (completed?, paused scope)
7. Fixed cascade deletes (destroy_all vs delete_all)
8. Added missing foreign keys in ratings
9. Added gps_verified column to sweeps
10. Fixed authentication callback name (authorized not authenticate_user)
11. Fixed payment calculations to prevent negative costs

### 💰 Payment Model

**Deferred for Later:**
- Stripe payment processing
- Subscription creation in Stripe
- Payouts to dog walkers

**Business Logic Complete:**
- Payment split calculations (82/18)
- Payout per sweep calculations
- Sponsor cost with contributions
- All payment math tested and working

**Can Enable Payments Later By:**
1. Adding Stripe Connect Client ID to credentials
2. Implementing subscription creation in controller
3. Setting up webhook handlers
4. See `docs/MVP_V3_BACKEND_COMPLETE.md` for details

### 📝 Notes

- **Backward Compatible:** Zero impact on existing Pocket Walks functionality
- **Production Ready:** All tests passing, migrations successful
- **Frontend Ready:** Backend complete and documented for frontend integration
- **Two Separate Systems:** One-off cleanup jobs (`/cleanup_jobs`) still exist separately

---

## [HTTPS Enforcement & Security Headers] - 2026-02-19

### 🔒 Security Improvements

#### Added (CRITICAL)
- **HTTPS/SSL Enforcement** - `config/environments/production.rb`
  - Enabled `force_ssl = true` in production
  - Forces all HTTP traffic to redirect to HTTPS
  - Adds Strict-Transport-Security header automatically
  - Protects all API traffic from man-in-the-middle attacks
  - Production only - doesn't affect local development

- **Security Headers** - `config/initializers/security_headers.rb`
  - `X-Frame-Options: SAMEORIGIN` - Prevents clickjacking attacks
  - `X-Content-Type-Options: nosniff` - Prevents MIME-type confusion attacks
  - `X-XSS-Protection: 1; mode=block` - XSS protection for legacy browsers
  - `Referrer-Policy: strict-origin-when-cross-origin` - Privacy protection
  - `Permissions-Policy` - Restricts geolocation, camera, microphone, payment APIs

#### Impact
- ✅ No breaking changes to existing products (Pocket Walks, Client Portal, Scoop)
- ✅ Production frontends already use HTTPS
- ✅ Industry-standard security best practices implemented
- ✅ Defense-in-depth protection against common web attacks
- ✅ Zero external dependencies

---

## [Security Documentation Reorganization] - 2026-02-19

### 🗂️ Changed

#### Documentation Organization
- **Moved all security docs to `security/` folder** for better organization
  - Moved: `SECURITY_FIXES_SUMMARY.md` → `security/SECURITY_FIXES_SUMMARY.md`
  - Moved: `SECURITY_QUICK_START.md` → `security/SECURITY_QUICK_START.md`
  - Moved: `STRIPE_SECURITY_SETUP.md` → `security/STRIPE_SECURITY_SETUP.md`
  - Moved: `test/security_test.rb` → `security/security_test.rb`
  - Moved: `test/manual_security_tests.md` → `security/manual_security_tests.md`

- **Archived old security docs** from Feb 14-15 review to `docs/archive/`
  - Moved: `docs/FINAL_SECURITY_REVIEW.md` → `docs/archive/`
  - Moved: `docs/SECURITY_FIXES_APPLIED.md` → `docs/archive/`
  - Moved: `docs/STRIPE_SECURITY_AND_INTEGRATION.md` → `docs/archive/`
  - Moved: `docs/QUICK_REFERENCE_STRIPE_SECURITY.md` → `docs/archive/`
  - Moved: `docs/STRIPE_INTEGRATION_GUIDE.md` → `docs/archive/`
  - **Kept:** `docs/SCOOP_STRIPE_CONNECT_SETUP.md` (has unique Scoop-specific info)

- **Created `security/README.md`** - Security documentation index with quick reference
- **Created `docs/archive/README.md`** - Explains archived docs and what supersedes them

#### Documentation Updates (Made More Concise)
- **security/SECURITY_QUICK_START.md** - Reduced from 275 → 130 lines (52% shorter)
- **security/SECURITY_FIXES_SUMMARY.md** - Reduced from 531 → 279 lines (47% shorter)
- **security/manual_security_tests.md** - Reduced from 361 → 284 lines (21% shorter)
- **security/STRIPE_SECURITY_SETUP.md** - Reduced from 489 → 334 lines (32% shorter)

#### Reference Updates
- Updated all documentation files to reference new `security/` folder:
  - `DOCUMENTATION_INDEX.md` - All security links updated
  - `PROJECT_STATUS.md` - All security references updated
  - `README.md` - Security references updated

### ✨ Added
- **security/README.md** - Central index for all security documentation with:
  - Quick reference commands
  - Security status summary
  - Links to all security docs
  - Monitoring & emergency contacts

- **docs/archive/README.md** - Documents archived files and what supersedes them

---

## [Security Hardening] - 2026-02-18

### 🔒 Security Fixes (CRITICAL)

#### Fixed
- **SQL Injection Vulnerability** - Parameterized queries prevent database compromise
  - Location: `app/controllers/poop_reports_controller.rb:59`
  - Impact: CRITICAL - Could have led to full database compromise

- **Stripe Subscription Not Cancelled** - Subscriptions now properly cancelled in Stripe
  - Location: `app/controllers/pledges_controller.rb:152`
  - Impact: CRITICAL - Was causing unauthorized recurring charges

- **Unauthorized Pledge Enumeration** - Strict authorization now enforced
  - Location: `app/controllers/pledges_controller.rb:7`
  - Impact: CRITICAL - Prevented PII disclosure and payment data leakage

- **GPS Boundary Validation** - Cleanup GPS coordinates now verified
  - Location: `app/controllers/cleanups_controller.rb:85`
  - Impact: CRITICAL - Prevents payment fraud from fake cleanups

- **Pledge Amount Modification** - Cannot change amounts on active subscriptions
  - Location: `app/controllers/pledges_controller.rb:119`
  - Impact: HIGH - Prevents payment fraud

- **JWT Token Type Confusion** - Client tokens rejected on User endpoints
  - Location: `app/controllers/application_controller.rb:12`
  - Impact: CRITICAL - Prevents authentication bypass

- **User Enumeration** - GET /users endpoint disabled
  - Location: `app/controllers/users_controller.rb:27`
  - Impact: HIGH - Prevents user information disclosure
  - Bonus: Fixed mass assignment vulnerability in user signup

- **File Upload Validation** - Type and size validation on all uploads
  - Locations: Multiple controllers
  - Impact: MEDIUM - Prevents malicious file uploads and DoS

### ✨ Added

#### Security Infrastructure
- **Rate Limiting (Rack::Attack)**
  - New file: `config/initializers/rack_attack.rb`
  - Login attempts: 5 per hour per IP
  - Signups: 3 per day per IP
  - API requests: 300 per 5 minutes per IP
  - SQL injection pattern blocking
  - Malicious user agent blocking

- **Stripe Error Monitoring**
  - New file: `app/services/stripe_error_monitor.rb`
  - Real-time error tracking
  - Critical error alerting
  - Success tracking
  - Revenue integrity checks

- **Monitoring Rake Tasks**
  - New file: `lib/tasks/stripe_monitoring.rake`
  - `rails stripe:monitor:health` - Overall health check
  - `rails stripe:monitor:errors` - Recent error report
  - `rails stripe:monitor:validate_scoopers` - Check Connect accounts
  - `rails stripe:monitor:check_cancelled_subscriptions` - Find mismatches

- **Security Testing Suite**
  - New file: `test/security_test.rb` - Automated security tests
  - New file: `test/manual_security_tests.md` - Manual testing guide

- **Configuration Checker**
  - New file: `bin/check_stripe_config` - Executable validator
  - Checks all Stripe credentials
  - Validates configuration
  - Tests API connection

#### Documentation
- New file: `SECURITY_FIXES_SUMMARY.md` - Complete security documentation
- New file: `STRIPE_SECURITY_SETUP.md` - Stripe configuration guide
- New file: `SECURITY_QUICK_START.md` - Quick start guide
- New file: `PROJECT_STATUS.md` - Master status document
- New file: `DOCUMENTATION_INDEX.md` - Documentation navigation
- New file: `CHANGELOG.md` - This file

#### Dependencies
- Added: `rack-attack` gem for rate limiting

### 🔄 Changed

#### Controllers (Security Hardening)
- Modified: `app/controllers/poop_reports_controller.rb`
  - Fixed SQL injection vulnerability
  - Added file upload validation

- Modified: `app/controllers/pledges_controller.rb`
  - Added Stripe subscription cancellation
  - Added authorization checks
  - Added pledge amount protection
  - Integrated error monitoring

- Modified: `app/controllers/cleanups_controller.rb`
  - Added GPS boundary validation
  - Added file upload validation

- Modified: `app/controllers/application_controller.rb`
  - Added JWT token type validation
  - Wrapped debug logs in environment checks

- Modified: `app/controllers/users_controller.rb`
  - Disabled user enumeration endpoint
  - Fixed mass assignment vulnerability
  - Separated signup params from rate params

- Modified: `app/controllers/stripe_webhooks_controller.rb`
  - Added webhook secret validation
  - Enhanced error monitoring
  - Added payment failure tracking

#### Configuration
- Modified: `config/application.rb` - Added Rack::Attack middleware
- Modified: `Gemfile` - Added rack-attack gem

#### Documentation Updates
- Updated: `README.md` - Comprehensive rewrite with security focus
- Updated: `docs/CURRENT_STATUS.md` - Added security section
- Updated: `docs/NEXT_STEPS.md` - Added security verification phase

### 📝 Documentation

All security fixes are comprehensively documented:
- Before/after code examples
- Impact assessments
- Testing procedures
- Deployment checklists
- Incident response procedures

---

## [Scoop Backend Deployment] - 2026-02-14

### ✨ Added

#### Scoop Marketplace Backend
- 6 new database tables (blocks, coverage_regions, pledges, cleanups, poop_reports, scooper_milestones)
- 8 new controllers with 40+ endpoints
- Competitive marketplace mechanics
- GPS-verified cleanup tracking
- Gamification system
- Stripe Connect scaffolding

### 🔄 Changed
- Extended `users` table with Scoop fields
- Extended `clients` table with Scoop fields
- Shared authentication across all products

---

## [Pocket Walks] - Initial Release

### ✨ Added
- Dog walking appointment management
- Pet profiles and management
- Invoice tracking and earnings
- Team collaboration
- Training certification tracking
- Pet sitting management
- React frontend with dashboard

---

## Notes

### Security Review Schedule
- **Last Review:** February 18, 2026
- **Next Review:** Before production launch
- **Critical Updates:** Immediate
- **Regular Updates:** Monthly

### Deployment Notes
- All changes deployed to Render
- Zero impact on existing Pocket Walks functionality
- All tests passing
- Production-ready

---

## Legend

- 🔒 Security Fix
- ✨ New Feature
- 🔄 Changed
- 🐛 Bug Fix
- 📝 Documentation
- ⚠️ Deprecated
- 🗑️ Removed
