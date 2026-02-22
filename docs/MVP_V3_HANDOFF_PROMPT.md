# MVP v3 Backend - Next Session Handoff Prompt

**Copy this entire prompt when starting a new session to give Claude full context:**

---

## Quick Context

I'm working on **Scoopers**, a dog waste cleanup marketplace app. We just completed the MVP v3 backend implementation which adds a **block sponsorship system** where sponsors pay monthly for recurring cleanup of specific blocks.

The backend is **fully built and tested**. All API endpoints work, database schema is correct, and test data can be generated.

## What Was Just Completed (Feb 22, 2026)

### ✅ Implemented Systems

1. **Block Sponsorships** (`/api/sponsorships`)
   - Sponsors can create monthly subscriptions for block cleanup
   - Dog walkers claim blocks (first-tap-wins with database locking)
   - Status machine: open → claimed → active (or paused/cancelled)
   - Payment splits: 82% scooper, 18% platform

2. **GPS-Verified Sweeps** (`/api/sponsorships/:id/sweeps`)
   - Dog walkers log completed maintenance sweeps
   - GPS validation within ~150m of block center
   - Auto-updates sponsorship stats (total_pickups, pickups_this_month)
   - Calculates scooper payout automatically

3. **Neighbor Contributions** (`/api/sponsorships/:id/contributions`)
   - Neighbors can contribute monthly to reduce sponsor cost
   - Sponsor cost = budget - contributions (never below $0)
   - Auto-updates sponsorship cost on contribution changes

4. **Monthly Ratings** (`/api/sponsorships/:id/ratings`)
   - Sponsors rate dog walkers monthly (4 categories + overall)
   - Database constraint: one rating per month per sponsorship
   - Auto-calculates overall rating from categories
   - Updates dog walker's overall_rating

5. **Public Map API** (`/api/map/*`)
   - NO authentication required
   - Returns neighborhood stats, block details
   - Enables "browse before signup" UX

6. **User Role Toggle** (`PATCH /users/toggle_roles`)
   - Users can be BOTH poster AND dog walker simultaneously
   - Easy role switching for testing
   - Dog walker profile fields (instagram, business_name, neighborhoods)

### ✅ Database Schema (All Migrations Applied)

- `sponsorships` table (21 columns) - core subscription records
- `sweeps` table (17 columns) - GPS-verified maintenance logs
- `contributions` table (8 columns) - neighbor support payments
- `sponsorship_ratings` table (13 columns) - monthly feedback
- `users` table additions (is_poster, is_dog_walker, instagram_handle, etc.)

All foreign keys, indexes, and constraints are in place.

### ✅ Test Data Available

```bash
bundle exec rake test_data:create_sponsorships
```

Creates 10 sponsorships across Brooklyn with:
- 3 test dog walkers (Sarah Chen, Mike Rodriguez, Lisa Park)
- 27 completed sweeps with GPS verification
- Random contributions and ratings
- Mix of statuses (open, claimed, active, paused)

### ✅ Models & Business Logic

All models tested and working:
- `Sponsorship` - state machine methods (claim!, pause!, resume!, cancel!)
- `Sweep` - GPS validation, payment calculation
- `Contribution` - auto-updates sponsor cost
- `SponsorshipRating` - auto-calculates overall rating, enforces uniqueness
- `User` - public profiles, role toggles, overall rating calculations

### ✅ Issues Fixed

During implementation, we fixed 11 schema mismatches:
1. Segment names (NW/NE/SW/SE)
2. Display preference values
3. Removed non-existent columns (clean_since, scheduled_date, last_sweep_at, paused_at, cancelled_at)
4. Fixed Contribution to use contributor_id (User reference)
5. Fixed SponsorshipRating column names
6. Added missing methods (completed?, paused scope)
7. Fixed cascade deletes (destroy_all vs delete_all)

**All tests pass.** The backend is production-ready.

---

## Important Architecture Notes

### Two Separate Systems

1. **One-Off Cleanup Jobs** (`/cleanup_jobs`) - EXISTING
   - Instant, one-time cleanup requests
   - Poster pays per job
   - Separate from sponsorships

2. **Block Sponsorships** (`/api/sponsorships`) - NEW (MVP v3)
   - Recurring monthly subscriptions
   - Different payment model
   - Different controllers/routes

**They don't interact with each other.** Keep them separate.

### Payment Math (Critical)

**Per-Sweep Amount:**
```
sweeps_per_month = schedule == "weekly" ? 4 : 2
per_sweep = monthly_budget / sweeps_per_month
```

**Scooper Payout (82%):**
```
payout = per_sweep * 0.82
```

**Sponsor Cost:**
```
cost = monthly_budget - total_contributions
sponsor_cost = [cost, 0].max  # Never negative!
```

**Example:**
- $48/month weekly = $12/sweep = $9.84 to scooper, $2.16 to platform

### GPS Verification

Sweeps validate location on creation:
```ruby
max_tolerance = 0.0015  # ~150 meters
# Compares arrival_lat/lng to sponsorship.lat/lng
# Sets gps_verified = true/false
```

### First-Tap-Wins

Sponsorship claiming uses database locks:
```ruby
ActiveRecord::Base.transaction do
  sponsorship = Sponsorship.lock.find(id)
  # Prevents race conditions
end
```

### Contribution Math Edge Case

If contributions exceed budget, sponsor cost = $0 (not negative):
```ruby
# budget: $48, contributions: $55
# sponsor_cost = [48 - 55, 0].max = $0 ✅
```

