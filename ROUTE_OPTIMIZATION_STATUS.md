# Route Optimization - Current Status & Goals

## Last Updated
November 10, 2025

## Current Implementation Status

### ✅ What's Working
- Route optimizer fetches only active appointments (filters out canceled/completed)
- Dogs are picked up in optimized TSP order (minimizes travel distance)
- Dogs walk together simultaneously as a group (maximizing income)
- Dogs are dropped off as their individual walk durations complete
- Frontend displays timeline with proper timing calculations
- Graceful fallback for profile photos (shows dog placeholder on error)

### 🎯 Ideal End Goal

**The Perfect Route Optimization Should:**

1. **Group dogs strategically for maximum profit**
   - Walk multiple dogs together during overlapping time periods
   - Pick up a 60-min dog, then grab 1-2 dogs with 30-min walks before the first dog needs to be dropped off
   - Allow flexible timing (±10 minutes) to optimize groupings

2. **Example Ideal Schedule:**
   ```
   10:00 AM - Pick up Dog A (needs 60 min walk)
   10:05 AM - Pick up Dog B (needs 30 min walk)
   10:10 AM - Pick up Dog C (needs 30 min walk)

   [GROUP WALK STARTS - all 3 dogs walking together]

   10:10-10:40 AM - All 3 dogs walk together (30 minutes)
   10:40 AM - Drop off Dog B ✓ (got their 30 min)
   10:42 AM - Drop off Dog C ✓ (got their 30 min)

   10:42-11:00 AM - Continue walking Dog A alone (18 more minutes)
   11:00 AM - Drop off Dog A ✓ (got their 60 min total: 30 group + 30 solo)
   ```

3. **Key Principles:**
   - Dogs walk **TOGETHER simultaneously** (not one after another)
   - Maximize time with multiple dogs to maximize income
   - Respect pickup windows (start_time to end_time)
   - Allow ±10 minute flexibility on walk durations
   - Minimize total travel distance between pickups/dropoffs

---

## Technical Implementation

### Backend Architecture

**Location:** `app/services/route_optimizer_service.rb`

**Key Methods:**

1. **`optimize_route(appointments, start_location: nil)`**
   - Entry point for route optimization
   - Filters to geocoded appointments only
   - Categorizes into groups and solo walks
   - Returns optimized route with stops, distance, time

2. **`categorize_appointments(appointments)`**
   - Separates manual groups (with `walk_group_id`)
   - Identifies true solo walks (`walk_type: 'solo'`)
   - Auto-groups remaining appointments by proximity and time overlap

3. **`build_group_route_stops(group_appointments, start_location)`**
   - **Phase 1:** All pickups (5 min each, optimized TSP order)
   - **Phase 2:** Group walk starts after last pickup
   - **Phase 3:** Dropoffs as each dog's walk completes (sorted by duration)

**Important Logic:**
```ruby
# Dogs walk TOGETHER starting from group_walk_start_time
group_walk_start_time = time_after_all_pickups

# Each dog drops off when their walk completes
dropoff_time = group_walk_start_time + dog.duration
```

### Frontend Display

**Location:** `client/src/components/WalksMapView.js`

**Key Logic (lines 301-400):**
- Tracks `groupWalkStartTimes` for each walk_group_id
- Detects last pickup in group → marks group walk start
- Calculates dropoff timing: `groupWalkStart + dog.duration`
- Displays timeline with arrival times for each stop

---

## Current Known Issues & Future Improvements

### 🐛 Potential Issues to Watch

1. **No Caching**
   - Routes are calculated on-the-fly every time
   - Could cause timeouts with many appointments
   - **Future:** Add caching table to store optimized routes

2. **Auto-Grouping Logic**
   - Currently auto-groups by proximity (0.5 mile) and time overlap
   - May group dogs that shouldn't walk together
   - **Future:** Add constraints (dog compatibility, energy levels)

3. **Timing Flexibility**
   - Currently uses exact durations (30, 45, 60 min)
   - No ±10 minute flexibility implemented yet
   - **Future:** Add flexible duration ranges

4. **Multiple Groups Per Day**
   - If you have 2+ separate groups in different areas
   - Need to optimize order of groups themselves
   - **Future:** Implement multi-group routing

---

## How the Algorithm Works (Step by Step)

### 1. Data Collection
```ruby
# Controller filters appointments for date
recurring_appointments = user.appointments
  .where(recurring: true)
  .where(day_of_week => true)
  .where(canceled: [false, nil])
  .where(completed: [false, nil])

non_recurring_appointments = user.appointments
  .where(recurring: false)
  .where('DATE(appointment_date) = ?', date)
  .where(canceled: [false, nil])
  .where(completed: [false, nil])
```

### 2. Categorization
- **Manual Groups:** Appointments with `walk_group_id` set
- **Solo Walks:** Appointments with `walk_type: 'solo'`
- **Auto-Grouped:** Remaining appointments grouped by proximity/time

### 3. Route Building
For each group:

**Step 1: Optimize pickup order (TSP)**
```ruby
pickup_order = optimize_appointment_order(group_appointments, start_location)
# Uses nearest-neighbor algorithm to minimize travel
```

**Step 2: Create pickup stops**
```ruby
pickup_order.each_with_index do |appt, index|
  # Add pickup stop
  # Track pickup_time for this dog
  current_time += 5 # 5 min per pickup
end

group_walk_start_time = current_time # After all pickups
```

