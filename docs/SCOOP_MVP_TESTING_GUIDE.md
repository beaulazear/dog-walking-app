# Scoop MVP Testing Guide

**Last Updated:** February 19, 2026
**Status:** ✅ Backend Complete - Ready for Frontend Integration

---

## Overview

This guide explains how to populate test data for the Scoop MVP job board and test all the new features implemented.

---

## Quick Start

### 1. Populate Test Jobs

Create 25 realistic cleanup jobs across NYC with full MVP details:

```bash
rails test_data:populate_jobs
```

**Output:**
```
🧹 Populating test cleanup jobs with MVP details...
📍 Using poster: testing (Test Account)
🗑️  Deleted 25 existing test jobs
  ✅ #1: Times Square - $15.0 🐕💩 (4-8 piles) [north, east]
  ✅ #2: Central Park South - $20.0 🐕💩 (9+ piles) [north, south, east, west]
  ✅ #3: West Village - $18.0 🐕💩 + 🗑️ (1-3 piles + light litter) [south]
  ...
  ✅ #25: Washington Heights - $12.0 🐕💩 + 🗑️ (1-3 piles + light litter) [north]

🎉 Successfully created 25 test cleanup jobs!

📊 Job Type Breakdown:
   🐕💩 Poop only: 15
   🗑️  Litter only: 5
   🐕💩 + 🗑️ Both: 6

📍 Total open jobs: 25
```

### 2. Clear Test Jobs

Remove all test jobs to start fresh:

```bash
rails test_data:clear_test_jobs
```

---

## What Gets Created

Each test job includes **all MVP fields**:

### Required Fields
- ✅ **latitude/longitude** - Realistic NYC coordinates
- ✅ **address** - Full neighborhood address
- ✅ **price** - Range: $12-$25
- ✅ **job_type** - "poop", "litter", or "both"
- ✅ **segments_selected** - Array of block segments (north/south/east/west)

### Job Type Specific Fields
- ✅ **poop_itemization** - "1-3", "4-8", or "9+" (for poop/both jobs)
- ✅ **litter_itemization** - "light", "moderate", or "heavy" (for litter/both jobs)

### Automatic Fields
- ✅ **status** - "open"
- ✅ **poster_id** - First user in database
- ✅ **job_expires_at** - 24 hours from creation
- ✅ **note** - "Test cleanup job - auto-generated"

---

## Testing the API

### 1. Get All Jobs

```bash
curl http://localhost:3000/cleanup_jobs
```

**Response includes:**
```json
{
  "jobs": [
    {
      "id": 1,
      "latitude": 40.758,
      "longitude": -73.9855,
      "address": "Times Square, New York, NY",
      "price": 15.0,
      "job_type": "poop",
      "poop_itemization": "4-8",
      "litter_itemization": null,
      "segments_selected": ["north", "east"],
      "status": "open",
      "poster_name": "Test Account",
      "scooper_id": null,
      "before_photos": [],
      "after_photos": []
    }
  ],
  "pagination": {
    "current_page": 1,
    "per_page": 50,
    "total_count": 25,
    "total_pages": 1
  }
}
```

### 2. Filter by Job Type

Get only poop cleanup jobs:
```bash
curl "http://localhost:3000/cleanup_jobs?job_type=poop"
```

Get only litter cleanup jobs:
```bash
curl "http://localhost:3000/cleanup_jobs?job_type=litter"
```

Get both-type jobs:
```bash
curl "http://localhost:3000/cleanup_jobs?job_type=both"
```

### 3. Find Nearby Jobs

Get jobs within 0.5 miles of Times Square:
```bash
curl "http://localhost:3000/cleanup_jobs?latitude=40.758&longitude=-73.9855&radius=0.5"
```

### 4. Filter by Just Posted

Get jobs posted in the last hour:
```bash
curl "http://localhost:3000/cleanup_jobs?just_posted=true"
```

### 5. Sort by Highest Pay

```bash
curl "http://localhost:3000/cleanup_jobs?sort=highest_pay"
```

### 6. Combine Filters

Get nearby poop jobs, highest pay first:
```bash
curl "http://localhost:3000/cleanup_jobs?latitude=40.758&longitude=-73.9855&job_type=poop&sort=highest_pay"
```

---

## Real-Time Features Testing

### 1. Start Sidekiq (Background Jobs)

Required for timer jobs and auto-expiration:

```bash
bundle exec sidekiq
```

### 2. Test Timer Jobs

**24-hour expiration:**
- Create a job
- Wait 24 hours (or modify job_expires_at in console)
- JobExpirationJob marks it as "expired"

