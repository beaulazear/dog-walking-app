# Dog Walking App - Route Optimization Roadmap

## Current Status: Phase 2 Complete ✅

### ✅ Completed Features

#### Phase 1: Geocoding Infrastructure
- [x] Database migration with lat/lng columns for pets
- [x] GeocodingService using free Nominatim API
- [x] Automatic geocoding on pet save/update
- [x] NYC address normalization (auto-appends "Brooklyn, NY")
- [x] Rake tasks for batch geocoding
- [x] DistanceCalculator service with multiple travel modes
- [x] Distance API endpoints
- [x] PetSerializer includes geocoding fields

#### Phase 2: Map Visualization
- [x] WalksMapView component (full-screen, mobile-first)
- [x] Leaflet integration with custom markers
- [x] Interactive popups showing walk details
- [x] Map legend for walk types (group/solo/training/completed)
- [x] Auto-fit bounds to show all walks
- [x] Floating "Map View" toggle button
- [x] Error handling for missing coordinates

---

## Next Steps: Phase 3 & 4

### Phase 3: Smart Walk Grouping 🎯 NEXT

**Goal**: Automatically suggest which walks can be grouped together based on proximity and time windows.

**User Story**:
"As a dog walker, I want to see which dogs are close together so I can combine walks and save time."

#### Features to Build:

1. **Proximity Detection**
   - Identify dogs within X distance (configurable, default 0.25 miles)
   - Visual indicators for "nearby walks"
   - Group suggestions in UI

2. **Time Window Analysis**
   - Check if appointment times overlap or are close
   - Suggest optimal grouping based on walk durations
   - Factor in travel time between locations

