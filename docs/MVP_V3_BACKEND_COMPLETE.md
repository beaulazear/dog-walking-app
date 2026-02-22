# MVP v3 Backend - Complete Reference
**Last Updated:** February 22, 2026
**Status:** ✅ COMPLETE & TESTED

---

## Overview

The MVP v3 backend implements a **block sponsorship system** where sponsors pay monthly for recurring cleanup of specific blocks, dog walkers claim and maintain those blocks, and neighbors can contribute to reduce costs.

This is **separate** from the existing one-off cleanup jobs system.

---

## Architecture

### Two Parallel Systems

1. **One-Off Cleanup Jobs** (`/cleanup_jobs`)
   - Instant, one-time cleanup requests
   - Poster pays per job ($10-$30)
   - First-tap-wins claiming
   - Complete once and done

2. **Block Sponsorships** (`/api/sponsorships`) ⭐ NEW
   - Recurring subscription model
   - Sponsor pays monthly ($48/month for weekly, $24/month for biweekly)
   - Dog walker maintains a block on a schedule
   - Neighbors can contribute to reduce sponsor cost
   - Monthly ratings for accountability

---

## Database Schema

### Sponsorships Table
**Purpose:** Core block sponsorship records

```ruby
create_table :sponsorships do |t|
  # Relationships
  t.references :sponsor, foreign_key: { to_table: :users }, null: false
  t.references :scooper, foreign_key: { to_table: :users }

  # Location
  t.decimal :latitude, precision: 10, scale: 6, null: false
  t.decimal :longitude, precision: 10, scale: 6, null: false
  t.string :block_id, null: false # e.g., "BK-40.6782--73.9442"
  t.text :segments_selected, array: true, default: [] # ['NW', 'NE', 'SW', 'SE']

  # Sponsorship details
  t.string :schedule, null: false # 'weekly' or 'biweekly'
  t.decimal :monthly_budget, precision: 8, scale: 2, null: false
  t.string :display_preference, null: false # 'first_name', 'business', 'anonymous'
  t.string :display_name

  # Status
  t.string :status, default: 'open' # 'open', 'claimed', 'active', 'paused', 'cancelled'
  t.datetime :claimed_at
  t.datetime :started_at # When first sweep was completed

  # Payment
  t.string :stripe_subscription_id
  t.decimal :current_monthly_cost, precision: 8, scale: 2

  # Stats
  t.integer :total_pickups, default: 0
  t.integer :pickups_this_month, default: 0
  t.integer :contributor_count, default: 0

  t.timestamps
end
```

**Columns (21):**
- block_id, claimed_at, contributor_count, created_at, current_monthly_cost
- display_name, display_preference, id, latitude, longitude, monthly_budget
- pickups_this_month, schedule, scooper_id, segments_selected, sponsor_id
- started_at, status, stripe_subscription_id, total_pickups, updated_at

---

### Sweeps Table
**Purpose:** GPS-verified maintenance sweep logs

```ruby
create_table :sweeps do |t|
  t.references :sponsorship, foreign_key: true, null: false
  t.references :scooper, foreign_key: { to_table: :users }, null: false

  # GPS verification
  t.decimal :arrival_latitude, precision: 10, scale: 6
  t.decimal :arrival_longitude, precision: 10, scale: 6
  t.datetime :arrived_at

  # Completion data
  t.integer :pickup_count, default: 0
  t.string :after_photo_url
  t.text :notes
  t.boolean :litter_flagged, default: false
  t.boolean :gps_verified, default: false # Added later

  # Status
  t.string :status, default: 'scheduled' # 'scheduled', 'in_progress', 'completed'
  t.datetime :completed_at

  # Payment
  t.decimal :payout_amount, precision: 8, scale: 2
  t.string :stripe_payout_id

  t.timestamps
end
```

**Columns (17):**
- after_photo_url, arrival_latitude, arrival_longitude, arrived_at
- completed_at, created_at, gps_verified, id, litter_flagged, notes
- payout_amount, pickup_count, scooper_id, sponsorship_id
- status, stripe_payout_id, updated_at

