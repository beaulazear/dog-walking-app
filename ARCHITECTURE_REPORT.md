# Dog Walking App - Architecture & Structure Report

## Executive Summary

The Dog Walking App is a **Rails 7 + React 18** full-stack application designed for dog walkers to manage appointments, track earnings, and optimize their daily walks. A route optimization and mapping feature was previously discussed but not yet implemented.

---

## 1. TECH STACK

### Backend
- **Framework**: Rails 7.2.2
- **Database**: PostgreSQL 
- **Authentication**: JWT + bcrypt (token-based auth)
- **API Style**: RESTful JSON API (separate from frontend)
- **Key Gems**:
  - `rails` 7.2.2 - Core framework
  - `pg` - PostgreSQL adapter
  - `jwt` - Token-based auth
  - `bcrypt` - Password hashing
  - `kaminari` - Pagination
  - `rack-cors` - CORS support
  - `aws-sdk-s3` - Cloud file storage
  - Testing: `rspec-rails`, `capybara`, `shoulda-matchers`

### Frontend
- **Framework**: React 18.3.1
- **Routing**: React Router v6
- **Styling**: styled-components 6.1.1
- **Build Tool**: react-scripts 5.0.1
- **UI Components**: lucide-react (icons)
- **Notifications**: react-hot-toast 2.6.0
- **Date/Time**: dayjs 1.11.10
- **Charts**: chart.js + react-chartjs-2 (for analytics)
- **Animation**: motion 12.23.24

### Architecture
- **Monorepo**: Backend at `/` root, Frontend at `/client` directory
- **API Port**: 3000 (Rails backend)
- **Frontend Port**: 4000 (React dev server)
- **Proxy**: Frontend proxies API calls to `http://localhost:3000`

---

## 2. DATABASE SCHEMA - KEY ENTITIES

### Users (Walkers)
```
users
├── username (unique)
├── name
├── email_address
├── password_digest (hashed with bcrypt)
├── thirty (rate for 30-min walk)
├── fortyfive (rate for 45-min walk)
├── sixty (rate for 60-min walk)
├── solo_rate (extra charge for solo walk)
├── training_rate (extra charge for training)
├── sibling_rate (extra charge for sibling walk)
```

### Pets
```
pets
├── user_id (FK - owner)
├── name
├── birthdate
├── sex
├── spayed_neutered
├── address ← **KEY FOR MAPPING**
├── behavioral_notes
├── supplies_location
├── allergies
├── active (boolean)
├── origin_trainer
├── profile_pic (ActiveStorage attachment)
```

### Appointments
```
appointments
├── user_id (FK - walker)
├── pet_id (FK)
├── appointment_date
├── start_time ← **TIME WINDOW START**
├── end_time ← **TIME WINDOW END**
├── duration (in minutes: 30, 45, 60)
├── price
├── recurring (boolean)
├── walk_type (group, solo, training, sibling)
├── completed (boolean)
├── canceled (boolean)
├── delegation_status (none, pending, accepted, declined)
├── completed_by_user_id (FK - if delegated)
├── monday...sunday (recurring day flags)
```

### Invoices (Completion Records)
```
invoices
├── appointment_id (FK)
├── pet_id (FK)
├── date_completed
├── compensation (amount paid)
├── paid (boolean)
├── pending (boolean)
├── cancelled (boolean)
├── title
├── is_shared (boolean - for team walks)
├── split_percentage
├── owner_amount
├── walker_amount
├── completed_by_user_id (FK)
```

### Additional Tables
- **WalkerConnections**: Teams/network for sharing work
- **AppointmentShares**: Share appointments between team members
- **TrainingSessions**: Track training hours for certification
- **Books**: Resource/training material tracking
- **Certifications**: CPDT-KA certification goal tracking
- **Milestones**: Track hour milestones achieved

