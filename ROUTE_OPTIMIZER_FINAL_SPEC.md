# Route Optimizer - Final Specification (Nov 11, 2025)

## Critical Understanding: How Walk Time Works

**Walk time = TOTAL time from when pickup STARTS until dropoff completes**

### Example Timeline:
```
11:00:00 - Start picking up Dog A (TIMER STARTS)
11:05:00 - Done picking up, start walking (5 min elapsed)
11:15:00 - Arrive at Dog B's house (15 min elapsed for Dog A)
11:20:00 - Done picking up Dog B (20 min elapsed for Dog A, 0 min for Dog B)
11:35:00 - Arrive at Dog A's dropoff (35 min elapsed for Dog A, 15 min for Dog B)
11:37:00 - Done dropping off Dog A (37 min total walk time for Dog A)
```

**Walk time includes:**
✅ Pickup time (5 minutes)
✅ All travel time between locations
✅ Waiting time while picking up other dogs
✅ Waiting time while dropping off other dogs
✅ EVERYTHING from pickup start to dropoff completion

## Hard Constraints

### 1. Pickup Windows (HARD - Cannot Violate)
- Each dog has `start_time` and `end_time` for pickup
- **MUST pick up between start_time and end_time**
- Cannot pick up before window opens
- Cannot pick up after window closes
- Example: 10am-12pm window means can pick up at 10:00, 10:30, 11:45, but NOT at 9:55 or 12:05

### 2. Walk Duration Flexibility (±10 Minutes)
- Each dog has a target duration (30, 45, or 60 minutes)
- **Can walk between duration-10 and duration+10 minutes**
- Examples:
  - 30 min walk: acceptable range is 20-40 minutes
  - 45 min walk: acceptable range is 35-55 minutes
  - 60 min walk: acceptable range is 50-70 minutes

### 3. Maximum Pack Size
- **Max 4 dogs at once**
- Safety and manageability limit
- User will be able to configure this in future

### 4. Dynamic Time Awareness
- Route should be aware of current time
- **Morning (before first window):** Show full day's optimized route
- **Midday (some walks done):** Show optimized route for remaining walks only
- Filter out completed appointments automatically
- Start routing from current time or earliest available window

## Optimization Goal

**Minimize total route time** = Time from first pickup to last dropoff

**Not:** Minimize distance (though shorter distances help)
**Not:** Start all dogs at exact window start time
**Goal:** Finish the entire day's walks as quickly as possible

## The Algorithm (Constraint-Based Greedy)

### Initialization
```ruby
current_time = max(Time.current, earliest_pickup_window)
current_location = start_location || first_dog_location
remaining_dogs = all_incomplete_appointments
currently_walking = []
pickup_start_times = {} # Track when each dog's walk timer started
```

### Main Loop
```ruby
while remaining_dogs.any? || currently_walking.any?

  # 1. CHECK FOR OVERDUE DOGS (MUST drop off immediately)
  overdue_dogs = currently_walking.select do |dog|
    elapsed_time = current_time - pickup_start_times[dog.id]
    elapsed_time > (dog.duration + 10.minutes)
  end

  if overdue_dogs.any?
    # URGENT: Drop off immediately, no evaluation needed
    execute_dropoff(overdue_dogs.first)
    next
  end

  # 2. EVALUATE ALL POSSIBLE ACTIONS
  actions = []

  # OPTION A: Drop off dogs within acceptable range
  droppable_dogs = currently_walking.select do |dog|
    elapsed_time = current_time - pickup_start_times[dog.id]
    elapsed_time >= (dog.duration - 10.minutes) &&
    elapsed_time <= (dog.duration + 10.minutes)
  end

  droppable_dogs.each do |dog|
    cost = calculate_dropoff_cost(dog, current_state)
    actions << { type: :dropoff, dog: dog, cost: cost }
  end

  # OPTION B: Pick up dogs within their pickup window
  if currently_walking.length < 4 # Under max pack size
    pickupable_dogs = remaining_dogs.select do |dog|
      current_time >= dog.start_time &&
      current_time <= dog.end_time
    end

    # Evaluate top 3 closest pickupable dogs
    pickupable_dogs.sort_by { |dog| distance_to(dog) }.take(3).each do |dog|
      cost = calculate_pickup_cost(dog, current_state)
      actions << { type: :pickup, dog: dog, cost: cost }
    end
  end

  # 3. CHOOSE LOWEST COST ACTION
  break if actions.empty?
  best_action = actions.min_by { |a| a[:cost] }

  # 4. EXECUTE ACTION
  execute_action(best_action)
end
```

## Cost Calculation

### Dropoff Cost Factors:
```ruby
base_cost = travel_time_to_location

# Lower cost (better) if:
- Close to current location (short travel)
- Dog is at target duration (not too early/late)
- Other pickupable dogs are nearby this location
- Dropping off makes room for more dogs (pack size > 3)

# Higher cost (worse) if:
- Far from current location
- Dog still has significant walk time remaining
- No other opportunities nearby
```