---

### Contributions Table
**Purpose:** Neighbor monthly contributions to reduce sponsor cost

```ruby
create_table :contributions do |t|
  t.references :sponsorship, foreign_key: true, null: false
  t.references :contributor, foreign_key: { to_table: :users }, null: false

  t.decimal :monthly_amount, precision: 8, scale: 2, null: false
  t.string :stripe_subscription_id
  t.string :status, default: 'active' # 'active', 'cancelled'

  t.timestamps
end
```

**Columns (8):**
- contributor_id, created_at, id, monthly_amount
- sponsorship_id, status, stripe_subscription_id, updated_at

---

### SponsorshipRatings Table
**Purpose:** Monthly feedback from sponsors to dog walkers

```ruby
create_table :sponsorship_ratings do |t|
  t.references :sponsorship, foreign_key: true, null: false
  t.references :sponsor, foreign_key: { to_table: :users }, null: false
  t.references :scooper, foreign_key: { to_table: :users }, null: false

  t.date :month, null: false # First day of the month being rated

  # Category ratings (1-5 stars each)
  t.integer :quality_rating
  t.integer :thoroughness_rating
  t.integer :timeliness_rating
  t.integer :communication_rating

  t.decimal :overall_rating, precision: 3, scale: 2
  t.text :review_text

  t.timestamps
end

add_index :sponsorship_ratings, [:sponsorship_id, :month], unique: true
```

**Columns (13):**
- communication_rating, created_at, id, month, overall_rating
- quality_rating, review_text, scooper_id, sponsor_id, sponsorship_id
- thoroughness_rating, timeliness_rating, updated_at

**Constraints:**
- Unique index on `[sponsorship_id, month]` prevents duplicate ratings

---

### Users Table (MVP v3 additions)

```ruby
# Added to existing users table:
add_column :users, :is_poster, :boolean, default: false, null: false
add_column :users, :is_dog_walker, :boolean, default: false, null: false
add_column :users, :instagram_handle, :string
add_column :users, :neighborhoods, :text, array: true, default: []
add_column :users, :business_name, :string
add_column :users, :profile_photo_url, :string
add_column :users, :overall_rating, :decimal, precision: 3, scale: 2, default: 0.0
add_column :users, :total_pickups, :integer, default: 0
```

**User Types:**
- Users can be **both** poster and dog walker simultaneously
- `is_poster` - can create cleanup jobs & sponsorships
- `is_dog_walker` - can claim jobs & sponsorships as scooper

---

## API Endpoints

### Public Map (NO AUTH REQUIRED)

```
GET /api/map/stats?lat=40.6782&lng=-73.9442
```
Returns neighborhood stats for map ticker
- sponsored_blocks count
- pickups_this_month total
- open_jobs count

```
GET /api/map/blocks/:block_id
```
Returns detailed block information
- Sponsorship details if active
- Scooper public profile
- Recent completed jobs

```
GET /api/map/neighborhoods
```
Returns list of all neighborhoods

---

### Sponsorships

```
GET /api/sponsorships
```
**Query params:**
- `?status=open` - filter by status
- `?my_sponsorships=true` - sponsorships I created (requires auth)
- `?my_claimed=true` - sponsorships I claimed as scooper (requires auth)

```
GET /api/sponsorships/:id
```
Show detailed sponsorship info

```
POST /api/sponsorships
```
Create new block sponsorship (poster only)

**Required params:**
```json
{
  "latitude": 40.6782,
  "longitude": -73.9442,
  "segments_selected": ["NW", "NE", "SW", "SE"],
  "schedule": "weekly", // or "biweekly"
  "monthly_budget": 48.00,
  "display_preference": "first_name" // or "business", "anonymous"
}
```

```
POST /api/sponsorships/:id/claim
```
Dog walker claims sponsorship (first-tap-wins with database lock)