**Step 3: Calculate dropoff schedule**
```ruby
dropoff_schedule = pickup_order.map do |appt|
  dropoff_time = group_walk_start_time + appt.duration
  # Dogs dropped off when their walk completes
end.sort_by { |d| d[:dropoff_time] } # Shortest walks first
```

### 4. Frontend Timing Display
```javascript
// Detect when group walk starts (after last pickup)
if (isLastPickup) {
  groupWalkStartTimes[walk_group_id] = currentTime + 5min
}

// Calculate dropoff times from group walk start
if (stop.stop_type === 'dropoff') {
  targetDropoffTime = groupWalkStartTime + walkDuration
}
```

---

## API Endpoints

### POST `/routes/optimize`
Optimizes route for a given date.

**Request:**
```json
{
  "date": "2025-11-10",
  "compare": true
}
```

**Response:**
```json
{
  "route": [
    {
      "id": "123_pickup",
      "appointment_id": 123,
      "pet_name": "Buddy",
      "address": "123 Main St",
      "stop_type": "pickup",
      "coordinates": { "lat": 40.7128, "lng": -74.0060 },
      "start_time": "10:00",
      "duration": 60,
      "walk_group_id": "temp_group_123"
    },
    // ... more stops
  ],
  "total_distance": 5.2,
  "total_travel_time": 104,
  "total_walk_time": 180,
  "total_time": 284,
  "path_coordinates": [...],
  "comparison": {
    "original_distance": 7.8,
    "distance_saved": 2.6,
    "improvement_percent": 33.3
  }
}
```

---

## Debugging Guide

### Common Issues

**1. Route shows old/canceled appointments**
- **Check:** `routes_controller.rb` lines 26-38
- **Verify:** Filters include `.where(canceled: [false, nil])` and `.where(completed: [false, nil])`

**2. All pickups first, then all dropoffs (wrong!)**
- **Check:** `route_optimizer_service.rb` lines 397-480
- **Verify:** Uses group_walk_start_time logic, not individual pickup times

**3. Timing is off in frontend**
- **Check:** `WalksMapView.js` lines 301-400
- **Verify:** `groupWalkStartTimes` is being set and used correctly

**4. Dogs not being auto-grouped**
- **Check:** `route_optimizer_service.rb` lines 76-120
- **Verify:** Proximity threshold (0.5 miles) and time window overlap logic

### Useful Log Messages

Backend logs show:
```
=== Appointment Categorization ===
Manual groups: X groups, Y appointments
True solo walks: Z
Ungrouped group walks: W
Starting auto-grouping...
Auto-grouped N appointments: [Pet names]
Created M auto-groups from ungrouped appointments

=== Building group route for N appointments ===
Pickup order has N appointments
All pickups complete at time X. Group walk starts.
Group walk duration: Y minutes
Stop sequence: Pet1-pickup → Pet2-pickup → Pet1-dropoff → Pet2-dropoff
```

### Testing Checklist

- [ ] No canceled appointments in route
- [ ] No completed appointments in route
- [ ] All pickups happen before any dropoffs for a group
- [ ] Dogs with shorter walks dropped off before longer walks
- [ ] Group walk duration = longest dog's duration
- [ ] Timeline shows logical progression
- [ ] Travel distances are reasonable

---

## Files Modified in This Implementation

### Backend
- `app/controllers/routes_controller.rb` - Added filters for canceled/completed
- `app/services/route_optimizer_service.rb` - Complete rewrite for simultaneous walks

### Frontend
- `client/src/components/WalksMapView.js` - Updated timing calculations
- `client/src/components/Profile.js` - Added photo fallback
- `client/src/components/Dashboard.js` - Added photo fallback

---

## Future Enhancement Ideas

### High Priority
1. **Add caching** - Store optimized routes to avoid recalculation
2. **Flexible durations** - Allow ±10 min adjustments for better grouping
3. **Manual override** - Let user manually reorder stops if needed

### Medium Priority
4. **Multi-group optimization** - Optimize order when multiple groups exist
5. **Dog compatibility** - Don't group dogs that shouldn't walk together
6. **Weather integration** - Adjust walk times based on conditions
7. **Real-time tracking** - Update route as walks are completed

### Low Priority
8. **Route history** - Track which routes were most efficient
9. **Predictive optimization** - Learn patterns over time
10. **Client preferences** - Honor client-specific timing preferences

---

## Key Takeaways

✅ **Dogs walk TOGETHER simultaneously** - Not one after another
✅ **Maximize multi-dog time** - More dogs = more income
✅ **Drop off as walks complete** - From group walk start time
✅ **Flexible timing** - ±10 min is acceptable for optimization

🎯 **Goal:** Walk as many dogs together as possible while respecting individual walk durations

---

## Questions for Future Consideration

1. Should we limit max dogs per group? (safety/manageability)
2. How do we handle dogs with special needs (reactive, etc.)?
3. Should pickup windows be strictly enforced or flexible?
4. What happens if actual walk times differ from scheduled?
5. How do we optimize across multiple separate groups in a day?

---

## Contact & Debugging

If route optimization isn't working as expected:

1. Check Render logs for errors: https://dashboard.render.com
2. Review commit history: `git log --grep="route optim" --oneline`
3. Test locally: `rails s` and check console logs
4. Reference this document for expected behavior

**Last major changes:** November 10, 2025 - Redesigned for simultaneous group walking
