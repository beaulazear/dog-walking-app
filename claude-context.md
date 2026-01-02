# Dog Walking App - Claude Context

**Last Updated:** January 2, 2026
**Purpose:** Comprehensive context document for AI assistants working on this codebase

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Database Schema](#database-schema)
5. [API Routes & Endpoints](#api-routes--endpoints)
6. [Backend Architecture](#backend-architecture)
7. [Frontend Architecture](#frontend-architecture)
8. [Authentication & Authorization](#authentication--authorization)
9. [Key Features Deep Dive](#key-features-deep-dive)
10. [Important Patterns & Conventions](#important-patterns--conventions)
11. [Common Tasks](#common-tasks)
12. [Development Workflow](#development-workflow)

---

## Project Overview

A comprehensive dog walking business management application for professional dog walkers. The app helps walkers manage appointments, track earnings, coordinate with team members, optimize routes, and track training certifications.

### Core Value Propositions
- **Appointment Management**: Recurring and one-time walks with flexible scheduling
- **Team Collaboration**: Share appointments and coordinate with other walkers
- **Financial Tracking**: Invoice generation, earnings reports, and payment tracking
- **Route Optimization**: Geocoding, distance calculation, and intelligent route planning
- **Training Certification**: Track training hours toward professional certifications (CPDT-KA, etc.)
- **Pet Management**: Comprehensive pet profiles with behavioral notes and special requirements

---

## Tech Stack

### Backend
- **Framework**: Ruby on Rails 7.2.2
- **Database**: PostgreSQL (with spatial data support)
- **Authentication**: JWT tokens + bcrypt password hashing
- **File Storage**: AWS S3 via ActiveStorage (for pet/user profile pictures)
- **API Style**: RESTful JSON API

#### Key Backend Dependencies
```ruby
gem 'jwt'                    # Token-based authentication
gem 'bcrypt'                 # Password hashing
gem 'active_model_serializers' # JSON serialization
gem 'rack-cors'              # CORS support
gem 'kaminari'               # Pagination
gem 'aws-sdk-s3'             # Cloud storage
```

#### Testing Dependencies
```ruby
gem 'rspec-rails'            # Testing framework
gem 'factory_bot_rails'      # Test data factories
gem 'faker'                  # Fake data generation
gem 'shoulda-matchers'       # RSpec matchers
gem 'capybara'               # Integration testing
```

### Frontend
- **Framework**: React 18.3.1
- **Routing**: React Router v6
- **Styling**: styled-components 6.1.1
- **Build Tool**: Create React App (with webpack)

#### Key Frontend Dependencies
```json
{
  "react-hot-toast": "Notifications",
  "leaflet": "Mapping library",
  "react-leaflet": "React wrapper for Leaflet",
  "chart.js": "Data visualization",
  "react-chartjs-2": "React wrapper for Chart.js",
  "dayjs": "Date/time manipulation",
  "lucide-react": "Icon library",
  "motion": "Animation library"
}
```

### Development Setup
- **Backend Port**: 3000 (Rails server)
- **Frontend Port**: 4000 (React dev server with proxy to backend)
- **Database**: PostgreSQL (local development)

---

## Project Structure

```
dog-walking-app/
├── app/                          # Rails backend application
│   ├── controllers/              # API controllers (23 files)
│   │   ├── application_controller.rb      # Base controller (auth)
│   │   ├── appointments_controller.rb     # Appointment CRUD
│   │   ├── appointment_shares_controller.rb # Team sharing
│   │   ├── distance_controller.rb         # Geocoding/distance
│   │   ├── invoices_controller.rb         # Invoice management
│   │   ├── pets_controller.rb             # Pet CRUD
│   │   ├── routes_controller.rb           # Route optimization
│   │   ├── sessions_controller.rb         # Login/logout
│   │   ├── training_controller.rb         # Training dashboard
│   │   ├── training_sessions_controller.rb # Training CRUD
│   │   ├── users_controller.rb            # User management
│   │   ├── walk_groups_controller.rb      # Walk grouping
│   │   ├── walker_connections_controller.rb # Team management
│   │   └── ... (11 more controllers)
│   │
│   ├── models/                   # Data models (18 files)
│   │   ├── user.rb               # Walker account
│   │   ├── pet.rb                # Dog profiles
│   │   ├── appointment.rb        # Walk appointments
│   │   ├── invoice.rb            # Payment records
│   │   ├── appointment_share.rb  # Shared appointments
│   │   ├── walker_connection.rb  # Team connections
│   │   ├── training_session.rb   # Training records
│   │   ├── certification_goal.rb # Certification targets
│   │   ├── walk_group.rb         # Grouped walks
│   │   └── ... (9 more models)
│   │
│   ├── serializers/              # JSON response formatting
│   │   ├── user_serializer.rb
│   │   ├── pet_serializer.rb
│   │   ├── appointment_serializer.rb
│   │   └── ...
│   │
│   ├── services/                 # Business logic services
│   │   ├── geocoding_service.rb          # Address → coordinates
│   │   ├── distance_calculator.rb        # Haversine distance
│   │   ├── route_optimizer_service.rb    # Route planning
│   │   └── walk_grouping_service.rb      # Walk grouping
│   │
│   └── jobs/                     # Background jobs (if any)
│
├── client/                       # React frontend
│   ├── public/                   # Static assets
│   │   └── index.html
│   │
│   ├── src/
│   │   ├── components/           # React components (30+ files)
│   │   │   ├── App.js                    # Root component
│   │   │   ├── Dashboard.js              # Home/overview
│   │   │   ├── TodaysWalks.js            # Daily walk view
│   │   │   ├── PetsPage.js               # Pet management
│   │   │   ├── TeamAndShares.js          # Team coordination
│   │   │   ├── MyEarnings.js             # Financial reports
│   │   │   ├── Profile.js                # User profile + year review
│   │   │   ├── YearlyFinanceOverview.js  # Annual stats
│   │   │   ├── BottomNav.js              # Navigation
│   │   │   ├── WalksMapView.js           # Leaflet map
│   │   │   ├── RouteJourneyPanel.js      # Route display
│   │   │   ├── NewAppointmentForm.js     # Create appointments
│   │   │   ├── ShareAppointmentModal.js  # Share with team
│   │   │   └── ... (20+ more components)
│   │   │
│   │   ├── context/              # Global state management
│   │   │   └── user.js           # UserContext provider
│   │   │
│   │   ├── hooks/                # Custom React hooks
│   │   │   └── useConfirm.js     # Confirmation dialogs
│   │   │
│   │   ├── utils/                # Utility functions
│   │   │
│   │   └── index.js              # App entry point
│   │
│   └── package.json              # Frontend dependencies
│
├── config/                       # Rails configuration
│   ├── routes.rb                 # API endpoint definitions
│   ├── database.yml              # Database config
│   ├── application.rb            # App settings
│   └── ...
│
├── db/                          # Database files
│   ├── schema.rb                # Current database structure
│   ├── migrate/                 # Migration files
│   └── seeds.rb                 # Seed data
│
├── spec/                        # RSpec tests
│   ├── models/
│   ├── requests/
│   └── ...
│
├── Gemfile                      # Backend dependencies
├── package.json                 # Project scripts
└── README.md                    # Project documentation
```

---

## Database Schema

### Entity Relationship Overview

```
User (Walker)
├─── has_many :pets
├─── has_many :appointments
├─── has_many :invoices (through appointments)
├─── has_many :training_sessions
├─── has_many :initiated_connections (WalkerConnection)
├─── has_many :received_connections (WalkerConnection)
├─── has_many :appointment_shares (both shared_by and shared_with)
├─── has_many :walker_earnings
├─── has_many :blogs
├─── has_many :books
├─── has_one :certification_goal
└─── has_many :milestones

Pet
├─── belongs_to :user
├─── has_many :appointments
├─── has_many :invoices
├─── has_many :additional_incomes
├─── has_many :training_sessions
├─── has_many :blogs
└─── has_one_attached :profile_pic (ActiveStorage)

Appointment
├─── belongs_to :user (owner)
├─── belongs_to :pet
├─── belongs_to :completed_by_user (optional - for delegation)
├─── belongs_to :walk_group (optional)
├─── has_many :invoices
├─── has_many :cancellations
├─── has_many :appointment_shares
└─── has_many :walker_earnings

AppointmentShare
├─── belongs_to :appointment
├─── belongs_to :shared_by_user (User)
├─── belongs_to :shared_with_user (User)
├─── has_many :share_dates
└─── has_many :walker_earnings

Invoice
├─── belongs_to :appointment
├─── belongs_to :pet
├─── belongs_to :training_session (optional)
└─── belongs_to :completed_by_user (optional)
```

### Core Tables

#### users
**Purpose**: Walker accounts and profiles

| Column | Type | Notes |
|--------|------|-------|
| id | bigint | Primary key |
| username | string | Login username |
| password_digest | string | Bcrypt hashed password |
| name | string | Display name |
| email_address | string | Contact email |
| thirty | integer | Rate for 30-min walk ($) |
| fortyfive | integer | Rate for 45-min walk ($) |
| sixty | integer | Rate for 60-min walk ($) |
| solo_rate | integer | Premium for solo walks ($) |
| training_rate | integer | Premium for training walks ($) |
| sibling_rate | integer | Premium for sibling walks ($) |
| created_at | datetime | Account creation |
| updated_at | datetime | Last update |

**Relationships**:
- Has profile picture via ActiveStorage
- Has many pets, appointments, invoices, training sessions
- Has team connections (walker_connections)
- Can share/receive appointment shares

---

#### pets
**Purpose**: Dog profiles managed by walkers

| Column | Type | Notes |
|--------|------|-------|
| id | bigint | Primary key |
| user_id | bigint | FK to users (owner) |
| name | string | Pet name |
| birthdate | datetime | Date of birth |
| sex | string | M/F/Other |
| spayed_neutered | boolean | Fixed status |
| address | string | Walk location |
| latitude | decimal(10,6) | Geocoded latitude |
| longitude | decimal(10,6) | Geocoded longitude |
| geocoded_at | datetime | Last geocode time |
| geocoding_failed | boolean | Geocode error flag |
| geocoding_error | string | Error message |
| behavioral_notes | text | Training/behavior info |
| supplies_location | text | Where to find leash/treats |
| allergies | string | Food/environmental allergies |
| active | boolean | Currently active client |
| origin_trainer | boolean | Training client flag |
| created_at | datetime | Record creation |
| updated_at | datetime | Last update |

**Indexes**:
- `user_id` for efficient owner lookup
- `(latitude, longitude)` for proximity searches

**Attachments**:
- `profile_pic` via ActiveStorage (S3)

**Geocoding**:
- Address automatically geocoded on create/update via GeocodingService
- Uses Nominatim (OpenStreetMap) for free geocoding
- Falls back gracefully if geocoding fails

---

#### appointments
**Purpose**: Walk appointments (one-time or recurring)

| Column | Type | Notes |
|--------|------|-------|
| id | bigint | Primary key |
| user_id | bigint | FK to users (owner) |
| pet_id | bigint | FK to pets |
| recurring | boolean | Recurring vs one-time |
| appointment_date | datetime | Date for one-time appts |
| start_time | time | Walk start time |
| end_time | time | Walk end time |
| duration | integer | Minutes (30/45/60) |
| price | integer | Calculated rate ($) |
| monday | boolean | Recurring: walk on Mon? |
| tuesday | boolean | Recurring: walk on Tue? |
| wednesday | boolean | Recurring: walk on Wed? |
| thursday | boolean | Recurring: walk on Thu? |
| friday | boolean | Recurring: walk on Fri? |
| saturday | boolean | Recurring: walk on Sat? |
| sunday | boolean | Recurring: walk on Sun? |
| completed | boolean | Walk completed? |
| canceled | boolean | Walk canceled? |
| walk_type | string | solo/group/training/sibling |
| delegation_status | string | none/pending/accepted |
| completed_by_user_id | bigint | FK to users (who did walk) |
| walk_group_id | bigint | FK to walk_groups |
| cloned_from_appointment_id | integer | Source if cloned |
| created_at | datetime | Record creation |
| updated_at | datetime | Last update |

**Indexes**:
- `(user_id, appointment_date)` for daily queries
- `(user_id, recurring, canceled, completed)` for filtering
- `delegation_status` for team features
- `completed_by_user_id` for delegation lookup

**Recurring Appointments**:
- Use day-of-week boolean flags (monday...sunday)
- `recurring = true` with null `appointment_date`
- Frontend generates instances based on date range + day flags

**One-Time Appointments**:
- `recurring = false` with specific `appointment_date`

**Delegation**:
- `completed_by_user_id` tracks who actually completed the walk
- Enables appointment sharing between team members

---

#### invoices
**Purpose**: Payment records for completed walks

| Column | Type | Notes |
|--------|------|-------|
| id | bigint | Primary key |
| appointment_id | bigint | FK to appointments |
| pet_id | bigint | FK to pets |
| date_completed | datetime | When walk was done |
| compensation | integer | Total amount earned ($) |
| paid | boolean | Payment received? |
| pending | boolean | Payment pending? |
| cancelled | boolean | Walk was cancelled? |
| title | string | Invoice description |
| training_session_id | bigint | FK to training_sessions |
| is_shared | boolean | Shared with team? |
| split_percentage | decimal(5,2) | Share split % |
| owner_amount | decimal(10,2) | Original walker $ |
| walker_amount | decimal(10,2) | Covering walker $ |
| completed_by_user_id | bigint | FK to users (who did) |
| created_at | datetime | Invoice creation |
| updated_at | datetime | Last update |

**Indexes**:
- `appointment_id` for appointment lookup
- `(pet_id, paid, pending)` for payment filtering
- `is_shared` for team earnings
- `completed_by_user_id` for delegation

**Payment States**:
- `paid = true`: Payment received
- `pending = true`: Payment expected soon
- Both false: Unpaid

**Shared Invoices**:
- `is_shared = true` when appointment delegated
- `split_percentage` defines the split (e.g., 60/40)
- `owner_amount` and `walker_amount` calculated from split

---

#### appointment_shares
**Purpose**: Team sharing of appointments

| Column | Type | Notes |
|--------|------|-------|
| id | bigint | Primary key |
| appointment_id | bigint | FK to appointments |
| shared_by_user_id | bigint | FK to users (sharer) |
| shared_with_user_id | bigint | FK to users (receiver) |
| status | string | pending/accepted/declined |
| recurring_share | boolean | Share all recurrences? |
| covering_walker_percentage | integer | Split % (0-100) |
| proposed_by | string | Who initiated share |
| created_at | datetime | Share creation |
| updated_at | datetime | Last update |

**Indexes**:
- `(appointment_id, shared_with_user_id)` unique constraint
- `status` for filtering pending shares

**Workflow**:
1. Walker A shares appointment with Walker B
2. Status = 'pending'
3. Walker B accepts → Status = 'accepted', creates walker_earnings
4. Walker B declines → Status = 'declined'

**Percentage Split**:
- `covering_walker_percentage = 60` means covering walker gets 60%
- Original walker gets remaining 40%

---

#### share_dates
**Purpose**: Track specific dates for recurring appointment shares

| Column | Type | Notes |
|--------|------|-------|
| id | bigint | Primary key |
| appointment_share_id | bigint | FK to appointment_shares |
| date | date | Specific covered date |
| created_at | datetime | Record creation |
| updated_at | datetime | Last update |

**Indexes**:
- `(appointment_share_id, date)` unique constraint

**Purpose**:
- For recurring appointments, track which specific dates are covered
- Allows partial sharing (e.g., cover Mon/Wed but not Fri)

---

#### walker_connections
**Purpose**: Team connections between walkers

| Column | Type | Notes |
|--------|------|-------|
| id | bigint | Primary key |
| user_id | bigint | FK to users (requestor) |
| connected_user_id | bigint | FK to users (recipient) |
| status | string | pending/accepted/declined/blocked |
| created_at | datetime | Connection request |
| updated_at | datetime | Last status change |

**Indexes**:
- `(user_id, connected_user_id)` unique constraint
- `status` for filtering

**Connection States**:
- `pending`: Connection request sent
- `accepted`: Walkers are connected (can share appointments)
- `declined`: Request declined
- `blocked`: User blocked the connection

**Required for**:
- Sharing appointments
- Viewing each other's availability
- Team coordination features

---

#### walker_earnings
**Purpose**: Earnings from covering shared appointments

| Column | Type | Notes |
|--------|------|-------|
| id | bigint | Primary key |
| appointment_id | bigint | FK to appointments |
| walker_id | bigint | FK to users (who covered) |
| appointment_share_id | bigint | FK to appointment_shares |
| pet_id | bigint | FK to pets |
| date_completed | date | When walk completed |
| compensation | integer | Amount earned ($) |
| split_percentage | integer | Share % (0-100) |
| paid | boolean | Payment received? |
| pending | boolean | Payment pending? |
| title | string | Earning description |
| training_session_id | bigint | FK if training-related |
| created_at | datetime | Record creation |
| updated_at | datetime | Last update |

**Indexes**:
- `(walker_id, paid, pending)` for payment filtering
- `date_completed` for date-based queries

**Purpose**:
- Tracks earnings separate from original appointment owner
- Enables team members to see their covered walk income
- Supports split payment tracking

---

#### training_sessions
**Purpose**: Track training hours for certification

| Column | Type | Notes |
|--------|------|-------|
| id | bigint | Primary key |
| user_id | bigint | FK to users |
| pet_id | bigint | FK to pets (optional) |
| session_date | datetime | When session occurred |
| duration_minutes | integer | Session length |
| session_type | string | Type of training |
| notes | text | Session notes |
| training_focus | string[] | Array of focus areas |
| created_at | datetime | Record creation |
| updated_at | datetime | Last update |

**Indexes**:
- `(user_id, session_date)` for timeline queries
- `user_id` for walker lookup

**Session Types**:
- Solo walk training
- Pack walk training
- Group class
- Private lesson
- Seminar/workshop
- Self-study
- Other

**Integration**:
- Can be linked to invoices for paid training
- Automatically updates milestone achievements
- Tracks progress toward certification_goal

---

#### certification_goals
**Purpose**: Certification target tracking

| Column | Type | Notes |
|--------|------|-------|
| id | bigint | Primary key |
| user_id | bigint | FK to users (unique) |
| certification_type | string | Default: CPDT-KA |
| target_hours | integer | Default: 300 |
| weekly_goal_hours | integer | Default: 12 |
| target_completion_date | date | Goal deadline |
| created_at | datetime | Goal creation |
| updated_at | datetime | Last update |

**Unique Constraint**: One goal per user

**Common Certifications**:
- CPDT-KA (300 hours)
- CPDT-KSA (500 hours)
- Custom goals

---

#### milestones
**Purpose**: Achievement tracking for training hours

| Column | Type | Notes |
|--------|------|-------|
| id | bigint | Primary key |
| user_id | bigint | FK to users |
| hours_reached | integer | Hours milestone (5/10/25/50/100...) |
| achieved_at | datetime | When milestone reached |
| celebrated | boolean | User acknowledged? |
| created_at | datetime | Record creation |
| updated_at | datetime | Last update |

**Indexes**:
- `(user_id, hours_reached)` unique constraint

**Automatic Creation**:
- System creates milestones at: 5, 10, 25, 50, 100, 150, 200, 250, 300+ hours
- Celebrated flag allows UI to show "congrats" only once

---

#### walk_groups
**Purpose**: Group multiple walks together

| Column | Type | Notes |
|--------|------|-------|
| id | bigint | Primary key |
| user_id | bigint | FK to users |
| date | date | Group date |
| name | string | Group name |
| created_at | datetime | Creation |
| updated_at | datetime | Last update |

**Purpose**:
- Organize walks by proximity/time
- Enable batch operations
- Visual grouping on maps

---

#### cancellations
**Purpose**: Track canceled appointment instances

| Column | Type | Notes |
|--------|------|-------|
| id | bigint | Primary key |
| appointment_id | bigint | FK to appointments |
| date | datetime | Which date canceled |
| created_at | datetime | Cancellation time |
| updated_at | datetime | Last update |

**Indexes**:
- `(appointment_id, date)` for specific lookups

**Purpose**:
- For recurring appointments, track individual canceled dates
- Allows "cancel just this Monday" vs "cancel all"

---

#### blogs
**Purpose**: Training journal/blog posts

| Column | Type | Notes |
|--------|------|-------|
| id | bigint | Primary key |
| user_id | bigint | FK to users |
| pet_id | bigint | FK to pets (optional) |
| content | text | Blog post content |
| training_focus | string[] | Focus areas array |
| created_at | datetime | Post creation |
| updated_at | datetime | Last edit |

**Indexes**:
- `(user_id, created_at)` for timeline

---

#### books
**Purpose**: Reading list for professional development

| Column | Type | Notes |
|--------|------|-------|
| id | bigint | Primary key |
| user_id | bigint | FK to users (null for defaults) |
| title | string | Book title |
| author | string | Author name |
| category | string | Book category |
| is_default | boolean | System-recommended book? |
| status | string | not_started/reading/completed |
| progress_percentage | integer | 0-100 |
| notes | text | User notes |
| rating | integer | 1-5 stars |
| description | text | Book description |
| pages | integer | Page count |
| publisher | string | Publisher |
| year | integer | Publication year |
| isbn | string | ISBN |
| price_range | string | Price range |
| format | string | Physical/ebook/audio |
| why_you_need_it | text | Book recommendation |
| best_for | text | Target audience |
| completed_date | date | When finished |
| purchase_url | string | Purchase link |
| audible_url | string | Audiobook link |
| created_at | datetime | Record creation |
| updated_at | datetime | Last update |

**Indexes**:
- `(user_id, is_default)` for filtering
- `status` for reading progress

**Default Books**:
- System populates recommended books with `is_default = true`
- Users can add to their list by creating user-specific copy

---

#### additional_incomes
**Purpose**: Non-appointment income tracking

| Column | Type | Notes |
|--------|------|-------|
| id | bigint | Primary key |
| pet_id | bigint | FK to pets |
| description | string | What the income was for |
| date_added | datetime | When earned |
| compensation | integer | Amount ($) |
| created_at | datetime | Record creation |
| updated_at | datetime | Last update |

**Examples**:
- Pet sitting
- Drop-in visits
- Holiday bonuses
- One-off services

---

#### ActiveStorage Tables
**Purpose**: File attachments (profile pictures)

- `active_storage_blobs`: File metadata
- `active_storage_attachments`: Polymorphic associations
- `active_storage_variant_records`: Image variants

**Used For**:
- Pet profile pictures
- User profile pictures

**Storage**: AWS S3 in production

---

## API Routes & Endpoints

### Authentication

#### POST /login
**Purpose**: Authenticate user and create session
**Request Body**:
```json
{
  "username": "walker123",
  "password": "securepassword"
}
```
**Response**: User object with JWT token in header or session cookie

#### DELETE /logout
**Purpose**: Destroy user session
**Response**: Success message

#### GET /me
**Purpose**: Get current authenticated user
**Response**: Full user object with associations (pets, appointments, invoices, etc.)

---

### Users

#### GET /users/search?query=name
**Purpose**: Search for walkers by name
**Auth**: Required
**Response**: Array of matching users

#### GET /users
**Purpose**: List all users
**Auth**: Required
**Response**: Array of users

#### GET /users/:id
**Purpose**: Get specific user
**Auth**: Required
**Response**: User object

#### POST /users
**Purpose**: Create new user (signup)
**Request Body**:
```json
{
  "username": "newwalker",
  "password": "password123",
  "name": "Jane Doe",
  "email_address": "jane@example.com"
}
```
**Response**: Created user

#### PATCH /users/:id
**Purpose**: Update user
**Auth**: Required (own account)
**Response**: Updated user

#### PATCH /change_rates
**Purpose**: Update walker rates
**Request Body**:
```json
{
  "thirty": 25,
  "fortyfive": 35,
  "sixty": 45,
  "solo_rate": 10,
  "training_rate": 15,
  "sibling_rate": 5
}
```
**Response**: Updated user

#### PATCH /update_profile
**Purpose**: Update profile (name, email, photo)
**Auth**: Required
**Response**: Updated user

---

### Pets

#### GET /pets
**Purpose**: Get all pets for current user
**Auth**: Required
**Response**: Array of pets

#### GET /pets/:id
**Purpose**: Get specific pet
**Auth**: Required
**Response**: Pet object

#### POST /pets
**Purpose**: Create new pet
**Request Body**:
```json
{
  "name": "Buddy",
  "address": "123 Main St, City, State",
  "sex": "M",
  "spayed_neutered": true,
  "behavioral_notes": "Friendly but pulls on leash",
  "supplies_location": "Hooks by front door",
  "allergies": "None",
  "active": true
}
```
**Response**: Created pet (with geocoded coordinates)

#### PATCH /pets/:id
**Purpose**: Update pet
**Auth**: Required (owner only)
**Response**: Updated pet

#### PATCH /pets/:id/active
**Purpose**: Toggle pet active status
**Request Body**: `{ "active": false }`
**Response**: Updated pet

#### DELETE /pets/:id
**Purpose**: Delete pet
**Auth**: Required (owner only)
**Response**: Success message

---

### Appointments

#### GET /appointments
**Purpose**: Get all appointments for current user
**Auth**: Required
**Response**: Array of appointments

#### GET /appointments/for_date?date=2026-01-15
**Purpose**: Get appointments for specific date
**Auth**: Required
**Response**: Array of appointments on that date (including recurring instances)

#### GET /appointments/my_earnings
**Purpose**: Get earning statistics
**Auth**: Required
**Response**: Earnings summary

#### GET /appointments/team_financials
**Purpose**: Get team sharing financial data
**Auth**: Required
**Response**: Team financial summary

#### POST /appointments
**Purpose**: Create appointment
**Request Body** (Recurring):
```json
{
  "pet_id": 1,
  "recurring": true,
  "start_time": "09:00",
  "end_time": "09:30",
  "duration": 30,
  "monday": true,
  "wednesday": true,
  "friday": true,
  "walk_type": "solo"
}
```
**Request Body** (One-time):
```json
{
  "pet_id": 1,
  "recurring": false,
  "appointment_date": "2026-01-15T09:00:00",
  "start_time": "09:00",
  "end_time": "09:30",
  "duration": 30,
  "walk_type": "group"
}
```
**Response**: Created appointment

#### PATCH /appointments/:id
**Purpose**: Update appointment
**Auth**: Required (owner only)
**Response**: Updated appointment

#### PATCH /appointments/:id/canceled
**Purpose**: Cancel appointment (or specific date for recurring)
**Request Body**:
```json
{
  "canceled": true,
  "cancellation_date": "2026-01-15"  // Optional for recurring
}
```
**Response**: Updated appointment

#### DELETE /appointments/:id
**Purpose**: Delete appointment
**Auth**: Required (owner only)
**Response**: Success message

#### GET /pets_appointments
**Purpose**: Get pets with their appointments
**Auth**: Required
**Response**: Array of pets including appointment arrays

---

### Invoices

#### GET /invoices
**Purpose**: Get all invoices for current user
**Auth**: Required
**Response**: Array of invoices

#### POST /invoices
**Purpose**: Create invoice (typically after completing appointment)
**Request Body**:
```json
{
  "appointment_id": 1,
  "pet_id": 1,
  "date_completed": "2026-01-15T09:30:00",
  "compensation": 35,
  "title": "30-min walk - Buddy"
}
```
**Response**: Created invoice

#### PATCH /invoices/paid
**Purpose**: Mark invoice(s) as paid
**Request Body**: `{ "invoice_ids": [1, 2, 3] }`
**Response**: Updated invoices

#### PATCH /invoices/pending
**Purpose**: Mark invoice(s) as pending
**Request Body**: `{ "invoice_ids": [1, 2, 3] }`
**Response**: Updated invoices

#### PATCH /invoices/:id
**Purpose**: Update invoice
**Auth**: Required
**Response**: Updated invoice

#### DELETE /invoices/:id
**Purpose**: Delete invoice
**Auth**: Required
**Response**: Success message

---

### Walker Connections (Team Management)

#### GET /walker_connections
**Purpose**: Get all connections (sent and received)
**Auth**: Required
**Response**: Array of connections with user details

#### POST /walker_connections
**Purpose**: Send connection request
**Request Body**: `{ "connected_user_id": 2 }`
**Response**: Created connection (status: pending)

#### PATCH /walker_connections/:id/accept
**Purpose**: Accept connection request
**Auth**: Required (must be recipient)
**Response**: Updated connection (status: accepted)

#### PATCH /walker_connections/:id/decline
**Purpose**: Decline connection request
**Auth**: Required (must be recipient)
**Response**: Updated connection (status: declined)

#### PATCH /walker_connections/:id/block
**Purpose**: Block user
**Auth**: Required
**Response**: Updated connection (status: blocked)

#### DELETE /walker_connections/:id
**Purpose**: Remove connection
**Auth**: Required
**Response**: Success message

---

### Appointment Shares

#### GET /appointment_shares
**Purpose**: Get all appointment shares (sent and received)
**Auth**: Required
**Response**: Array of shares with appointment details

#### GET /appointment_shares/my_shared_appointments
**Purpose**: Get appointments shared with current user
**Auth**: Required
**Response**: Array of shares where user is recipient

#### POST /appointment_shares
**Purpose**: Share appointment with team member
**Request Body**:
```json
{
  "appointment_id": 1,
  "shared_with_user_id": 2,
  "covering_walker_percentage": 60,
  "recurring_share": false,
  "share_dates": ["2026-01-15", "2026-01-17"]  // Optional for recurring
}
```
**Response**: Created share (status: pending)

#### PATCH /appointment_shares/:id/accept
**Purpose**: Accept shared appointment
**Auth**: Required (must be recipient)
**Response**: Updated share (status: accepted)

#### PATCH /appointment_shares/:id/decline
**Purpose**: Decline shared appointment
**Auth**: Required (must be recipient)
**Response**: Updated share (status: declined)

#### DELETE /appointment_shares/:id
**Purpose**: Remove share
**Auth**: Required
**Response**: Success message

---

### Distance & Geocoding

#### POST /distance/calculate
**Purpose**: Calculate distance between two points
**Request Body**:
```json
{
  "lat1": 40.7128,
  "lon1": -74.0060,
  "lat2": 40.7580,
  "lon2": -73.9855
}
```
**Response**: `{ "distance": 5.12 }` (in miles)

#### POST /distance/matrix
**Purpose**: Calculate distance matrix for multiple points
**Request Body**:
```json
{
  "origins": [[40.7128, -74.0060], [40.7580, -73.9855]],
  "destinations": [[40.7614, -73.9776]]
}
```
**Response**: 2D array of distances

#### POST /distance/route
**Purpose**: Get route between waypoints
**Request Body**:
```json
{
  "waypoints": [
    [40.7128, -74.0060],
    [40.7580, -73.9855],
    [40.7614, -73.9776]
  ]
}
```
**Response**: Route details with total distance

#### POST /distance/nearby
**Purpose**: Find nearby pets
**Request Body**:
```json
{
  "latitude": 40.7128,
  "longitude": -74.0060,
  "radius_miles": 2.0
}
```
**Response**: Array of nearby pets

#### GET /distance/appointments/:date
**Purpose**: Get appointments for date with location data
**Auth**: Required
**Response**: Appointments with pet coordinates

---

### Route Optimization

#### POST /routes/optimize
**Purpose**: Optimize route for multiple appointments
**Request Body**:
```json
{
  "appointment_ids": [1, 2, 3, 4],
  "start_location": [40.7128, -74.0060]  // Optional
}
```
**Response**: Optimized appointment order with route

#### POST /routes/reorder
**Purpose**: Manually reorder appointments
**Request Body**:
```json
{
  "appointment_ids": [3, 1, 4, 2]
}
```
**Response**: Updated appointments with new order

#### GET /routes/:date
**Purpose**: Get optimized route for specific date
**Auth**: Required
**Response**: Route details for that date

---

### Walk Groups

#### GET /walk_groups/suggestions
**Purpose**: Get suggested walk groupings based on proximity
**Query Params**: `?date=2026-01-15`
**Auth**: Required
**Response**: Array of suggested groups

#### GET /walk_groups
**Purpose**: Get all walk groups
**Auth**: Required
**Response**: Array of walk groups

#### POST /walk_groups
**Purpose**: Create walk group
**Request Body**:
```json
{
  "name": "Morning Group",
  "date": "2026-01-15",
  "appointment_ids": [1, 2, 3]
}
```
**Response**: Created walk group

#### DELETE /walk_groups/:id
**Purpose**: Delete walk group
**Auth**: Required
**Response**: Success message

---

### Training & Certification

#### GET /training_sessions
**Purpose**: Get all training sessions
**Auth**: Required
**Response**: Array of training sessions

#### GET /training_sessions/summary
**Purpose**: Get training statistics summary
**Auth**: Required
**Response**: Hours by type, total hours, etc.

#### GET /training_sessions/export
**Purpose**: Export training sessions (CSV)
**Auth**: Required
**Response**: CSV data

#### POST /training_sessions/sync_from_invoices
**Purpose**: Import training sessions from invoices
**Auth**: Required
**Response**: Created training sessions

#### POST /training_sessions
**Purpose**: Create training session
**Request Body**:
```json
{
  "session_date": "2026-01-15T10:00:00",
  "duration_minutes": 60,
  "session_type": "Solo walk training",
  "pet_id": 1,
  "notes": "Worked on loose leash walking",
  "training_focus": ["Leash skills", "Basic obedience"]
}
```
**Response**: Created training session

#### PATCH /training_sessions/:id
**Purpose**: Update training session
**Auth**: Required
**Response**: Updated training session

#### DELETE /training_sessions/:id
**Purpose**: Delete training session
**Auth**: Required
**Response**: Success message

#### GET /training/dashboard
**Purpose**: Get training dashboard data
**Auth**: Required
**Response**: Dashboard stats (hours, streaks, milestones)

#### GET /training/stats
**Purpose**: Get detailed training statistics
**Auth**: Required
**Response**: Comprehensive training stats

---

### Certification Goals

#### GET /certification_goal
**Purpose**: Get certification goal for current user
**Auth**: Required
**Response**: Certification goal object

#### POST /certification_goal
**Purpose**: Create certification goal
**Request Body**:
```json
{
  "certification_type": "CPDT-KA",
  "target_hours": 300,
  "weekly_goal_hours": 12,
  "target_completion_date": "2026-12-31"
}
```
**Response**: Created goal

#### PATCH /certification_goal
**Purpose**: Update certification goal
**Auth**: Required
**Response**: Updated goal

---

### Milestones

#### GET /milestones
**Purpose**: Get training milestones
**Auth**: Required
**Response**: Array of milestones

#### PATCH /milestones/:id/mark_celebrated
**Purpose**: Mark milestone as celebrated
**Auth**: Required
**Response**: Updated milestone

---

### Blogs

#### GET /blogs
**Purpose**: Get all blog posts
**Auth**: Required
**Response**: Array of blogs

#### POST /blogs
**Purpose**: Create blog post
**Request Body**:
```json
{
  "content": "Today Buddy did great with...",
  "pet_id": 1,
  "training_focus": ["Recall", "Socialization"]
}
```
**Response**: Created blog

#### PATCH /blogs/:id
**Purpose**: Update blog
**Auth**: Required
**Response**: Updated blog

#### DELETE /blogs/:id
**Purpose**: Delete blog
**Auth**: Required
**Response**: Success message

---

### Books

#### GET /books
**Purpose**: Get all books (defaults + user's)
**Auth**: Required
**Response**: Array of books

#### GET /books/my_list
**Purpose**: Get user's reading list
**Auth**: Required
**Response**: Array of books on user's list

#### POST /books/custom
**Purpose**: Add custom book
**Request Body**:
```json
{
  "title": "Custom Dog Training Book",
  "author": "Author Name",
  "category": "Training"
}
```
**Response**: Created book

#### POST /books/:id/add_to_list
**Purpose**: Add default book to user's list
**Auth**: Required
**Response**: User's copy of book

#### PATCH /books/:id
**Purpose**: Update book progress/status
**Request Body**:
```json
{
  "status": "reading",
  "progress_percentage": 45,
  "notes": "Great insights on..."
}
```
**Response**: Updated book

#### DELETE /books/:id
**Purpose**: Remove book from list
**Auth**: Required
**Response**: Success message

---

## Backend Architecture

### Controllers

#### ApplicationController
**Purpose**: Base controller with authentication logic

**Key Methods**:
```ruby
def authorize
  # JWT token authentication (Authorization header)
  # Falls back to session authentication
  # Sets @current_user
end

def current_user
  @current_user
end
```

**Authentication Flow**:
1. Check for Authorization header with JWT token
2. If found, verify token and extract user_id
3. If not found, check session[:user_id]
4. Load user from database
5. Return 401 if authentication fails

**Used By**: All controllers requiring authentication

---

#### AppointmentsController
**Key Actions**:
- `index`: List all user's appointments
- `for_date`: Get appointments for specific date (handles recurring expansion)
- `create`: Create new appointment (auto-calculates price)
- `update`: Update appointment
- `canceled`: Cancel appointment or specific date
- `destroy`: Delete appointment
- `my_earnings`: Calculate earnings statistics
- `team_financials`: Get team sharing financial data
- `pet_appointments`: Get pets with their appointments

**Price Calculation**:
```ruby
def calculate_price(appointment)
  base_price = case appointment.duration
    when 30 then current_user.thirty
    when 45 then current_user.fortyfive
    when 60 then current_user.sixty
  end

  base_price += current_user.solo_rate if appointment.walk_type == 'solo'
  base_price += current_user.training_rate if appointment.walk_type == 'training'
  base_price += current_user.sibling_rate if appointment.walk_type == 'sibling'

  base_price
end
```

---

#### PetsController
**Key Actions**:
- `index`: List pets
- `create`: Create pet + geocode address
- `update`: Update pet + re-geocode if address changed
- `update_active_status`: Toggle active flag
- `destroy`: Delete pet

**Geocoding Integration**:
```ruby
after_create :geocode_address
after_update :geocode_address, if: :saved_change_to_address?

def geocode_address
  result = GeocodingService.geocode(address)
  if result[:success]
    update_columns(
      latitude: result[:latitude],
      longitude: result[:longitude],
      geocoded_at: Time.current,
      geocoding_failed: false
    )
  else
    update_columns(
      geocoding_failed: true,
      geocoding_error: result[:error]
    )
  end
end
```

---

#### DistanceController
**Purpose**: Handle geocoding and distance calculations

**Key Actions**:
- `calculate`: Distance between two points (Haversine formula)
- `matrix`: Distance matrix for multiple points
- `route`: Route calculation with waypoints
- `nearby`: Find nearby pets within radius
- `appointments`: Get appointments with location data

**Algorithm**: Haversine formula for great-circle distance

---

#### RoutesController
**Purpose**: Route optimization for walks

**Key Actions**:
- `optimize`: Optimize appointment order using RouteOptimizerService
- `reorder`: Manual reorder
- `show`: Get route for date

**Optimization Algorithm**:
- Constraint-based greedy algorithm
- Considers: distance, time windows, walk duration
- Minimizes total travel distance
- Respects appointment time constraints

---

#### AppointmentSharesController
**Key Actions**:
- `index`: List all shares (sent/received)
- `my_shared_appointments`: Shares received by current user
- `create`: Share appointment with team member
- `accept`: Accept share (creates walker_earnings)
- `decline`: Decline share
- `destroy`: Remove share

**Authorization**:
- Must have accepted walker_connection to share
- Only recipient can accept/decline
- Only sharer or recipient can destroy

---

#### WalkerConnectionsController
**Key Actions**:
- `index`: List connections
- `create`: Send connection request
- `accept`: Accept request (status → accepted)
- `decline`: Decline request (status → declined)
- `block`: Block user (status → blocked)
- `destroy`: Remove connection

**Validation**:
- Prevents duplicate connections
- Prevents self-connections

---

#### TrainingSessionsController
**Key Actions**:
- `index`: List training sessions
- `summary`: Statistics summary
- `export`: CSV export
- `sync_from_invoices`: Import from invoices
- `create`: Create session (auto-updates milestones)
- `update`: Update session
- `destroy`: Delete session

**Milestone Auto-Creation**:
```ruby
after_create :check_milestones

def check_milestones
  total_hours = user.training_sessions.sum(:duration_minutes) / 60.0
  MILESTONE_HOURS.each do |hours|
    if total_hours >= hours
      user.milestones.find_or_create_by(hours_reached: hours) do |m|
        m.achieved_at = Time.current
      end
    end
  end
end
```

---

### Models

#### User
**Associations**:
```ruby
has_many :pets, dependent: :destroy
has_many :appointments, dependent: :destroy
has_many :training_sessions, dependent: :destroy
has_many :invoices, through: :appointments
has_many :initiated_connections, class_name: 'WalkerConnection',
         foreign_key: 'user_id', dependent: :destroy
has_many :received_connections, class_name: 'WalkerConnection',
         foreign_key: 'connected_user_id', dependent: :destroy
has_many :shared_appointments, class_name: 'AppointmentShare',
         foreign_key: 'shared_by_user_id', dependent: :destroy
has_many :received_appointment_shares, class_name: 'AppointmentShare',
         foreign_key: 'shared_with_user_id', dependent: :destroy
has_one :certification_goal, dependent: :destroy
has_many :milestones, dependent: :destroy
has_many :blogs, dependent: :destroy
has_many :books, dependent: :destroy
has_one_attached :profile_pic
```

**Validations**:
```ruby
validates :username, presence: true, uniqueness: true
validates :email_address, presence: true, uniqueness: true
has_secure_password
```

**Custom Methods**:
```ruby
def connected_walkers
  # Returns accepted connections only
end

def can_share_with?(other_user)
  # Check if accepted connection exists
end
```

---

#### Pet
**Validations**:
```ruby
validates :name, presence: true
validates :user_id, presence: true
validates :latitude, :longitude, numericality: true, allow_nil: true
```

**Callbacks**:
```ruby
after_create :geocode_address
after_update :geocode_address, if: :saved_change_to_address?
```

**Scopes**:
```ruby
scope :active, -> { where(active: true) }
scope :with_coordinates, -> { where.not(latitude: nil, longitude: nil) }
```

---

#### Appointment
**Validations**:
```ruby
validates :user_id, :pet_id, presence: true
validates :duration, inclusion: { in: [30, 45, 60] }
validate :recurring_or_dated  # Must have appointment_date OR recurring=true
```

**Callbacks**:
```ruby
before_save :calculate_price
```

**Instance Methods**:
```ruby
def occurs_on_date?(date)
  # For recurring: check day-of-week flags
  # For one-time: check appointment_date
end

def canceled_on?(date)
  cancellations.exists?(date: date)
end
```

---

#### Invoice
**Validations**:
```ruby
validates :appointment_id, :pet_id, :date_completed, :compensation, presence: true
validates :compensation, numericality: { greater_than: 0 }
```

**Callbacks**:
```ruby
after_create :create_training_session, if: :training_related?
```

---

### Services

#### GeocodingService
**Purpose**: Convert addresses to coordinates

**Implementation**:
```ruby
class GeocodingService
  def self.geocode(address)
    # Use Nominatim (OpenStreetMap) API
    # Free, no API key required
    # Rate limited: 1 request/second

    url = "https://nominatim.openstreetmap.org/search"
    params = {
      q: address,
      format: 'json',
      limit: 1
    }

    response = HTTParty.get(url, query: params, headers: { 'User-Agent' => 'DogWalkingApp' })

    if response.success? && response.parsed_response.any?
      result = response.parsed_response.first
      {
        success: true,
        latitude: result['lat'].to_f,
        longitude: result['lon'].to_f
      }
    else
      {
        success: false,
        error: 'Geocoding failed'
      }
    end
  rescue => e
    {
      success: false,
      error: e.message
    }
  end
end
```

**Fallback**: If geocoding fails, pet saved without coordinates (features degrade gracefully)

---

#### DistanceCalculator
**Purpose**: Calculate distances between coordinates

**Haversine Formula Implementation**:
```ruby
class DistanceCalculator
  EARTH_RADIUS_MILES = 3959.0

  def self.distance(lat1, lon1, lat2, lon2)
    dLat = to_radians(lat2 - lat1)
    dLon = to_radians(lon2 - lon1)

    a = Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(to_radians(lat1)) * Math.cos(to_radians(lat2)) *
        Math.sin(dLon/2) * Math.sin(dLon/2)

    c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))

    EARTH_RADIUS_MILES * c
  end

  def self.to_radians(degrees)
    degrees * Math::PI / 180
  end
end
```

**Returns**: Distance in miles

---

#### RouteOptimizerService
**Purpose**: Optimize walk routes using constraint-based algorithm

**Algorithm**:
1. Start with unvisited appointments
2. Select next appointment based on:
   - Closest to current location (distance)
   - Respects time windows
   - Minimizes backtracking
3. Repeat until all appointments visited
4. Return optimized order + total distance

**Constraints**:
- Time windows (appointment start/end times)
- Walk duration
- Travel time between locations

---

#### WalkGroupingService
**Purpose**: Suggest walk groupings based on proximity

**Algorithm**:
1. Get all appointments for date with coordinates
2. Calculate distance matrix between all pets
3. Cluster appointments within threshold distance (e.g., 0.5 miles)
4. Group appointments with similar time windows
5. Return suggested groups

**Output**: Array of suggested groups with distance savings

---

### Serializers

#### UserSerializer
**Purpose**: Format user data for API responses

**Includes**:
```ruby
attributes :id, :username, :name, :email_address,
           :thirty, :fortyfive, :sixty,
           :solo_rate, :training_rate, :sibling_rate

has_many :pets
has_many :appointments
has_many :invoices
has_many :training_sessions
has_many :walker_connections
has_many :appointment_shares
has_one :certification_goal
has_many :milestones

def profile_pic_url
  if object.profile_pic.attached?
    Rails.application.routes.url_helpers.rails_blob_url(object.profile_pic)
  else
    nil
  end
end
```

**Response Example**:
```json
{
  "id": 1,
  "username": "walker123",
  "name": "Jane Doe",
  "email_address": "jane@example.com",
  "thirty": 25,
  "fortyfive": 35,
  "sixty": 45,
  "solo_rate": 10,
  "training_rate": 15,
  "sibling_rate": 5,
  "profile_pic_url": "https://s3.amazonaws.com/...",
  "pets": [...],
  "appointments": [...],
  "invoices": [...]
}
```

---

#### PetSerializer
**Attributes**:
```ruby
attributes :id, :user_id, :name, :birthdate, :sex,
           :spayed_neutered, :address, :latitude, :longitude,
           :behavioral_notes, :supplies_location, :allergies,
           :active, :origin_trainer, :geocoded_at,
           :geocoding_failed, :geocoding_error

def profile_pic_url
  # S3 URL if attached
end
```

---

#### AppointmentSerializer
**Includes**:
```ruby
attributes :id, :user_id, :pet_id, :recurring,
           :appointment_date, :start_time, :end_time,
           :duration, :price, :monday, :tuesday, :wednesday,
           :thursday, :friday, :saturday, :sunday,
           :completed, :canceled, :walk_type,
           :delegation_status, :completed_by_user_id,
           :walk_group_id

belongs_to :pet
belongs_to :user
belongs_to :completed_by_user, class_name: 'User'
has_many :cancellations
has_many :appointment_shares
```

---

## Frontend Architecture

### Component Hierarchy

```
App (Root)
├── UserProvider (Context)
├── Toaster (Notifications)
├── Routes
│   ├── Unauthenticated Routes
│   │   ├── Landing
│   │   ├── Login
│   │   └── Signup
│   │
│   └── Authenticated Routes
│       ├── Dashboard (Home)
│       │   ├── GroupSuggestionsPanel
│       │   ├── TodayStats
│       │   └── TeamOverview
│       │
│       ├── TodaysWalks
│       │   ├── WalksMapView (Leaflet)
│       │   ├── RouteJourneyPanel
│       │   ├── CancellationModal
│       │   └── AppointmentList
│       │
│       ├── PetsPage
│       │   ├── PetList
│       │   ├── PetInvoices
│       │   ├── CreatePetButton
│       │   └── PetDetailModal
│       │
│       ├── TeamAndShares
│       │   ├── MyTeam (WalkerConnections)
│       │   └── SharedAppointments
│       │
│       ├── MyEarnings
│       │   ├── EarningsFilters
│       │   ├── InvoiceList
│       │   └── EarningsCharts
│       │
│       └── Profile
│           ├── UserInfo
│           ├── RateSettings
│           └── YearlyFinanceOverview
│
└── BottomNav (Navigation)
```

---

### State Management (UserContext)

**File**: `client/src/context/user.js`

**Purpose**: Global state for authenticated user and associated data

**State**:
```javascript
{
  user: {
    id, username, name, email_address,
    thirty, fortyfive, sixty, solo_rate, training_rate, sibling_rate,
    profile_pic_url,
    pets: [...],
    appointments: [...],
    invoices: [...],
    training_sessions: [...],
    walker_connections: [...],
    appointment_shares: [...],
    certification_goal: {...},
    milestones: [...]
  },
  loading: boolean
}
```

**Context Methods** (Optimized for Performance):
```javascript
// Smart updates - prevent full state replacement
updateAppointment(updatedAppointment)
addAppointment(newAppointment)
removeAppointment(appointmentId)

addInvoice(newInvoice)

addPet(newPet)
updatePet(updatedPet)
removePet(petId)

refreshUser()  // Full re-fetch from /me
```

**Performance Optimization**:
- Uses `useCallback` to memoize update functions
- Updates specific arrays without replacing entire user object
- Prevents unnecessary re-renders
- Only `refreshUser` does full API call

**Usage Pattern**:
```javascript
import { useContext } from 'react';
import { UserContext } from '../context/user';

function MyComponent() {
  const { user, updateAppointment } = useContext(UserContext);

  // Update appointment optimistically
  const handleComplete = (appointment) => {
    updateAppointment({ ...appointment, completed: true });
  };
}
```

---

### Routing

**File**: `client/src/App.js`

**Route Structure**:
```javascript
// Unauthenticated
<Route path="/login" element={<Login />} />
<Route path="/signup" element={<Signup />} />
<Route path="*" element={<Landing />} />

// Authenticated (requires user in UserContext)
<Route path="/todays-walks" element={<TodaysWalks />} />
<Route path="/pets-page" element={<PetsPage />} />
<Route path="/team" element={<TeamAndShares />} />
<Route path="/my-earnings" element={<MyEarnings />} />
<Route path="/profile" element={<Profile />} />
<Route path="*" element={<Dashboard />} />  // Default home
```

**Code Splitting**: All route components lazy-loaded
```javascript
const Dashboard = lazy(() => import("./components/Dashboard"));
```

**Loading States**: Suspense with LoadingScreen fallback

---

### Key Components

#### Dashboard
**Purpose**: Home overview page

**Features**:
- Today's appointments summary
- Team member list
- Walk grouping suggestions
- Quick stats (earnings, walks completed, training hours)

**API Calls**:
- None (uses UserContext data)

---

#### TodaysWalks
**Purpose**: Daily appointment view with map

**Features**:
- Date selector
- Map view of walk locations (Leaflet)
- Appointment list with complete/cancel actions
- Route optimization suggestions
- Filter: owned vs covering appointments

**Components**:
- `WalksMapView`: Leaflet map showing pet locations
- `RouteJourneyPanel`: Optimized route display
- `CancellationModal`: Cancel appointment dialog

**API Calls**:
- GET `/appointments/for_date?date=YYYY-MM-DD`
- POST `/routes/optimize` (for route suggestions)
- PATCH `/appointments/:id/canceled`
- POST `/invoices` (when completing walk)

**Map Integration**:
```javascript
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';

<MapContainer center={[lat, lng]} zoom={13}>
  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
  {appointments.map(apt => (
    <Marker position={[apt.pet.latitude, apt.pet.longitude]}>
      <Popup>{apt.pet.name}</Popup>
    </Marker>
  ))}
</MapContainer>
```

---

#### PetsPage
**Purpose**: Pet management

**Features**:
- Pet list (active/inactive filter)
- Create/edit pet profiles
- View pet invoices
- Upload pet photos

**Components**:
- `CreatePetButton`: Modal form for new pet
- `PetInvoices`: Invoice history per pet

**API Calls**:
- GET `/pets`
- POST `/pets` (with photo upload)
- PATCH `/pets/:id`
- PATCH `/pets/:id/active`
- DELETE `/pets/:id`

**Photo Upload**:
```javascript
const formData = new FormData();
formData.append('name', petName);
formData.append('profile_pic', imageFile);

fetch('/pets', {
  method: 'POST',
  body: formData
});
```

---

#### TeamAndShares
**Purpose**: Team coordination

**Features**:
- Walker connections (search, connect, accept/decline)
- Shared appointments (view, accept, decline)
- Team earnings tracking

**Components**:
- `MyTeam`: Connection management
- `SharedAppointments`: Incoming/outgoing shares

**API Calls**:
- GET `/walker_connections`
- POST `/walker_connections`
- PATCH `/walker_connections/:id/accept`
- GET `/appointment_shares/my_shared_appointments`
- POST `/appointment_shares`
- PATCH `/appointment_shares/:id/accept`

---

#### MyEarnings
**Purpose**: Financial reports

**Features**:
- Invoice list (filterable by pet, date range, paid status)
- Earnings charts (by month, by pet, by type)
- Mark invoices as paid/pending
- Export options

**API Calls**:
- GET `/invoices`
- PATCH `/invoices/paid`
- PATCH `/invoices/pending`

**Charts**: Uses Chart.js via react-chartjs-2

---

#### Profile
**Purpose**: User settings and annual review

**Features**:
- Update profile info
- Change rates (30/45/60 min, premiums)
- Upload profile picture
- Yearly finance overview

**Components**:
- `YearlyFinanceOverview`: Annual financial stats with year selector

**API Calls**:
- PATCH `/change_rates`
- PATCH `/update_profile`

---

#### YearlyFinanceOverview
**Purpose**: Annual financial statistics and projections

**Features**:
- Year selector (previous/next buttons)
- Total income for selected year
- Weekly income chart (52 weeks)
- Recurring revenue projection
- Monthly/weekly averages
- Tax estimate (adjustable rate)

**Calculations**:
- Historical years: Full year stats (365/366 days)
- Current year: Year-to-date + projected annual total
- Daily average = Total / Days
- Weekly average = Daily × 7
- Monthly average = Daily × 30.44
- Yearly projection = Daily × 365

**Chart**: Custom bar chart with styled-components

**Year Navigation**:
- Can view any previous year
- Cannot view future years
- Forward button disabled when at current year

**Plugins**:
```javascript
import dayjs from 'dayjs';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import isLeapYear from 'dayjs/plugin/isLeapYear';

dayjs.extend(weekOfYear);
dayjs.extend(isLeapYear);
```

---

### Custom Hooks

#### useConfirm
**File**: `client/src/hooks/useConfirm.js`

**Purpose**: Confirmation dialogs

**Usage**:
```javascript
const { ConfirmModal, confirm } = useConfirm();

const handleDelete = async () => {
  const confirmed = await confirm('Delete this pet?');
  if (confirmed) {
    // Proceed with deletion
  }
};

return (
  <>
    <button onClick={handleDelete}>Delete</button>
    <ConfirmModal />
  </>
);
```

---

### Styling

**Library**: styled-components 6.1.1

**Pattern**: Co-located styles with components

**Example**:
```javascript
import styled from 'styled-components';

const Container = styled.div`
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  padding: 24px;
`;

const Header = styled.h2`
  font-family: 'Poppins', sans-serif;
  font-size: 1.3rem;
  color: #ffffff;
`;
```

**Theme**: Purple/teal gradient with glassmorphism effects

**Responsive**: Mobile-first with @media queries

---

### Notifications

**Library**: react-hot-toast

**Configuration**:
```javascript
<Toaster
  position="top-right"
  toastOptions={{
    duration: 4000,
    style: {
      background: '#363636',
      color: '#fff',
    },
    success: {
      iconTheme: {
        primary: '#10b981',
      },
    },
    error: {
      iconTheme: {
        primary: '#ef4444',
      },
    },
  }}
/>
```

**Usage**:
```javascript
import toast from 'react-hot-toast';

toast.success('Appointment created!');
toast.error('Failed to save pet');
```

---

## Authentication & Authorization

### JWT Token Authentication

**Flow**:
1. User submits login form (POST `/login`)
2. Backend validates credentials
3. Backend generates JWT token:
   ```ruby
   payload = { user_id: user.id }
   token = JWT.encode(payload, Rails.application.credentials.secret_key_base)
   ```
4. Backend returns token in response
5. Frontend stores token (localStorage or sessionStorage)
6. Frontend includes token in Authorization header:
   ```
   Authorization: Bearer <token>
   ```
7. Backend verifies token on protected routes

**Token Contents**:
```json
{
  "user_id": 123
}
```

**No Expiration**: Tokens currently don't expire (technical debt)

---

### Session Authentication (Fallback)

**Flow**:
1. User submits login form
2. Backend validates credentials
3. Backend creates session:
   ```ruby
   session[:user_id] = user.id
   ```
4. Session cookie sent automatically by browser
5. Backend checks session[:user_id] if no JWT found

**Used For**:
- Web browsers without token storage
- Development/testing

---

### Authorization Patterns

**Row-Level Security**:
```ruby
# Users can only access their own resources
def index
  @pets = current_user.pets
end

def show
  @pet = current_user.pets.find(params[:id])
  # Raises ActiveRecord::RecordNotFound if not owned by user
end
```

**Team Features**:
```ruby
# Can only share with connected walkers
def create
  recipient = User.find(params[:shared_with_user_id])
  unless current_user.can_share_with?(recipient)
    render json: { error: 'Not connected' }, status: :forbidden
    return
  end
  # ...
end
```

**Ownership Checks**:
```ruby
# Only appointment owner or covering walker can update
def update
  appointment = Appointment.find(params[:id])
  unless appointment.user == current_user ||
         appointment.completed_by_user == current_user
    render json: { error: 'Unauthorized' }, status: :forbidden
    return
  end
  # ...
end
```

---

## Key Features Deep Dive

### Appointment Management

#### Recurring Appointments

**Data Model**:
- `recurring = true`
- `appointment_date = null`
- Day-of-week flags: `monday`, `tuesday`, `wednesday`, etc.
- `start_time` and `end_time` for each occurrence

**Frontend Expansion**:
```javascript
function expandRecurringAppointments(appointment, startDate, endDate) {
  if (!appointment.recurring) return [appointment];

  const instances = [];
  const current = dayjs(startDate);

  while (current.isBefore(endDate)) {
    const dayName = current.format('dddd').toLowerCase();

    if (appointment[dayName]) {
      instances.push({
        ...appointment,
        appointment_date: current.format('YYYY-MM-DD'),
      });
    }

    current = current.add(1, 'day');
  }

  return instances;
}
```

**Cancellations**:
- Recurring appointments can be canceled for specific dates
- Creates `Cancellation` record with date
- Frontend filters out canceled dates when expanding

---

#### One-Time Appointments

**Data Model**:
- `recurring = false`
- `appointment_date` set to specific date/time
- No day-of-week flags

**Simple Display**:
- No expansion needed
- Check `canceled` flag

---

#### Walk Types

**Options**:
- `solo`: One-on-one walk (+ solo premium)
- `group`: Walk with multiple dogs
- `training`: Training session (+ training premium)
- `sibling`: Walk with dog's sibling (+ sibling premium)

**Price Calculation**:
```javascript
let price = user[`${duration}`];  // thirty/fortyfive/sixty

if (walkType === 'solo') price += user.solo_rate;
if (walkType === 'training') price += user.training_rate;
if (walkType === 'sibling') price += user.sibling_rate;
```

---

### Team Sharing & Delegation

#### Connection Flow

1. **Send Request**:
   ```javascript
   POST /walker_connections
   { connected_user_id: 2 }
   // Creates connection with status: 'pending'
   ```

2. **Recipient Receives**:
   - Shows in "Connection Requests" section
   - Can accept or decline

3. **Accept**:
   ```javascript
   PATCH /walker_connections/:id/accept
   // Updates status to 'accepted'
   ```

4. **Now Connected**:
   - Can share appointments
   - Can view each other's availability
   - Appears in team list

---

#### Appointment Sharing Flow

1. **Share Appointment**:
   ```javascript
   POST /appointment_shares
   {
     appointment_id: 1,
     shared_with_user_id: 2,
     covering_walker_percentage: 60,
     share_dates: ['2026-01-15', '2026-01-17']  // For recurring
   }
   ```

2. **Recipient Sees Share**:
   - Shows in "Shared Appointments" tab
   - Can see details, percentage split, dates

3. **Accept Share**:
   ```javascript
   PATCH /appointment_shares/:id/accept
   ```

   Backend creates:
   - `walker_earnings` records for covering walker
   - Updates appointment `delegation_status`

4. **Complete Walk**:
   - Covering walker completes appointment
   - Creates invoice with `is_shared = true`
   - Calculates split amounts:
     ```ruby
     walker_amount = total * (covering_percentage / 100.0)
     owner_amount = total - walker_amount
     ```

---

### Route Optimization

#### Algorithm Overview

**Service**: RouteOptimizerService

**Input**:
- Array of appointment_ids
- Optional start location

**Process**:
1. Load appointments with pet coordinates
2. Build distance matrix (all-pairs distances)
3. Apply constraint-based greedy algorithm:
   ```
   current_location = start_location
   unvisited = all_appointments
   route = []

   while unvisited not empty:
     candidates = unvisited.filter(apt => time_window_valid(apt))
     next = candidates.min_by(apt => distance(current_location, apt.location))
     route.push(next)
     unvisited.remove(next)
     current_location = next.location
   ```

4. Calculate total distance
5. Return optimized order

**Constraints**:
- Time windows (appointment start/end times)
- Walk duration
- Travel time estimates

**Output**:
```json
{
  "route": [
    { "appointment_id": 3, "order": 1, "distance_from_previous": 0 },
    { "appointment_id": 1, "order": 2, "distance_from_previous": 0.8 },
    { "appointment_id": 4, "order": 3, "distance_from_previous": 1.2 },
    { "appointment_id": 2, "order": 4, "distance_from_previous": 0.5 }
  ],
  "total_distance": 2.5,
  "estimated_travel_time": 15
}
```

---

### Walk Grouping

**Service**: WalkGroupingService

**Purpose**: Suggest which walks could be grouped based on proximity

**Algorithm**:
1. Get all appointments for date with coordinates
2. Calculate distance matrix
3. Find clusters where all pets within threshold (e.g., 0.5 miles)
4. Filter clusters by compatible time windows
5. Return suggested groups

**Output**:
```json
{
  "suggestions": [
    {
      "name": "North Side Group",
      "appointment_ids": [1, 3, 7],
      "average_distance": 0.3,
      "time_savings": 15,
      "estimated_group_time": 45
    },
    {
      "name": "Downtown Group",
      "appointment_ids": [2, 5],
      "average_distance": 0.2,
      "time_savings": 10,
      "estimated_group_time": 30
    }
  ]
}
```

**User Action**:
- Can create WalkGroup from suggestion
- All appointments in group tagged with `walk_group_id`
- Group displayed together on map/list

---

### Training & Certification

#### Training Session Tracking

**Purpose**: Track hours toward certifications (e.g., CPDT-KA requires 300 hours)

**Session Types**:
- Solo walk training (hands-on with one dog)
- Pack walk training (multiple dogs)
- Group class (teaching/observing)
- Private lesson (one-on-one instruction)
- Seminar/workshop (educational event)
- Self-study (reading, videos)
- Other

**Import from Invoices**:
```javascript
POST /training_sessions/sync_from_invoices
// Automatically creates training sessions from training-type invoices
```

**Manual Entry**:
```javascript
POST /training_sessions
{
  session_date: '2026-01-15T10:00:00',
  duration_minutes: 60,
  session_type: 'Solo walk training',
  pet_id: 1,
  notes: 'Worked on loose leash walking',
  training_focus: ['Leash skills', 'Basic obedience']
}
```

---

#### Milestone System

**Automatic Creation**:
- Backend monitors total training hours
- Creates milestones at: 5, 10, 25, 50, 100, 150, 200, 250, 300+ hours
- Sets `celebrated = false` initially

**Frontend Display**:
- Shows "Congratulations!" modal on milestone achievement
- User marks as celebrated (dismisses modal)
- `celebrated = true` prevents showing again

**Query for Next Milestone**:
```javascript
const totalHours = user.training_sessions.reduce((sum, s) => sum + s.duration_minutes / 60, 0);
const milestoneHours = [5, 10, 25, 50, 100, 150, 200, 250, 300];
const nextMilestone = milestoneHours.find(h => h > totalHours);
```

---

#### Certification Goal

**Setup**:
```javascript
POST /certification_goal
{
  certification_type: 'CPDT-KA',
  target_hours: 300,
  weekly_goal_hours: 12,
  target_completion_date: '2026-12-31'
}
```

**Dashboard Display**:
- Progress bar: `current_hours / target_hours`
- Weeks remaining: `weeks_until(target_completion_date)`
- On pace? `(current_hours / weeks_passed) >= weekly_goal_hours`
- Projected completion: `weeks_remaining * average_weekly_hours`

---

### Geocoding & Mapping

#### Address → Coordinates

**When**: Pet created or address updated

**Service**: GeocodingService

**API**: Nominatim (OpenStreetMap)
- Free, no API key
- Rate limit: 1 req/second
- User-Agent required

**Request**:
```
GET https://nominatim.openstreetmap.org/search
  ?q=123 Main St, City, State
  &format=json
  &limit=1
```

**Response**:
```json
[{
  "lat": "40.7128",
  "lon": "-74.0060",
  "display_name": "123 Main St, City, State, USA"
}]
```

**Stored**:
- `latitude`, `longitude` on Pet
- `geocoded_at` timestamp
- `geocoding_failed`, `geocoding_error` for debugging

**Graceful Degradation**:
- If geocoding fails, pet still saved
- Map features disabled for that pet
- Error message shown to user

---

#### Distance Calculation

**Formula**: Haversine (great-circle distance)

**Implementation**:
```ruby
def distance(lat1, lon1, lat2, lon2)
  dLat = to_radians(lat2 - lat1)
  dLon = to_radians(lon2 - lon1)

  a = sin(dLat/2)² + cos(lat1) * cos(lat2) * sin(dLon/2)²
  c = 2 * atan2(√a, √(1-a))

  EARTH_RADIUS_MILES * c
end
```

**Accuracy**: ±0.5% for typical distances (<1000 miles)

---

#### Map Display

**Library**: Leaflet + react-leaflet

**Tile Layer**: OpenStreetMap (free)

**Basic Setup**:
```javascript
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';

<MapContainer center={[40.7128, -74.0060]} zoom={13}>
  <TileLayer
    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
    attribution='&copy; OpenStreetMap contributors'
  />

  {pets.map(pet => (
    <Marker
      key={pet.id}
      position={[pet.latitude, pet.longitude]}
    >
      <Popup>{pet.name}</Popup>
    </Marker>
  ))}

  {routeCoordinates && (
    <Polyline positions={routeCoordinates} color="blue" />
  )}
</MapContainer>
```

**Custom Markers**: Can use custom icons for different walk types

---

## Important Patterns & Conventions

### API Response Format

**Success (200)**:
```json
{
  "id": 1,
  "name": "Buddy",
  ...
}
```

**Created (201)**:
```json
{
  "id": 1,
  "name": "Buddy",
  ...
}
```

**Validation Error (422)**:
```json
{
  "errors": ["Name can't be blank", "Email has already been taken"]
}
```

**Authentication Error (401)**:
```json
{
  "error": "Not authorized"
}
```

**Authorization Error (403)**:
```json
{
  "error": "You cannot access this resource"
}
```

**Not Found (404)**:
```json
{
  "error": "Record not found"
}
```

---

### Frontend Patterns

#### API Calls

**Pattern**:
```javascript
async function createPet(petData) {
  const response = await fetch('/pets', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`  // If using JWT
    },
    body: JSON.stringify(petData)
  });

  if (response.ok) {
    const pet = await response.json();
    toast.success('Pet created!');
    addPet(pet);  // Update context
    return pet;
  } else {
    const data = await response.json();
    toast.error(data.error || 'Failed to create pet');
    throw new Error(data.error);
  }
}
```

#### Optimistic Updates

**Pattern**:
```javascript
function handleComplete(appointment) {
  // Update UI immediately (optimistic)
  updateAppointment({ ...appointment, completed: true });

  // Send request
  fetch(`/appointments/${appointment.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ completed: true })
  })
    .then(response => {
      if (!response.ok) {
        // Revert on error
        updateAppointment(appointment);
        toast.error('Failed to complete appointment');
      }
    });
}
```

#### Form Handling

**Pattern**:
```javascript
const [formData, setFormData] = useState({
  name: '',
  address: '',
  behavioral_notes: ''
});

function handleChange(e) {
  setFormData({
    ...formData,
    [e.target.name]: e.target.value
  });
}

async function handleSubmit(e) {
  e.preventDefault();

  try {
    await createPet(formData);
    setFormData({ name: '', address: '', behavioral_notes: '' });
  } catch (error) {
    // Error already toasted in createPet
  }
}
```

---

### Backend Patterns

#### Controller Standard Structure

```ruby
class PetsController < ApplicationController
  before_action :authorize  # Require authentication
  before_action :set_pet, only: [:show, :update, :destroy]

  def index
    pets = current_user.pets
    render json: pets
  end

  def show
    render json: @pet
  end

  def create
    pet = current_user.pets.build(pet_params)

    if pet.save
      render json: pet, status: :created
    else
      render json: { errors: pet.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    if @pet.update(pet_params)
      render json: @pet
    else
      render json: { errors: @pet.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    @pet.destroy
    head :no_content
  end

  private

  def set_pet
    @pet = current_user.pets.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'Pet not found' }, status: :not_found
  end

  def pet_params
    params.permit(:name, :address, :behavioral_notes, :active, ...)
  end
end
```

---

#### Serializer Pattern

**Purpose**: Prevent N+1 queries, control API response format

**Implementation**:
```ruby
class UserSerializer < ActiveModel::Serializer
  attributes :id, :username, :name, :email_address

  has_many :pets
  has_many :appointments
  has_many :invoices

  # Eager loading automatically handled
end
```

**Controller**:
```ruby
def show
  render json: current_user  # Uses UserSerializer
end
```

**Result**: Single query with proper joins, no N+1

---

#### Service Object Pattern

**Purpose**: Extract complex business logic from models/controllers

**Structure**:
```ruby
class RouteOptimizerService
  def initialize(appointments, start_location = nil)
    @appointments = appointments
    @start_location = start_location
  end

  def optimize
    # Complex algorithm here
    build_distance_matrix
    apply_greedy_algorithm
    calculate_total_distance

    {
      route: @optimized_route,
      total_distance: @total_distance
    }
  end

  private

  def build_distance_matrix
    # ...
  end

  def apply_greedy_algorithm
    # ...
  end

  def calculate_total_distance
    # ...
  end
end
```

**Usage**:
```ruby
optimizer = RouteOptimizerService.new(appointments, start_location)
result = optimizer.optimize
```

---

## Common Tasks

### Add New Model

1. **Generate Migration**:
   ```bash
   rails g model Thing name:string user:references
   ```

2. **Update Model**:
   ```ruby
   # app/models/thing.rb
   class Thing < ApplicationRecord
     belongs_to :user
     validates :name, presence: true
   end
   ```

3. **Update Associations**:
   ```ruby
   # app/models/user.rb
   has_many :things, dependent: :destroy
   ```

4. **Run Migration**:
   ```bash
   rails db:migrate
   ```

5. **Create Serializer**:
   ```ruby
   # app/serializers/thing_serializer.rb
   class ThingSerializer < ActiveModel::Serializer
     attributes :id, :name, :created_at
     belongs_to :user
   end
   ```

6. **Create Controller**:
   ```ruby
   # app/controllers/things_controller.rb
   class ThingsController < ApplicationController
     before_action :authorize

     def index
       render json: current_user.things
     end

     # ... CRUD actions
   end
   ```

7. **Add Routes**:
   ```ruby
   # config/routes.rb
   resources :things
   ```

8. **Update UserSerializer**:
   ```ruby
   # app/serializers/user_serializer.rb
   has_many :things
   ```

9. **Frontend: Add to UserContext** (if needed)

10. **Create React Component**

---

### Add New API Endpoint

1. **Add Route**:
   ```ruby
   # config/routes.rb
   get '/custom_endpoint', to: 'controller#action'
   ```

2. **Add Controller Action**:
   ```ruby
   def action
     # Logic here
     render json: { result: data }
   end
   ```

3. **Test**: `curl http://localhost:3000/custom_endpoint`

---

### Deploy New Feature

1. **Backend Changes**:
   - Migrations, models, controllers, routes
   - Commit and push

2. **Frontend Changes**:
   - Components, context updates
   - Commit and push

3. **Test Locally**:
   ```bash
   rails s  # Port 3000
   cd client && npm start  # Port 4000
   ```

4. **Production Deploy**:
   - Push to main branch
   - Heroku/deployment platform auto-deploys
   - Run migrations: `heroku run rails db:migrate`

---

## Development Workflow

### Setup

1. **Clone Repo**:
   ```bash
   git clone <repo-url>
   cd dog-walking-app
   ```

2. **Install Backend Dependencies**:
   ```bash
   bundle install
   ```

3. **Install Frontend Dependencies**:
   ```bash
   cd client
   npm install
   cd ..
   ```

4. **Setup Database**:
   ```bash
   rails db:create
   rails db:migrate
   rails db:seed  # Optional
   ```

5. **Start Servers**:
   ```bash
   # Terminal 1: Backend
   rails s

   # Terminal 2: Frontend
   cd client
   npm start
   ```

6. **Open App**: http://localhost:4000

---

### Testing

#### Backend (RSpec)

```bash
# Run all tests
rspec

# Run specific file
rspec spec/models/user_spec.rb

# Run with coverage
COVERAGE=true rspec
```

#### Frontend (Jest)

```bash
cd client

# Run all tests
npm test

# Run with coverage
npm test -- --coverage
```

---

### Database

#### Create Migration

```bash
rails g migration AddFieldToModel field:type
```

#### Run Migrations

```bash
rails db:migrate
```

#### Rollback

```bash
rails db:rollback
```

#### Reset Database

```bash
rails db:reset  # Drop, create, migrate, seed
```

#### Console

```bash
rails c

# Query examples
User.first
Pet.where(active: true)
Appointment.includes(:pet).where(recurring: true)
```

---

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes, commit
git add .
git commit -m "Add new feature"

# Push to remote
git push origin feature/new-feature

# Create pull request on GitHub
# After review, merge to main
```

---

### Environment Variables

**Development**: `.env` file (not committed)

```bash
DATABASE_URL=postgresql://localhost/dog_walking_app_development
SECRET_KEY_BASE=<generated-secret>
AWS_ACCESS_KEY_ID=<aws-key>
AWS_SECRET_ACCESS_KEY=<aws-secret>
AWS_REGION=us-east-1
AWS_BUCKET=dog-walking-app-dev
```

**Production**: Set on hosting platform (Heroku, etc.)

---

## Technical Debt & Future Improvements

### Known Issues

1. **JWT Token Expiration**: Tokens don't expire (security risk)
   - **Fix**: Add `exp` claim, implement refresh token flow

2. **Public /users Endpoint**: Anyone can list all users
   - **Fix**: Restrict to search endpoint with authentication

3. **No Rate Limiting**: API vulnerable to abuse
   - **Fix**: Add rack-attack gem

4. **Geocoding Synchronous**: Blocks request during geocoding
   - **Fix**: Move to background job (Sidekiq)

5. **No Pagination on Large Lists**: Could cause performance issues
   - **Fix**: Kaminari already installed, apply to all list endpoints

---

### Future Features

1. **Mobile App**: React Native version
2. **Payment Integration**: Stripe/PayPal for invoice payments
3. **SMS Notifications**: Twilio for appointment reminders
4. **Calendar Sync**: iCal/Google Calendar integration
5. **Weather Integration**: Show weather for walk times
6. **Advanced Analytics**: Business insights dashboard
7. **Multi-Walker Routes**: Coordinate routes across team
8. **Client Portal**: Allow pet owners to book/view appointments

---

## Conclusion

This document provides comprehensive context for understanding and working with the Dog Walking App codebase. For specific implementation details, refer to the source code and inline comments.

**Key Principles**:
- RESTful API design
- Row-level security
- Optimistic UI updates
- Service object pattern for complex logic
- Context for global state
- Graceful degradation (e.g., geocoding failures)

**When Making Changes**:
1. Understand the feature's impact on related systems
2. Update both backend and frontend
3. Test authentication/authorization
4. Consider mobile responsiveness
5. Update this document if architecture changes

---

**Generated**: January 2, 2026
**Author**: Claude (Anthropic AI Assistant)
**For**: Dog Walking App Development Team
