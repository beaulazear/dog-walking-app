# Claude Session Kickoff - Scoop Backend (Rails API)

**Use this prompt to start new Claude Code sessions for the backend API**

---

## 🚂 Project Context

I'm working on **Scoop Backend** - a Ruby on Rails API for an on-demand dog waste cleanup marketplace.

**What it does**: API backend for mobile app where residents post cleanup jobs and scoopers claim them for payment.

**Current Version**: Production deployment on Render
**Tech Stack**: Ruby 3.3.0, Rails 7.2.2, PostgreSQL, Action Cable (WebSockets), Active Storage
**API Base URL**: https://www.pocket-walks.com
**Frontend**: React Native mobile app at `/Users/beaulazear/Desktop/scoop-mobile`
**Project Location**: `/Users/beaulazear/Desktop/dog-walking-app`

---

## 🎯 Current Status (Feb 20, 2026)

**Deployment**: Live on Render (https://www.pocket-walks.com)
**Database**: PostgreSQL with PostGIS (for geospatial features)
**Real-time**: Action Cable WebSockets working
**Authentication**: JWT tokens (bcrypt password hashing)

### What's Working
- ✅ User authentication (scoopers & residents)
- ✅ Job CRUD operations
- ✅ Job lifecycle (claim → en_route → arrive → cleaning → complete)
- ✅ Real-time job updates via Action Cable
- ✅ Photo uploads (Active Storage)
- ✅ Job filtering & search
- ✅ Webhook support for mobile notifications

### What's Pending
- [ ] Payment processing (Stripe Connect)
- [ ] Email notifications
- [ ] Admin dashboard
- [ ] Analytics & reporting
- [ ] Block-based features (legacy)

---

## 🏗️ Architecture

### Key Directories
```
/app/
  /controllers/
    /api/
      jobs_controller.rb       - Job CRUD & lifecycle
      sessions_controller.rb   - Scooper auth
      clients_controller.rb    - Resident auth
      registrations_controller.rb - Signup

  /models/
    user.rb          - Both scoopers & residents
    job.rb           - Cleanup jobs
    job_photo.rb     - Job completion photos

  /channels/
    jobs_channel.rb  - Real-time job updates

  /services/
    job_lifecycle_service.rb  - Job state transitions

/config/
  routes.rb        - API routes
  cable.yml        - Action Cable config
  database.yml     - Database config

/db/
  /migrate/        - Database migrations
  schema.rb        - Current schema
```

---

## 🔐 Authentication

### Two User Types (Single `users` table)

**Scoopers** (Service providers):
- `is_scooper: true`
- Login: `POST /login` (username + password)
- Signup: `POST /signup`
- Profile: `GET /me`

**Residents** (Job posters):
- `is_scooper: false`
- Login: `POST /client/login` (email + password)
- Signup: `POST /client/signup`
- Profile: `GET /client/me`

### JWT Authentication
```ruby
# Generate token on login
token = JWT.encode({ user_id: user.id }, Rails.application.credentials.secret_key_base)

# Verify token in controllers
def current_user
  @current_user ||= User.find_by(id: decoded_token['user_id'])
end
```

**Token in headers**: `Authorization: Bearer <token>`

---

## 📋 Database Schema (Key Tables)

### Users
```ruby
# Both scoopers and residents
- id (primary key)
- username (scoopers only)
- email_address (required)
- name
- is_scooper (boolean) - differentiates user type
- password_digest (bcrypt)
- phone_number
- address
- latitude, longitude
- created_at, updated_at
```

### Jobs
```ruby
# Cleanup jobs posted by residents
- id (primary key)
- user_id (foreign key - resident who posted)
- scooper_id (foreign key - scooper who claimed, nullable)
- title
- description
- address
- latitude, longitude
- price (decimal)
- status (enum: available, claimed, en_route, arrived, cleaning, completed, cancelled)
- scheduled_for (datetime)
- claimed_at, en_route_at, arrived_at, cleaning_at, completed_at
- pickup_count (integer)
- created_at, updated_at
```

### JobPhotos
```ruby
# Completion photos via Active Storage
- id (primary key)
- job_id (foreign key)
- created_at, updated_at
# Photo attached via Active Storage as 'photo'
```

---

## 🔌 API Endpoints

### Authentication
```
POST /signup                    - Scooper signup
POST /client/signup             - Resident signup
POST /login                     - Scooper login (username/password)
POST /client/login              - Resident login (email/password)
GET  /me                        - Current scooper profile
GET  /client/me                 - Current resident profile
POST /logout                    - Invalidate session
POST /client/logout             - Invalidate session
```

### Jobs (Shared)
```
GET    /jobs                    - List jobs (with filters)
GET    /jobs/:id                - Single job details
POST   /jobs                    - Create job (residents only)
PATCH  /jobs/:id                - Update job (owner only)
DELETE /jobs/:id                - Delete job (owner only)
```

### Job Lifecycle (Scoopers)
```
PATCH /jobs/:id/claim           - Claim available job
PATCH /jobs/:id/unclaim         - Unclaim job (before en_route)
PATCH /jobs/:id/en_route        - Mark en route
PATCH /jobs/:id/arrive          - Mark arrived
PATCH /jobs/:id/cleaning        - Mark cleaning in progress
POST  /jobs/:id/complete        - Submit completion (with photo)
```

### Scooper-Specific
```
GET /scooper/jobs               - My claimed/completed jobs
GET /scooper/stats              - Earnings, job count stats
```

### Resident-Specific
```
GET /resident/jobs              - My posted jobs
```

### WebSocket
```
Cable URL: wss://www.pocket-walks.com/cable
Channel: JobsChannel
Actions: subscribe (receives job updates)
```

---

## 🔄 Job Lifecycle State Machine

```
available → claimed → en_route → arrived → cleaning → completed
              ↓
          unclaim (back to available, only before en_route)
```

**Status validations**:
- Can only claim if `status == 'available'`
- Can only proceed to next status in order
- Cannot skip statuses
- Completed jobs cannot be modified

**Implemented in**: `/app/services/job_lifecycle_service.rb` and `/app/models/job.rb`

---

## 🌐 Real-time Updates (Action Cable)

### Jobs Channel
```ruby
# Client subscribes
JobsChannel.subscribe

# Server broadcasts on job updates
ActionCable.server.broadcast('jobs_channel', {
  action: 'job_updated',
  job: job.as_json(include: [:user, :scooper])
})
```

**Events broadcasted**:
- Job created
- Job claimed
- Job status changed
- Job completed
- Job cancelled

**Mobile app listens**: `/services/WebSocketService.js`

---

## 📸 File Uploads (Active Storage)

### Job Completion Photos
```ruby
# Model
class JobPhoto < ApplicationRecord
  belongs_to :job
  has_one_attached :photo

  validates :photo, attached: true,
    content_type: ['image/png', 'image/jpg', 'image/jpeg'],
    size: { less_than: 5.megabytes }
end

# Controller
def create
  @job_photo = @job.job_photos.create!(job_photo_params)
  # Returns photo URL
end
```

**Storage**: Configured for cloud storage (check `config/storage.yml`)

---

## 🔍 Query Patterns

### Job Filtering
```ruby
# Available jobs only
Job.available

# By location (within radius)
Job.near([latitude, longitude], radius_in_km)

# By price range
Job.where(price: min_price..max_price)

# By status
Job.where(status: 'available')

# Scooper's jobs
Job.where(scooper_id: user.id)

# Resident's jobs
Job.where(user_id: user.id)
```

**Implemented in**: `/app/controllers/api/jobs_controller.rb`

---

## 🚨 Important Business Rules

1. **Only residents can post jobs** (`is_scooper: false`)
2. **Only scoopers can claim jobs** (`is_scooper: true`)
3. **Jobs must have valid lat/lng** for location features
4. **Job completion requires photo** via JobPhoto
5. **Status transitions are sequential** (can't skip steps)
6. **Can only unclaim before en_route** status
7. **Price must be positive** (validated in model)

---

## 🔐 Security Considerations

### Current Implementation
- ✅ Password hashing with bcrypt
- ✅ JWT token authentication
- ✅ File upload size limits (5MB)
- ✅ File type validation (images only)
- ✅ CORS configured for mobile app

### Needs Implementation
- [ ] Rate limiting on auth endpoints
- [ ] Token expiration (JWT refresh)
- [ ] Input sanitization audit
- [ ] SQL injection prevention review
- [ ] XSS prevention in error messages

**Mobile security docs**: `/Users/beaulazear/Desktop/scoop-mobile/security/`

---

## 🧪 Testing

### Test Data
```bash
# Populate test jobs
rake populate_test_jobs

# Creates jobs under beau09946@gmail.com account
```

### Manual Testing
```bash
# Start server
rails server

# Test endpoints with curl or Postman
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"password"}'
```

---

## 📊 Database Migrations

### Running Migrations
```bash
# Check pending migrations
rails db:migrate:status

# Run migrations
rails db:migrate

# Rollback last migration
rails db:rollback

# Reset database (development only!)
rails db:reset
```

### Creating Migrations
```bash
# Add column
rails g migration AddColumnToJobs column_name:type

# Create join table
rails g migration CreateJoinTable users jobs
```

---

## 🚀 Deployment

**Platform**: Render (https://www.pocket-walks.com)

### Deploy Process
```bash
# Push to main branch (auto-deploys)
git push origin main

# Check deploy logs on Render dashboard
```

### Environment Variables (Render)
- `DATABASE_URL` - PostgreSQL connection
- `RAILS_MASTER_KEY` - For credentials
- `RAILS_ENV=production`
- Any API keys (Stripe, etc.)

---

## 🔗 Important Files

### Configuration
- `config/routes.rb` - All API routes
- `config/cable.yml` - WebSocket configuration
- `config/database.yml` - Database config
- `config/storage.yml` - Active Storage config
- `config/credentials.yml.enc` - Encrypted secrets

### Models
- `app/models/user.rb` - User authentication & scopes
- `app/models/job.rb` - Job validations & state machine
- `app/models/job_photo.rb` - Photo attachments

### Controllers
- `app/controllers/api/jobs_controller.rb` - Main job API
- `app/controllers/api/sessions_controller.rb` - Scooper auth
- `app/controllers/api/clients_controller.rb` - Resident auth

### Services
- `app/services/job_lifecycle_service.rb` - Job state transitions

### Channels
- `app/channels/jobs_channel.rb` - Real-time broadcasts

---

## 🎯 Common Tasks

### Adding a New Endpoint
1. Add route in `config/routes.rb`
2. Create/update controller action
3. Test with curl or Postman
4. Update mobile app to consume it

### Changing Job Status Flow
1. Update `job_lifecycle_service.rb`
2. Update validations in `job.rb`
3. Update mobile app flow
4. Test all status transitions

### Adding a Database Column
```bash
rails g migration AddColumnToJobs new_column:type
rails db:migrate
```

### Debugging WebSocket Issues
```ruby
# Check cable logs
tail -f log/development.log | grep Cable

# Test connection
ActionCable.server.broadcast('jobs_channel', { test: 'message' })
```

---

## ⚠️ Known Issues & Limitations

1. **No payment processing** - Stripe Connect not implemented
2. **No email notifications** - Need to add ActionMailer
3. **Limited error handling** - Some edge cases need coverage
4. **No admin interface** - Need to add Rails Admin or similar
5. **Legacy block tables** - Old schema tables still present (can be removed)

---

## 🔍 Debugging Tips

### Common Issues

**Jobs not updating in real-time**:
- Check Action Cable connection in mobile app
- Verify WebSocket URL is correct
- Check Redis is running (if using Redis adapter)

**Authentication failures**:
- Verify JWT secret is consistent
- Check token is in `Authorization` header
- Ensure token hasn't expired

**File upload failures**:
- Check Active Storage is configured
- Verify file size < 5MB
- Ensure content type is image/jpeg or image/png

---

## 📚 Documentation

**Mobile App Docs**: `/Users/beaulazear/Desktop/scoop-mobile/docs/`
**API Integration**: `/Users/beaulazear/Desktop/scoop-mobile/docs/status/API_INTEGRATION_SUMMARY.md`

---

## 🔗 Important Links

- **Production API**: https://www.pocket-walks.com
- **Render Dashboard**: [Your Render account]
- **Frontend Repo**: `/Users/beaulazear/Desktop/scoop-mobile`
- **Mobile TestFlight**: https://appstoreconnect.apple.com/apps/6759220010/testflight/ios

---

## 📞 What I Need Help With

[Describe your current task or question here]

---

**Ready to code!** All context loaded. I have access to:
- Working directory: `/Users/beaulazear/Desktop/dog-walking-app`
- Mobile app at: `/Users/beaulazear/Desktop/scoop-mobile`
- Production API: https://www.pocket-walks.com
- Full Rails 7 API with Action Cable WebSockets