**Critical Gap for Mapping**: 
- ⚠️ **No latitude/longitude fields** - Addresses are stored as text strings only
- ⚠️ **No geocoding** - Addresses haven't been converted to coordinates
- ⚠️ **No distance calculations** - No pre-calculated travel times/distances

---

## 3. FRONTEND COMPONENTS & ROUTES

### Navigation & Layout
```
App.js
├── BottomNav (4-tab navigation)
│   ├── Dashboard (default)
│   ├── TodaysWalks (/todays-walks)
│   ├── PetsPage (/pets-page)
│   └── TeamAndShares (/team)
├── Authentication
│   ├── Login
│   └── Signup
```

### Key Components (in `/client/src/components/`)

| Component | Purpose | Current Features |
|-----------|---------|------------------|
| **Dashboard.js** | Home page with stats | Year overview, earnings, hours, milestones |
| **TodaysWalks.js** | Daily walk schedule | List of today's walks, earnings tracker, completion modal |
| **PetsPage.js** | Pet management | List all pets, add/edit pets, view appointments |
| **TeamAndShares.js** | Team collaboration | Share appointments, manage team members |
| **NewAppointmentForm.js** | Create appointments | Date, time, duration, recurring, walk type |
| **CancellationModal.js** | Cancel walks | Mark walk cancelled with fee |
| **ShareAppointmentModal.js** | Share with team | Share single walk or recurring |
| **MyTeam.js** | Team connections | Invite walkers, manage team |
| **YearlyFinanceOverview.js** | Charts & analytics | Revenue by month, earnings breakdown |

### Global State Management
```
UserContext (context/user.js)
├── user object with:
│   ├── id, username, name, email_address
│   ├── rates (thirty, fortyfive, sixty, solo_rate, etc.)
│   ├── pets[] - all user's pets
│   ├── appointments[] - all appointments
│   └── invoices[] - all invoices
├── Helper methods:
│   ├── updateAppointment()
│   ├── addAppointment()
│   ├── removeAppointment()
│   ├── addInvoice()
│   ├── addPet()
│   ├── updatePet()
│   └── removePet()
```

### Current Data Display
- Lists appointments as **time-sorted cards** showing:
  - Pet name, photo
  - Time window
  - Duration
  - Walk type
  - Supplies location (text only)
  - Behavioral notes (text only)

---

## 4. BACKEND API ENDPOINTS

### Appointments
```
GET    /appointments              - List all appointments (paginated)
POST   /appointments              - Create appointment
PATCH  /appointments/:id          - Update appointment
DELETE /appointments/:id          - Delete appointment
GET    /pets_appointments         - Get future/recurring appointments
PATCH  /appointments/:id/canceled - Mark as canceled
```

### Pets
```
GET    /pets                      - List all pets
POST   /pets                      - Create pet
PATCH  /pets/:id                  - Update pet
DELETE /pets/:id                  - Delete pet
PATCH  /pets/:id/active           - Toggle active/inactive
```

### Invoices
```
GET    /invoices                  - List invoices
POST   /invoices                  - Create invoice (mark walk completed)
PATCH  /invoices/paid             - Mark as paid
PATCH  /invoices/pending          - Mark as pending
```

### Users
```
GET    /me                        - Get current user with full data
PATCH  /change_rates              - Update walk rates
```

### Response Format (UserSerializer)
```javascript
{
  id: 1,
  username: "john_doe",
  name: "John Doe",
  email_address: "john@example.com",
  thirty: 25,
  fortyfive: 35,
  sixty: 45,
  solo_rate: 10,
  pets: [
    {
      id: 1,
      name: "Max",
      address: "123 Main St, Denver CO",
      behavioral_notes: "Friendly, energetic",
      supplies_location: "Under porch",
      // ... other pet fields
    }
  ],
  appointments: [
    {
      id: 1,
      pet_id: 1,
      appointment_date: "2025-11-09",
      start_time: "09:00",
      end_time: "09:30",
      duration: 30,
      walk_type: "group",
      // ... other fields
      pet: { /* full pet object */ }
    }
  ],
  invoices: [ /* completion records */ ]
}
```