3. **Walk Compatibility**
   - Consider walk types (can't mix training with regular walks)
   - Flag incompatible groupings
   - User override options

#### Implementation Plan:

**Backend Work:**

1. Create `WalkGroupingService` (app/services/walk_grouping_service.rb)
   ```ruby
   # Analyze today's appointments and suggest groups
   def self.suggest_groups(appointments, max_distance: 0.25)
     # Find dogs within max_distance of each other
     # Check time compatibility
     # Return suggested groups
   end
   ```

2. Add API endpoint (app/controllers/walk_groups_controller.rb)
   ```ruby
   GET /api/walk_groups/suggestions?date=2024-11-09
   # Returns: [{ group_id: 1, pets: [...], total_distance: 0.3, estimated_time: 45 }]
   ```

3. Add group optimization algorithm
   - Use clustering algorithm (k-means or DBSCAN)
   - Factor in time windows
   - Calculate optimal group sizes

**Frontend Work:**

1. Add "Group Suggestions" panel to TodaysWalks
   ```jsx
   <GroupSuggestionsPanel
     suggestions={groupSuggestions}
     onAcceptGroup={handleGroupAcceptance}
   />
   ```

2. Visual indicators on map
   - Color-code nearby walks
   - Draw lines between groupable walks
   - Show estimated savings

3. Group acceptance workflow
   - Click to accept/reject suggestions
   - Drag-and-drop to create custom groups
   - Save groups for the day

**Estimated Time**: 4-6 hours
**Priority**: HIGH - Major time-saver for daily operations

---

### Phase 4: Route Optimization 🚀

**Goal**: Calculate the most efficient order to visit dogs, minimizing total walking distance.

**User Story**:
"As a dog walker, I want the app to tell me the optimal order to visit dogs so I minimize walking time."

#### Features to Build:

1. **Route Calculation**
   - Solve Traveling Salesman Problem (TSP)
   - Use nearest-neighbor or 2-opt algorithm
   - Factor in appointment time windows

2. **Route Visualization**
   - Show optimized path on map with polylines
   - Display step-by-step directions
   - Show total distance and estimated time

3. **Manual Adjustments**
   - Drag to reorder stops
   - Lock certain stops in place
   - Recalculate on changes

#### Implementation Plan:

**Backend Work:**

1. Create `RouteOptimizerService` (app/services/route_optimizer_service.rb)
   ```ruby
   # Given a set of appointments, return optimal order
   def self.optimize_route(appointments, start_location: nil)
     # Use nearest-neighbor algorithm
     # Respect time windows
     # Return ordered appointments with directions
   end
   ```

2. Add route API endpoints
   ```ruby
   POST /api/routes/optimize
   GET  /api/routes/:date
   PUT  /api/routes/:id/reorder
   ```

3. Implement TSP solver
   - Start with simple nearest-neighbor
   - Upgrade to 2-opt for better results
   - Cache results for the day

**Frontend Work:**

1. Create RouteView component
   ```jsx
   <RouteView
     appointments={todaysAppointments}
     optimizedOrder={routeOrder}
     onReorder={handleReorder}
   />
   ```

2. Add route polyline to map
   ```jsx
   <Polyline
     positions={routePath}
     color="blue"
     weight={3}
   />
   ```

3. Add timeline/itinerary view
   - List of stops in order
   - Estimated arrival times
   - Walking directions between stops
   - Total stats (distance, time, earnings)

**Estimated Time**: 6-8 hours
**Priority**: HIGH - Core feature for daily efficiency

---

## Phase 5: Advanced Features 🌟 (Future)

### Real-Time Tracking
- GPS tracking during walks
- Live location sharing with pet owners
- "On my way" notifications

### Timeline View
- Visual timeline of the day
- Time block management
- Break scheduling

### Analytics Dashboard
- Daily/weekly distance walked
- Most visited locations
- Revenue per mile/hour
- Route efficiency over time

### Multi-Day Planning
- Weekly route optimization
- Recurring walk patterns
- Vacation/day-off handling

---

## Technical Architecture

### Backend Services Overview

```
app/services/
├── geocoding_service.rb          ✅ DONE
├── distance_calculator.rb        ✅ DONE
├── walk_grouping_service.rb      📋 TODO (Phase 3)
├── route_optimizer_service.rb    📋 TODO (Phase 4)
└── route_cache_service.rb        📋 TODO (Phase 4)
```

### Frontend Components Overview

```
client/src/components/
├── WalksMapView.js               ✅ DONE
├── TodaysWalks.js                ✅ DONE (integrated map)
├── GroupSuggestionsPanel.js      📋 TODO (Phase 3)
├── GroupIndicator.js             📋 TODO (Phase 3)
├── RouteView.js                  📋 TODO (Phase 4)
├── RouteTimeline.js              📋 TODO (Phase 4)
└── RouteOptimizationControls.js  📋 TODO (Phase 4)
```

---

## Immediate Next Actions (Phase 3 Start)

### 1. Backend: Walk Grouping Service

Create the service:
```bash
touch app/services/walk_grouping_service.rb
```

Implement basic grouping logic:
```ruby
class WalkGroupingService
  # Find walks within distance threshold
  def self.find_nearby_walks(appointments, max_distance: 0.25)
    grouped = []
    ungrouped = appointments.select { |a| a.pet&.geocoded? }

    while ungrouped.any?
      base = ungrouped.shift
      group = [base]

      ungrouped.each do |appt|
        distance = DistanceCalculator.distance_between(
          base.pet.latitude, base.pet.longitude,
          appt.pet.latitude, appt.pet.longitude
        )

        if distance <= max_distance
          group << appt
        end
      end

      grouped << group if group.length > 1
    end

    grouped
  end

  # Calculate time compatibility
  def self.time_compatible?(appt1, appt2, buffer_minutes: 15)
    start1 = appt1.start_time
    end1 = appt1.end_time
    start2 = appt2.start_time
    end2 = appt2.end_time

    # Check if times overlap or are within buffer
    (start1..end1).overlaps?(start2..end2) ||
    (end1 + buffer_minutes.minutes > start2 && start1 < end2 + buffer_minutes.minutes)
  end
end
```

### 2. Backend: Group API Controller

Create controller:
```bash
rails g controller WalkGroups
```

Add routes to config/routes.rb:
```ruby
namespace :api do
  resources :walk_groups, only: [:index, :create, :destroy] do
    collection do
      get :suggestions
    end
  end
end
```

### 3. Frontend: Group Suggestions Component

Create component:
```bash
touch client/src/components/GroupSuggestionsPanel.js
```

Basic structure:
```jsx
import React, { useEffect, useState } from 'react';
import styled from 'styled-components';

export default function GroupSuggestionsPanel({ date, appointments }) {
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    fetchGroupSuggestions();
  }, [date]);

  const fetchGroupSuggestions = async () => {
    const response = await fetch(`/api/walk_groups/suggestions?date=${date}`);
    const data = await response.json();
    setSuggestions(data);
  };

  return (
    <Panel>
      <Header>Suggested Walk Groups</Header>
      {suggestions.map((group, idx) => (
        <GroupCard key={idx}>
          <GroupTitle>Group {idx + 1}</GroupTitle>
          <PetList>
            {group.pets.map(pet => (
              <PetName key={pet.id}>{pet.name}</PetName>
            ))}
          </PetList>
          <Stats>
            <Stat>📍 {group.total_distance.toFixed(2)} mi</Stat>
            <Stat>⏱️ {group.estimated_time} min</Stat>
          </Stats>
          <AcceptButton onClick={() => handleAcceptGroup(group)}>
            Accept Group
          </AcceptButton>
        </GroupCard>
      ))}
    </Panel>
  );
}
```

### 4. Testing Phase 3

After implementation, test with:
```bash
# Create test appointments close together
rails runner "
today = Date.today
user = User.first

# Create 3 appointments within 0.1 miles
Pet.where(name: ['Artu', 'Chloe', 'Eliza']).each_with_index do |pet, i|
  Appointment.create!(
    pet: pet,
    user: user,
    appointment_date: today,
    start_time: '09:00',
    end_time: '10:00',
    duration: 30,
    walk_type: 'group'
  )
end

# Test grouping
groups = WalkGroupingService.find_nearby_walks(
  Appointment.where(appointment_date: today)
)
puts groups.inspect
"
```

---

## Success Metrics

### Phase 3 Success:
- ✅ Identifies 90%+ of groupable walks
- ✅ Time savings: 20-30% reduction in travel time
- ✅ User acceptance rate: 70%+ of suggestions used

### Phase 4 Success:
- ✅ Route optimization reduces daily distance by 25%+
- ✅ Generate routes in < 2 seconds
- ✅ Routes respect 95%+ of time windows

---

## Resources & References

### Algorithms:
- **Nearest Neighbor Algorithm**: Good starting point for TSP
- **2-Opt Algorithm**: Improved TSP solution
- **DBSCAN Clustering**: For geographic grouping
- **Haversine Formula**: Already implemented in DistanceCalculator

### Libraries:
- Consider `fast-polylines` gem for route encoding
- Consider `rgl` (Ruby Graph Library) for advanced routing

### APIs:
- Current: Nominatim (free geocoding)
- Upgrade options: Mapbox Directions API, Google Maps Routes API

---

## Questions for Consideration

Before starting Phase 3:

1. **Max group size**: What's the maximum number of dogs you walk together?
2. **Distance threshold**: 0.25 miles reasonable? (5 min walk)
3. **Time flexibility**: How much buffer between appointments?
4. **Walk type mixing**: Can you mix solo/group/training types?
5. **Manual overrides**: Should users be able to override suggestions?

Before starting Phase 4:

1. **Starting location**: Do routes start from home or previous walk?
2. **Time constraints**: Hard time windows or soft suggestions?
3. **Break times**: Should breaks be factored into routes?
4. **Return home**: Do routes need to end at starting location?

---

## Getting Started

To begin Phase 3:

```bash
# Create the walk grouping service
touch app/services/walk_grouping_service.rb

# Create the controller
rails g controller WalkGroups

# Create the frontend component
touch client/src/components/GroupSuggestionsPanel.js

# Run tests with existing seed data
rails runner "puts WalkGroupingService.find_nearby_walks(Appointment.where(appointment_date: Date.today)).inspect"
```

Ready to start Phase 3? Let me know and I'll help implement the walk grouping feature! 🚀
