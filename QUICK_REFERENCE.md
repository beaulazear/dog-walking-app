# Dog Walking App - Quick Reference Guide

## Technology Stack at a Glance

```
┌─────────────────────────────────────────┐
│          DOG WALKING APP                │
├─────────────────────────────────────────┤
│                                         │
│  Frontend: React 18.3.1 (port 4000)    │
│  ├─ Router: React Router v6             │
│  ├─ Styling: styled-components          │
│  ├─ State: UserContext (React Context)  │
│  └─ UI: lucide-react icons              │
│                                         │
│  Backend: Rails 7.2.2 (port 3000)      │
│  ├─ Database: PostgreSQL                │
│  ├─ Auth: JWT + bcrypt                  │
│  ├─ API: RESTful JSON endpoints         │
│  └─ ORM: ActiveRecord                   │
│                                         │
└─────────────────────────────────────────┘
```

## Key Data Models

```
User
├── has_many :pets
├── has_many :appointments (through :pets)
├── has_many :training_sessions
└── rates: thirty, fortyfive, sixty, solo_rate

Pet
├── belongs_to :user
├── has_many :appointments
├── address (TEXT) ← NEEDS GEOCODING
└── supplies_location, behavioral_notes

Appointment
├── belongs_to :user (walker)
├── belongs_to :pet
├── start_time, end_time ← TIME WINDOWS
├── duration: 30, 45, 60 minutes
├── walk_type: group, solo, training, sibling
└── recurring: true/false

Invoice
├── represents completed walk
├── appointment_id, pet_id
├── date_completed, compensation
└── is_shared (for team walks)
```

## Frontend Routes & Components

```
/                    → Dashboard (earnings, stats)
/todays-walks        → TodaysWalks (today's schedule)
/pets-page           → PetsPage (manage pets)
/team                → TeamAndShares (collaborate)
/login               → Login
/signup              → Signup
```

## Core API Endpoints

```
Appointments:
  GET    /appointments
  POST   /appointments
  PATCH  /appointments/:id
  DELETE /appointments/:id

Pets:
  GET    /pets
  POST   /pets
  PATCH  /pets/:id
  PATCH  /pets/:id/active

Invoices:
  GET    /invoices
  POST   /invoices
  PATCH  /invoices/paid

Current User:
  GET    /me
```

## File Locations (Important)

```
Backend:
  Models:       /app/models/
  Controllers:  /app/controllers/
  Serializers:  /app/serializers/
  Routes:       /config/routes.rb
  DB Schema:    /db/schema.rb
  Migrations:   /db/migrate/

Frontend:
  Components:   /client/src/components/
  Context:      /client/src/context/user.js
  Routing:      /client/src/App.js
  Package.json: /client/package.json
```

## What's Missing for Mapping Feature

| Feature | Status | What's Needed |
|---------|--------|--------------|
| Pet Addresses | ✅ Stored as text | Add latitude/longitude columns |
| Geocoding | ❌ None | Add `geocoder` gem, integrate API |
| Distance Calc | ❌ None | Distance matrix algorithm |
| Route Optimization | ❌ None | TSP/VRP algorithm implementation |
| Map Library | ❌ None | Install leaflet or mapbox |
| Map Component | ❌ None | Create MapView.js in React |
| Map Endpoint | ❌ None | GET /optimize_route/:date |

## Development Setup

```bash
# Install dependencies
bundle install          # Backend
npm install --prefix client   # Frontend

# Run local servers
bundle exec rails s     # Backend on 3000
npm start --prefix client    # Frontend on 4000

# Database
bundle exec rails db:create
bundle exec rails db:migrate
bundle exec rails db:seed
```

## Global State (UserContext)

```javascript
{
  user: {
    id, username, name, email_address,
    thirty, fortyfive, sixty, solo_rate,
    pets: [],
    appointments: [],
    invoices: []
  },
  loading: boolean
}
```

Available update methods:
- `addAppointment(apt)`
- `updateAppointment(apt)`
- `removeAppointment(id)`
- `addInvoice(invoice)`
- `addPet(pet)`
- `updatePet(pet)`
- `removePet(id)`

## Design Patterns Used

1. **Serializers** - Format API responses (UserSerializer, PetSerializer, AppointmentSerializer)
2. **React Context** - Global state management (UserContext)
3. **React.memo** - Memoize expensive components
4. **useMemo/useCallback** - Optimize rendering
5. **Lazy loading** - Code-split routes (React.lazy)
6. **Styled Components** - CSS-in-JS for component styling
7. **Modal Pattern** - ConfirmModal, CancellationModal, etc.

## Performance Considerations

- N+1 query problem: ✅ FIXED (eager loading in serializers)
- Pagination: ✅ Implemented (Kaminari gem)
- Memoization: ⚠️ PARTIAL (many components can be optimized)
- Bundle size: 111 KB (target: < 100 KB)

## Previous Planning Notes

The `/expired_claude_session.md` file contains detailed design for:
- Route Optimization Engine (TSP/VRP)
- Automatic Walk Grouping
- Smart Timeline View
- Map View with Clustering
- Intelligent Notifications
- Distance & Time Analytics

See `/ARCHITECTURE_REPORT.md` for full details.

## Useful Commands

```bash
# Backend
rails console          # Interactive console
rails routes           # Show all routes
rails db:migrate       # Run migrations
rails db:seed          # Load seed data

# Frontend
npm run build          # Production build
npm run analyze        # Bundle analysis
npm test               # Run tests

# Git
git log --oneline      # Recent commits
git status             # Changes
git diff               # View changes
```

## Next Steps for Mapping Feature

Phase 1: Geocoding
- [ ] Migration: add latitude, longitude to pets
- [ ] Add geocoder gem
- [ ] Rake task to geocode existing pets

Phase 2: Backend
- [ ] RouteOptimizationService class
- [ ] Distance matrix calculation
- [ ] New API endpoint for route optimization

Phase 3: Frontend
- [ ] npm install leaflet react-leaflet
- [ ] Create MapView.js component
- [ ] Integrate into TodaysWalks

Phase 4: UI
- [ ] Add Map button/tab
- [ ] Show optimization suggestions
- [ ] Real-time feasibility checking

---

See `/ARCHITECTURE_REPORT.md` for the complete technical analysis.