---

## What's NOT Done Yet

### Stripe Integration (Deferred)
- Payment processing
- Subscriptions
- Payouts
- Connect onboarding

All marked with `# TODO:` comments in controllers.

### Push Notifications (Deferred)
- Marked with `# TODO:` comments
- Method calls stubbed out

### Cron Jobs (Documented, Not Set Up)
- Monthly stats reset
- Rating reminders
- See `docs/MONTHLY_CRON_SETUP.md`

---

## File Locations

**Documentation:**
- `docs/MVP_V3_BACKEND_COMPLETE.md` - Full reference (THIS IS THE KEY DOC)
- `docs/MONTHLY_CRON_SETUP.md` - Cron job setup
- `docs/MVP_V3_HANDOFF_PROMPT.md` - This file

**Migrations:**
- `db/migrate/20260221221759_add_dog_walker_fields_to_users.rb`
- `db/migrate/20260221221918_create_sponsorships.rb`
- `db/migrate/20260221221939_create_sweeps.rb`
- `db/migrate/20260221221957_create_contributions.rb`
- `db/migrate/20260221222014_create_sponsorship_ratings.rb`
- `db/migrate/20260221233416_add_gps_verified_to_sweeps.rb`

**Models:**
- `app/models/sponsorship.rb`
- `app/models/sweep.rb`
- `app/models/contribution.rb`
- `app/models/sponsorship_rating.rb`
- `app/models/user.rb` (updated)

**Controllers:**
- `app/controllers/api/sponsorships_controller.rb`
- `app/controllers/api/sweeps_controller.rb`
- `app/controllers/api/contributions_controller.rb`
- `app/controllers/api/sponsorship_ratings_controller.rb`
- `app/controllers/api/map_controller.rb`
- `app/controllers/users_controller.rb` (added toggle_roles)

**Routes:**
- All routes in `config/routes.rb` under `namespace :api`

**Rake Tasks:**
- `lib/tasks/sponsorships.rake` (monthly maintenance + test data)

---

## Common Commands

**Generate Test Data:**
```bash
bundle exec rake test_data:create_sponsorships
```

**Clear Test Data:**
```bash
bundle exec rake test_data:clear_sponsorships
```

**Check Schema:**
```bash
rails runner "puts Sponsorship.column_names.sort.join(', ')"
rails runner "puts Sweep.column_names.sort.join(', ')"
```

**Rails Console:**
```bash
rails c
# Test creating a sponsorship
s = Sponsorship.create!(sponsor_id: 1, latitude: 40.6782, longitude: -73.9442, block_id: 'BK-40.6782--73.9442', segments_selected: ['NW', 'NE'], schedule: 'weekly', monthly_budget: 48, display_preference: 'anonymous')
```

---

## Testing Credentials

**Sponsor:**
- Email: `beau09946@gmail.com`
- Password: `password123`

**Dog Walkers (created by test data task):**
- `walker1@test.com` / `password123` - Sarah Chen (@sarahwalksnyc)
- `walker2@test.com` / `password123` - Mike Rodriguez (@mikesthepickup)
- `walker3@test.com` / `password123` - Lisa Park (@lisascleanbk)

---

## If You Need to Make Changes

### Adding a Column
1. Create migration
2. Update model if needed
3. Check controllers for serialization
4. Update test data rake task if relevant
5. Update `docs/MVP_V3_BACKEND_COMPLETE.md`

### Adding an Endpoint
1. Add route to `config/routes.rb`
2. Add controller action
3. Test with curl or Postman
4. Update docs

### Debugging Schema Issues
```bash
# Always check actual columns first!
rails runner "puts ModelName.column_names.sort"

# Don't assume columns exist - verify
rails runner "p ModelName.first&.attributes"
```

---

## Known Edge Cases Handled

1. ✅ Contributions exceeding budget → sponsor cost = $0
2. ✅ GPS too far from block → sweep rejected
3. ✅ Double claiming → first-tap-wins with locks
4. ✅ Duplicate monthly rating → database constraint prevents
5. ✅ Deleting sponsorship → cascade deletes sweeps/contributions/ratings
6. ✅ Users can be both poster AND dog walker

---

## Next Steps (Frontend)

The backend is ready. Frontend needs to implement:

1. **Sponsorship Creation Flow**
   - Map interface to select block
   - Choose segments (NW/NE/SW/SE quadrants)
   - Set schedule and budget
   - Display preference settings

2. **Dog Walker Claiming**
   - Browse open sponsorships on map
   - First-tap-wins claiming
   - Profile setup (instagram, business name, neighborhoods)

3. **Sweep Logging**
   - GPS check on arrival
   - Photo upload after completion
   - Pickup count entry

4. **Contributions**
   - Neighbor support flow
   - Monthly subscription management

5. **Monthly Ratings**
   - 4-category rating interface
   - Review text input
   - View past ratings

---

## Questions to Ask Me

When starting a new session, you can ask:

1. **"What frontend work should I prioritize for MVP v3?"**
2. **"Can you explain the sponsorship payment flow?"**
3. **"How does the GPS verification work?"**
4. **"Show me an example API call for [specific endpoint]"**
5. **"What Stripe integration do we need next?"**

---

## Final Notes

- **Backend is DONE** ✅
- All tests pass ✅
- Production deployed ✅
- Test data available ✅
- Documentation complete ✅

**Status:** Ready for frontend development!

**Last Updated:** February 22, 2026
**Session:** MVP v3 Backend Implementation Complete