**60-minute arrival timer:**
- Claim a job
- Wait 60 minutes without starting
- ArrivalTimerJob releases the scooper, job returns to "open"

**2-hour confirmation timeout:**
- Complete a job
- Wait 2 hours without poster confirming
- ConfirmationTimeoutJob auto-confirms, marks as "confirmed"

### 3. Test Push Notifications

Register a device token:
```bash
curl -X POST http://localhost:3000/users/register_device \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "device_token": "test_device_token_123",
    "device_platform": "ios"
  }'
```

All job actions (claim, start, complete, confirm) now trigger notifications. Check Rails logs for notification output:
```
📲 [NOTIFICATION] To: John Doe (ios)
   Title: Job Claimed
   Body: Jane Smith has claimed your cleanup job at Times Square!
```

### 4. Test WebSocket Connections

Connect to Action Cable:
```javascript
const cable = ActionCable.createConsumer('ws://localhost:3000/cable?token=YOUR_JWT');

// Subscribe to job board updates
const boardChannel = cable.subscriptions.create('JobBoardChannel', {
  received(data) {
    console.log('New job or update:', data);
  }
});

// Subscribe to specific job updates
const jobChannel = cable.subscriptions.create(
  { channel: 'CleanupJobChannel', job_id: 1 },
  {
    received(data) {
      console.log('Job status update:', data);
    },
    updateLocation(lat, lng) {
      this.perform('update_location', { latitude: lat, longitude: lng });
    }
  }
);
```

---

## Data Distribution

The rake task creates realistic variety:

### Job Types
- **60% Poop only** (15 jobs) - Most common
- **20% Litter only** (5 jobs)
- **20% Both types** (5 jobs) - Highest pay

### Poop Amounts
- **1-3 piles** - Quick jobs, lower pay
- **4-8 piles** - Standard jobs
- **9+ piles** - Large jobs, higher pay

### Litter Levels
- **Light** - Basic cleanup
- **Moderate** - More work needed
- **Heavy** - Significant cleanup required

### Segment Coverage
- **Single segment** - Focused cleanup
- **Two segments** - Most common
- **Three segments** - Moderate coverage
- **All four segments** - Full block coverage (highest pay)

### Price Range
- **$12-14** - Small jobs, outer areas
- **$15-19** - Standard jobs, mid-range areas
- **$20-25** - Premium jobs, central Manhattan, or both-type

---

## Console Testing

Useful Rails console commands:

```ruby
# Get breakdown of job types
CleanupJob.poop_only.count    # => 15
CleanupJob.litter_only.count  # => 5
CleanupJob.both_types.count   # => 5

# Find jobs by itemization
CleanupJob.where(poop_itemization: "9+")
CleanupJob.where(litter_itemization: "heavy")

# Find jobs by segment
CleanupJob.where("'north' = ANY(segments_selected)")

# Test nearby search
jobs = CleanupJob.nearby(40.758, -73.9855, 0.5)

# Simulate claiming a job
job = CleanupJob.first
job.update!(
  scooper_id: User.second.id,
  status: "claimed",
  claimed_at: Time.current
)

# Test cancellation fee calculation
job.calculate_cancellation_fee(job.poster)  # => 0.0 (no scooper)
job.update!(scooper_id: User.second.id)
job.calculate_cancellation_fee(job.poster)  # => 3.0 (20% of $15)
```

---

## Troubleshooting

### Jobs Not Expiring
- Make sure Sidekiq is running: `bundle exec sidekiq`
- Check Sidekiq queue: `Sidekiq::Queue.new.size`
- Check Redis connection: `redis-cli ping`

### Validation Errors
```
ActiveRecord::RecordInvalid: Validation failed: Poop itemization is not included in the list
```
- Make sure poop jobs have poop_itemization
- Make sure litter jobs have litter_itemization
- Make sure "both" jobs have both itemizations

### Empty Segments
```
Validation failed: Segments selected must select at least one segment
```
- segments_selected must be an array with at least one valid segment
- Valid segments: "north", "south", "east", "west"

---

## Production Deployment

Before deploying to production:

1. ✅ Set `REDIS_URL` environment variable on Render
2. ✅ Enable Sidekiq worker on Render (add to `render.yaml`)
3. ✅ Don't run `test_data:populate_jobs` in production
4. ✅ Set up FCM/APNs credentials for real push notifications

---

## Next Steps

1. **Frontend Integration** - Connect React Native app to these endpoints
2. **Stripe Integration** - Add payment processing (last step)
3. **Photo Uploads** - Test before/after photo functionality
4. **Real Device Testing** - Test push notifications on iOS/Android

---

**Questions?** Check `SCOOP_BACKEND_SUMMARY.md` for complete API documentation.