```
POST /api/sponsorships/:id/pause
```
Sponsor pauses active sponsorship

```
POST /api/sponsorships/:id/resume
```
Sponsor resumes paused sponsorship

```
POST /api/sponsorships/:id/cancel
```
Sponsor cancels sponsorship

---

### Sweeps (nested under sponsorships)

```
GET /api/sponsorships/:sponsorship_id/sweeps
```
List all sweeps for this block

```
POST /api/sponsorships/:sponsorship_id/sweeps
```
Log a completed sweep (requires GPS verification)

**Required params:**
```json
{
  "arrival_latitude": 40.6782,
  "arrival_longitude": -73.9442,
  "pickup_count": 5,
  "notes": "Found some litter too"
}
```

**GPS Verification:**
- Validates location is within ~150m of block center
- Sets `gps_verified` flag automatically
- Rejects if too far from block

---

### Contributions (neighbor support)

```
GET /api/sponsorships/:sponsorship_id/contributions
```
See who's contributing to this block

```
POST /api/sponsorships/:sponsorship_id/contributions
```
Add monthly contribution (creates User as contributor)

**Required params:**
```json
{
  "monthly_amount": 10.00
}
```

```
DELETE /api/sponsorships/:sponsorship_id/contributions/:id
```
Cancel contribution

---

### Ratings (monthly feedback)

```
GET /api/sponsorships/:sponsorship_id/ratings
```
See past ratings for this sponsorship

```
POST /api/sponsorships/:sponsorship_id/ratings
```
Rate this month's service

**Required params:**
```json
{
  "month": "2026-02-01",
  "quality_rating": 5,
  "thoroughness_rating": 5,
  "timeliness_rating": 4,
  "communication_rating": 5,
  "review_text": "Great job!"
}
```

**Constraints:**
- One rating per month per sponsorship (database enforced)
- `overall_rating` auto-calculated from 4 category ratings

---

### User Role Toggle

```
PATCH /users/toggle_roles
```
Toggle between poster and dog walker roles

**Params:**
```json
{
  "is_poster": true,
  "is_dog_walker": true,
  "instagram_handle": "@myhandle",
  "business_name": "My Business",
  "neighborhoods": ["Park Slope", "Prospect Heights"]
}
```

**Benefits:**
- Users can be both poster AND dog walker
- Easy testing - toggle roles on the fly
- No restrictions - toggle freely

---

## Business Logic

### Payment Calculations

**Per-Sweep Amount:**
```ruby
sweeps_per_month = schedule == "weekly" ? 4 : 2
per_sweep_amount = monthly_budget / sweeps_per_month
```

**Scooper Payout (82%):**
```ruby
scooper_payout = per_sweep_amount * 0.82
```

**Platform Fee (18%):**
```ruby
platform_fee = per_sweep_amount * 0.18
```

**Sponsor Cost (after contributions):**
```ruby
cost = monthly_budget - total_contributions
sponsor_cost = [cost, 0].max  # Never goes below $0
```

**Example:**
- Monthly budget: $48
- Schedule: weekly (4 sweeps/month)
- Per-sweep: $12
- Scooper gets: $9.84 (82%)
- Platform keeps: $2.16 (18%)

---

### Status State Machine

**Sponsorship States:**
1. `open` - Available for dog walkers to claim
2. `claimed` - Dog walker claimed, not started yet
3. `active` - First sweep completed, recurring maintenance
4. `paused` - Sponsor temporarily paused
5. `cancelled` - Sponsorship terminated

**Transitions:**
```
open -> claimed (via claim!)
claimed -> active (first sweep completion triggers this)
active -> paused (via pause!)
paused -> active (via resume!)
any -> cancelled (via cancel!)
```

---

### GPS Verification

**Sweep Location Validation:**
```ruby
lat_diff = (arrival_latitude - sponsorship.latitude).abs
lng_diff = (arrival_longitude - sponsorship.longitude).abs
max_tolerance = 0.0015  # ~150 meters

if lat_diff > max_tolerance || lng_diff > max_tolerance
  errors.add(:base, "GPS location is too far from the sponsored block")
  self.gps_verified = false
else
  self.gps_verified = true
end
```