### Pickup Cost Factors:
```ruby
base_cost = travel_time_to_location

# Lower cost (better) if:
- Close to current location
- Duration matches current pack (won't make dogs go over)
- Pickup window closing soon (urgency)
- Picking up allows chaining more dogs efficiently

# Higher cost (worse) if:
- Far from current location
- Would push current dogs over their time limit
- Duration very different from current pack
- Pack already at max capacity
```

## Smart Decision Examples

### Scenario 1: Should I drop off or pick up next?
```
Current state:
- Walking Dog A (45 min walk, walked 30 min so far)
- At location X

Options:
A) Drop off Dog A now (15 min to their house)
   → Dog A gets 45 min total ✓
   → Route time: +15 min dropoff

B) Pick up nearby Dog B first (5 min away, 30 min walk)
   → Pick up Dog B
   → Walk both
   → Drop off Dog A at 55 min (5 min over, acceptable)
   → Drop off Dog B at 30 min
   → Route time: Potentially faster if B and A dropoffs are near each other

Algorithm evaluates both costs and picks better option!
```

### Scenario 2: Window priority
```
Current time: 11:00am

Dog A: 10am-12pm window, 60 min walk, 2 miles away
Dog B: 11am-11:30am window, 30 min walk, 0.3 miles away

Even though A is closer to center of window, B's window is closing soon!
Should prioritize Dog B (window urgency) if it doesn't harm overall route.
```

### Scenario 3: Chaining opportunities
```
Drop off Dog A at location X

Nearby:
- Dog B (0.2 miles away, window open)
- Dog C (0.3 miles away, window open)

Higher priority to drop off at X because can immediately pick up B and C!
```

## Implementation Checklist

### Phase 1: Core Algorithm ✓ (Mostly Done)
- [x] Rolling pickup/dropoff system
- [x] Cost evaluation for actions
- [ ] Fix walk time tracking (currently broken - uses pickup_times instead of pickup_start_times)
- [ ] Fix cost calculation to consider walk duration constraints properly

### Phase 2: Constraint Enforcement (Needs Work)
- [ ] Enforce pickup window constraints (start_time to end_time)
- [ ] Enforce ±10 min walk duration flexibility
- [ ] Enforce max 4 dogs at once
- [ ] Handle overdue dogs (URGENT dropoff)

### Phase 3: Time Awareness (Not Implemented)
- [ ] Start from current time vs earliest window
- [ ] Filter completed appointments
- [ ] Dynamic re-routing during the day

### Phase 4: Cost Optimization (Partially Done)
- [x] Basic distance-based costs
- [ ] Window urgency factor
- [ ] Duration compatibility factor
- [ ] Chaining opportunity factor
- [ ] Pack size optimization

## Key Variables

```ruby
# Time tracking
current_time = Time.current # or earliest window
pickup_start_times = {} # { appointment_id => Time when pickup STARTED }

# State tracking
currently_walking = [] # Array of appointment objects
remaining_appointments = [] # Array of appointment objects not yet picked up
current_location = { lat:, lng: }

# For each dog being walked, can calculate elapsed time:
elapsed = current_time - pickup_start_times[dog.id]
```

## Testing Scenarios

### Test 1: Simple Sequential
```
Dog A: 10am-12pm, 60 min, Location (0,0)
Dog B: 10am-12pm, 30 min, Location (0.1, 0.1)

Expected:
10:00 - Pick up A
10:15 - Pick up B (while walking A)
10:45 - Drop off B (30 min walked)
11:00 - Drop off A (60 min walked)
Total time: 60 minutes
```

### Test 2: Window Constraints
```
Dog A: 10am-11am, 60 min, Location (0,0)
Dog B: 11am-12pm, 30 min, Location (0,1)

Cannot pick up B before 11am!

Expected:
10:00 - Pick up A, start walking
11:00 - Pick up B (A has 60 min, can go to 70)
11:30 - Drop off B (30 min)
11:10 - Drop off A (70 min - acceptable)
```

### Test 3: Pack Size Limit
```
Dogs A, B, C, D, E all near each other, same window

Expected:
- Pick up A, B, C, D (max 4)
- Walk and drop off as needed
- Then pick up E
- NOT pick up all 5 at once
```

## Next Steps

1. **Fix current implementation:**
   - Change `pickup_times` → `pickup_start_times` consistently
   - Ensure walk time = time from pickup START to dropoff
   - Fix cost calculation function names and parameters

2. **Add constraint checks:**
   - Before adding pickup action, verify window is open
   - Before adding dropoff action, verify within ±10 min range
   - Before picking up, verify pack size < 4

3. **Test with real data:**
   - Use your 9-dog scenario from production
   - Verify pickups/dropoffs are interleaved smartly
   - Verify total route time is minimized

4. **Add time awareness:**
   - Filter completed appointments
   - Start from current time
   - Handle dynamic re-routing

## Questions to Revisit

1. Should we penalize early dropoffs more than late dropoffs?
2. How much should window urgency factor weigh?
3. Should there be a "look ahead" to see if waiting for a window to open is better?
4. How to handle situations where NO dogs are pickupable right now (wait vs end route)?

---

Last updated: November 11, 2025
Status: Algorithm designed, implementation in progress