---

## 5. EXISTING MAPPING/GEOCODING/DISTANCE FEATURES

### Current State: **NONE**

No mapping libraries are installed:
- ⚠️ No Leaflet, Mapbox, Google Maps
- ⚠️ No geocoding gem (no Geocoder, Mapbox, Google Geocoding API)
- ⚠️ No distance calculation logic

### Location Data Available
- **Pet addresses** are stored as free-text strings in `pets.address`
- **Supplies location** is a text note (`pets.supplies_location`)
- **No structured geocoding** - Addresses cannot be used for calculations

### What Exists in Notes
The `/expired_claude_session.md` file outlines a comprehensive plan for mapping and optimization:

1. **Route Optimization Engine** - TSP/VRP Algorithm
2. **Automatic Walk Grouping** - Find dogs that can be walked together
3. **Smart Timeline View** - Show walk schedule with feasibility
4. **Map View with Clustering** - Visualize all walks on map
5. **Intelligent Notifications** - Alert walker to issues/opportunities
6. **Distance & Time Analytics** - Travel efficiency metrics

**Implementation Plan Outlined**:
- Phase 1: Add geocoding infrastructure (lat/lng to pets)
- Phase 2: Display walks on map with Mapbox/Leaflet
- Phase 3: Route optimization algorithm
- Phase 4: Smart scheduling logic

---

## 6. APP FOLDER STRUCTURE

```
/Users/beaulazear/Desktop/dog-walking-app/
├── app/
│   ├── controllers/               # 17 controllers
│   │   ├── appointments_controller.rb
│   │   ├── pets_controller.rb
│   │   ├── users_controller.rb
│   │   ├── invoices_controller.rb
│   │   ├── training_sessions_controller.rb
│   │   ├── appointment_shares_controller.rb
│   │   └── ...
│   ├── models/                    # 13 models
│   │   ├── user.rb
│   │   ├── pet.rb
│   │   ├── appointment.rb
│   │   ├── invoice.rb
│   │   ├── walker_connection.rb
│   │   ├── appointment_share.rb
│   │   └── ...
│   ├── serializers/               # API response formatting
│   │   ├── user_serializer.rb
│   │   ├── appointment_serializer.rb
│   │   └── pet_serializer.rb
│   ├── jobs/                      # Background jobs (async)
│   ├── mailers/                   # Email delivery
│   ├── views/                     # Rails fallback views
│   └── assets/                    # CSS, images
├── config/
│   ├── routes.rb                  # API routing
│   ├── database.yml               # DB config
│   └── ...
├── db/
│   ├── schema.rb                  # Current DB schema
│   ├── migrate/                   # Migration history
│   └── seeds/                     # Seed data
├── client/                        # React app (port 4000)
│   ├── src/
│   │   ├── components/            # React components
│   │   │   ├── Dashboard.js
│   │   │   ├── TodaysWalks.js
│   │   │   ├── PetsPage.js
│   │   │   ├── TeamAndShares.js
│   │   │   └── ... (20+ components)
│   │   ├── context/               # Global state
│   │   │   └── user.js
│   │   ├── hooks/                 # Custom React hooks
│   │   ├── assets/                # Images, fonts
│   │   ├── App.js                 # Main routing
│   │   └── index.js               # React entry point
│   ├── package.json               # Frontend dependencies
│   └── public/                    # Static assets
├── Gemfile                        # Backend dependencies
├── package.json                   # Root scripts (if any)
├── Procfile.dev                   # Local dev server config
├── NEXT_STEPS.md                  # Development roadmap
├── PERFORMANCE_TOOLS.md           # Profiling guides
└── README.md                      # Project docs
```

---

## 7. KEY OBSERVATIONS FOR ROUTE OPTIMIZATION FEATURE