---

### First-Tap-Wins Protection

**Database-level locking:**
```ruby
ActiveRecord::Base.transaction do
  sponsorship = Sponsorship.lock.find(params[:id])

  if sponsorship.status != "open"
    return { error: "Sponsorship already claimed" }
  end

  sponsorship.claim!(current_user)
end
```

Prevents race conditions when multiple dog walkers try to claim simultaneously.

---

## Models & Methods

### Sponsorship Model

**Key Methods:**
- `claim!(scooper)` - Dog walker claims sponsorship
- `activate!` - Transition from claimed to active
- `pause!` - Pause active sponsorship
- `resume!` - Resume paused sponsorship
- `cancel!` - Cancel sponsorship
- `record_sweep(sweep)` - Update stats when sweep completed
- `clean_since` - Returns started_at date
- `per_sweep_amount` - Calculate per-sweep payment
- `scooper_payout_per_sweep` - 82% of per-sweep
- `platform_fee_per_sweep` - 18% of per-sweep
- `calculate_sponsor_cost` - Budget minus contributions (never below $0)
- `scooper_public_profile` - Dog walker's public info

**Scopes:**
- `Sponsorship.open` - status = 'open'
- `Sponsorship.claimed` - status = 'claimed'
- `Sponsorship.active` - status = 'active'
- `Sponsorship.paused` - status = 'paused'

**Associations:**
- `belongs_to :sponsor` (User)
- `belongs_to :scooper` (User, optional)
- `has_many :sweeps, dependent: :destroy`
- `has_many :contributions, dependent: :destroy`
- `has_many :sponsorship_ratings, dependent: :destroy`

---

### Sweep Model

**Key Methods:**
- `completed?` - Returns true if status == 'completed'
- `complete!(params)` - Mark sweep as completed
- `after_photo_url` - Generate S3 URL for photo

**GPS Validation:**
- `gps_within_block_boundaries` - Validates on create

**Callbacks:**
- `before_create :calculate_payout` - Auto-set payout amount
- `after_create :update_sponsorship_stats, if: :completed?` - Update sponsor stats

**Associations:**
- `belongs_to :sponsorship`
- `belongs_to :scooper` (User)
- `has_one_attached :after_photo`

---

### Contribution Model

**Callbacks:**
- `after_create :update_sponsorship_contributor_count`
- `after_update :update_sponsorship_contributor_count, if: :saved_change_to_status?`

**Scopes:**
- `Contribution.active` - status = 'active'

**Associations:**
- `belongs_to :sponsorship`
- `belongs_to :contributor` (User)

---

### SponsorshipRating Model

**Auto-calculations:**
- `before_save :calculate_overall_rating` - Average of 4 categories
- `after_save :update_scooper_overall_rating` - Update dog walker's rating

**Validations:**
- `validates :month, uniqueness: { scope: :sponsorship_id }` - One rating per month

**Associations:**
- `belongs_to :sponsorship`
- `belongs_to :sponsor` (User)
- `belongs_to :scooper` (User)

---

### User Model (additions)

**Key Methods:**
- `public_profile` - Public info for dog walkers
- `calculate_overall_rating` - Average job + sponsorship ratings
- `update_overall_rating!` - Recalculate and save

**New Associations:**
- `has_many :sponsorships_as_sponsor`
- `has_many :sponsorships_as_scooper`
- `has_many :sweeps`
- `has_many :contributions_as_contributor`
- `has_many :sponsorship_ratings_given` (as sponsor)
- `has_many :sponsorship_ratings_received` (as scooper)

---

## Rake Tasks

### Test Data Generation

```bash
rails test_data:create_sponsorships
```
Creates comprehensive test data:
- 10 sponsorships across Brooklyn neighborhoods
- 3 test dog walkers
- 2-8 completed sweeps per active sponsorship
- Random contributions (30% chance)
- Random monthly ratings (40% chance)
- Mix of statuses (open, claimed, active, paused)

```bash
rails test_data:clear_sponsorships
```
Removes all test sponsorships and related data

---

### Monthly Maintenance

```bash
rails sponsorships:reset_monthly_stats
```
**Run:** 1st of each month at midnight
Resets `pickups_this_month` counter for all active sponsorships

```bash
rails sponsorships:send_rating_reminders
```
**Run:** 1st of each month
Sends reminders to sponsors who haven't rated last month

```bash
rails sponsorships:update_scooper_ratings
```
**Run:** Daily or weekly
Recalculates overall ratings for all dog walkers

**Cron Setup (Render.com):**
See `docs/MONTHLY_CRON_SETUP.md`

---

## Testing

### Comprehensive Tests Run

All functionality verified:
- ✅ Database schema correct
- ✅ All models save/update correctly
- ✅ Sponsorship state transitions work
- ✅ First-tap-wins locking prevents double claims
- ✅ GPS verification validates locations
- ✅ Payment calculations correct (82/18 split)
- ✅ Contribution math works (never below $0)
- ✅ Monthly rating uniqueness enforced
- ✅ Cascade deletes work properly
- ✅ Rake tasks generate valid test data

**Test Results:**
```
✓ Created sponsor
✓ Created scooper
✓ Created sponsorship
✓ Claimed sponsorship
✓ Activated sponsorship
✓ Created sweep (pickups: 5)
  → Sponsorship now has 5 total pickups
✓ Created contribution ($10/mo)
  → Sponsorship cost: $38 (was $48) ✅
✓ Created rating (overall: 4.75)

✅ ALL TESTS PASSED
```

---

## Issues Fixed During Implementation

1. ✅ Segment names: NW/NE/SW/SE (not north/south/east/west)
2. ✅ Display preference: first_name (not name)
3. ✅ Removed clean_since column reference (it's a method)
4. ✅ Removed scheduled_date (use arrived_at)
5. ✅ Fixed Contribution to use contributor_id (User reference)
6. ✅ Fixed SponsorshipRating: review_text (not notes) + required references
7. ✅ Added missing completed? method to Sweep
8. ✅ Removed last_sweep_at reference (column doesn't exist)
9. ✅ Changed delete_all to destroy_all for cascade
10. ✅ Removed paused_at and cancelled_at (columns don't exist)
11. ✅ Added missing paused scope to Sponsorship

---

## What's NOT Implemented Yet

### Stripe Integration (Deferred)
- Payment processing for sponsorships
- Contribution subscriptions
- Scooper payouts
- Connect onboarding

### Push Notifications (Deferred)
- New sponsorship alerts
- Sweep completion notifications
- Monthly rating reminders
- Contribution notifications

### ActionCable Real-Time (Optional)
- Live map updates
- WebSocket broadcasting

---

## Frontend Integration

The backend is **fully functional** and ready for frontend development.

**Next Steps:**
1. Implement sponsorship creation UI
2. Build dog walker claiming flow
3. Create sweep logging with GPS
4. Add contribution payment flow
5. Build monthly rating interface
6. Display public map with sponsored blocks

**Testing Credentials:**
- Sponsor: `beau09946@gmail.com` / `password123`
- Dog Walkers:
  - `walker1@test.com` / `password123` (Sarah Chen)
  - `walker2@test.com` / `password123` (Mike Rodriguez)
  - `walker3@test.com` / `password123` (Lisa Park)

---

## Production Deployment Status

**Environment:** Render.com
**Latest Deploy:** February 22, 2026
**Status:** ✅ Live and tested

**Database Migrations:** All applied successfully
**Test Data:** Available via rake task
**API Endpoints:** All functional

---

## Contact & Support

For questions about the backend implementation:
- Check this documentation first
- Review the session summary in chat history
- Test with `rails test_data:create_sponsorships`

**Last Session:** February 22, 2026