### What's Ready
1. ✅ **Time windows** - Appointments have `start_time` and `end_time`
2. ✅ **Walk types** - `walk_type` field distinguishes group vs solo vs training
3. ✅ **Durations** - Duration is stored and used for rate calculation
4. ✅ **Pet addresses** - Addresses exist in `pets.address` (just not geocoded)
5. ✅ **Backend infrastructure** - Rails API can handle new endpoints
6. ✅ **Frontend state management** - UserContext can handle map data
7. ✅ **Modern stack** - React 18, can use mapping libraries easily

### What Needs to be Built
1. ❌ **Database migration** - Add `latitude`, `longitude`, `geocoded_at` to pets
2. ❌ **Geocoding service** - Add gem or API integration (Google Maps, Mapbox, Nominatim)
3. ❌ **Distance calculation** - Add algorithm to compute distances between locations
4. ❌ **Route optimization** - Implement TSP/VRP algorithm for optimal order
5. ❌ **Map frontend** - Install Leaflet or Mapbox for React
6. ❌ **API endpoints** - New endpoints for route optimization results
7. ❌ **MapView component** - React component to display map with markers/routes

### Performance Notes
- Recent optimizations: N+1 query elimination, pagination (Kaminari), serializers
- UserContext uses smart updates to prevent unnecessary full re-renders
- Frontend uses memoization (React.memo, useMemo) for expensive components
- Bundle size: ~111 KB (target: < 100 KB after optimization)

---

## 8. RECOMMENDED NEXT STEPS FOR MAPPING FEATURE

### Phase 1: Database & Geocoding
1. Create migration to add `latitude`, `longitude`, `geocoded_at` to pets table
2. Add `geocoder` gem (Ruby geocoding library)
3. Add after_create/after_update hook to Pet model to geocode address
4. Create Rake task to geocode all existing pets

### Phase 2: Backend Route Optimization
1. Create `RouteOptimizationService` class with:
   - Distance matrix calculation
   - TSP algorithm implementation
   - Time window constraint checking
   - Walk grouping logic
2. Add new API endpoint: `GET /optimize_route/:date` 
   - Returns optimized order of walks with travel times

### Phase 3: Frontend Map Component
1. Install mapping library: `npm install leaflet react-leaflet` (client)
2. Create `MapView.js` component showing:
   - Markers for each dog location
   - Route polyline between markers
   - Time estimates between locations
   - Color-coded by walk type
3. Integrate into TodaysWalks or new Map tab

### Phase 4: User Interface
1. Add Map button to TodaysWalks component
2. Show optimization suggestions
3. Allow drag-to-reorder route
4. Display travel time warnings

---

## 9. FILES TO UNDERSTAND BETTER

### Essential Backend Files
- `/app/models/appointment.rb` - Appointment logic and validations
- `/app/models/pet.rb` - Pet model with validations
- `/app/controllers/appointments_controller.rb` - API endpoints for appointments
- `/app/serializers/` - How data is formatted for frontend
- `/config/routes.rb` - All available API endpoints

### Essential Frontend Files
- `/client/src/App.js` - Main routing and layout
- `/client/src/context/user.js` - Global state management
- `/client/src/components/TodaysWalks.js` - Main component for daily walks view
- `/client/src/components/PetsPage.js` - Pet management UI
- `/client/src/components/NewAppointmentForm.js` - Appointment creation form

### Documentation
- `/NEXT_STEPS.md` - Development roadmap
- `/expired_claude_session.md` - Detailed feature brainstorm for mapping/optimization
- `/README.md` - Project overview
- `/PERFORMANCE_TOOLS.md` - Performance profiling guide

---

## Summary

The Dog Walking App is a well-structured Rails + React application with a solid foundation for adding mapping and route optimization features. The main missing pieces are:

1. **Geocoding infrastructure** - Convert addresses to lat/lng
2. **Distance calculations** - Determine travel times between locations
3. **Route optimization logic** - Implement algorithm to order walks efficiently
4. **Map visualization** - Display walks on interactive map in frontend

All other components (database, API, frontend state) are ready to support these features.

