# New MVP Implementation Session - Backend API

**Use this prompt when you have new MVP docs, feature specs, or API changes to implement**

---

## 📋 Session Purpose

I have new **MVP documentation, feature specifications, or API requirements** that I need to implement in the Scoop backend API.

**What I'm bringing**:
- New feature requirements
- Updated MVP scope
- API contract specifications
- Database schema changes
- Business logic updates
- Or other specification documents

**What I need**:
1. Review the new documentation
2. Identify what needs to change (models, controllers, migrations, business logic)
3. Create an implementation plan
4. Generate necessary migrations
5. Update existing code to match new specifications
6. Update documentation to reflect changes

---

## 🎯 Current Project Context

**Project**: Scoop Backend (Ruby on Rails API)
**Location**: `/Users/beaulazear/Desktop/dog-walking-app`
**Deployment**: Production on Render (https://www.pocket-walks.com)
**Database**: PostgreSQL with PostGIS

### Quick Context
- **What it does**: API backend for on-demand dog waste cleanup marketplace
- **Tech**: Rails 7.2.2, Ruby 3.3.0, Action Cable, Active Storage
- **Frontend**: React Native app at `/Users/beaulazear/Desktop/scoop-mobile`
- **Auth**: JWT tokens with bcrypt
- **Real-time**: Action Cable WebSockets

**Full context available in**: `CLAUDE_KICKOFF_BACKEND.md`

---

## 📁 Current State

### Working Features
- ✅ User authentication (scoopers & residents in single `users` table)
- ✅ Job CRUD operations
- ✅ Job lifecycle (claim → en_route → arrive → cleaning → complete)
- ✅ Real-time updates via Action Cable
- ✅ Photo uploads via Active Storage
- ✅ Job filtering & search

### Current Schema (Key Tables)
```ruby
users:
  - id, username, email_address, name
  - is_scooper (boolean - differentiates user type)
  - password_digest
  - phone_number, address, latitude, longitude

jobs:
  - id, user_id (resident), scooper_id
  - title, description, address, latitude, longitude
  - price, status (enum)
  - scheduled_for, claimed_at, en_route_at, arrived_at, cleaning_at, completed_at
  - pickup_count

job_photos:
  - id, job_id
  - photo (Active Storage attachment)
```

### Key Endpoints
```
POST   /signup, /client/signup       - Authentication
POST   /login, /client/login         - Authentication
GET    /jobs                         - List jobs
POST   /jobs                         - Create job
PATCH  /jobs/:id/claim              - Claim job
PATCH  /jobs/:id/[status]           - Update status
POST   /jobs/:id/complete           - Complete with photo
```

**Full API docs**: `CLAUDE_KICKOFF_BACKEND.md`
**Frontend integration**: `/Users/beaulazear/Desktop/scoop-mobile/docs/status/API_INTEGRATION_SUMMARY.md`

---

## 📄 New Documentation to Review

I'm pasting the new documentation below. Please:

1. **Read and analyze** all the new documentation
2. **Compare** with current implementation
3. **Identify database changes** needed
4. **Identify API changes** needed
5. **Create implementation plan** with:
   - Migrations to generate
   - Models to create/update
   - Controllers to create/update
   - Routes to add/modify
   - Business logic/services needed
   - WebSocket broadcasts to update
   - Validations to add
   - Tests to write/update
6. **Ask clarifying questions** before starting implementation

---

### 📋 NEW DOCUMENTATION STARTS HERE

[PASTE YOUR NEW MVP DOCS, API SPECS, FEATURE REQUIREMENTS, ETC. BELOW]

```
[Your new documentation here]
```

---

## 🎯 What I Need From You

After reviewing the documentation above:

1. **Database Changes Summary**:
   - New tables needed?
   - New columns needed?
   - Modified columns?
   - New indexes?
   - Data migrations?

2. **API Changes Summary**:
   - New endpoints?
   - Modified endpoints?
   - Deprecated endpoints?
   - New request/response formats?

3. **Business Logic Changes**:
   - New models/validations?
   - New services/concerns?
   - Modified state machines?
   - New background jobs?

4. **Implementation Plan**:
   - Step-by-step migrations
   - Model updates
   - Controller updates
   - Order of implementation
   - Testing strategy

5. **Coordination Needs**:
   - Mobile app changes required?
   - Breaking changes?
   - Migration strategy (zero-downtime?)

6. **Questions**:
   - Any ambiguities in the spec?
   - Any design decisions needed?
   - Any performance considerations?

7. **Then**: Guide me through implementing these changes systematically

---

## ⚠️ Important Constraints

**Keep in mind**:
- Maintain backward compatibility where possible
- Don't break existing mobile app functionality
- Keep authentication working
- Preserve real-time WebSocket functionality
- Follow Rails conventions
- Add validations for data integrity
- Consider data migrations for existing records

**Must preserve**:
- JWT authentication flow
- Existing user accounts
- Job lifecycle state machine
- WebSocket broadcasts
- Active Storage photo uploads

**Production considerations**:
- Zero-downtime migrations if possible
- Rollback strategy
- Database performance (indexes!)
- API versioning if breaking changes

---

## 🔄 Migration Strategy

When creating migrations:

1. **Generate migration**:
   ```bash
   rails g migration DescriptiveName
   ```

2. **Write up AND down methods** (for rollback)

3. **Add indexes** for foreign keys and frequently queried columns

4. **Data migrations** in separate migration if needed

5. **Test locally** before deploying:
   ```bash
   rails db:migrate
   rails db:rollback
   rails db:migrate
   ```

---

## 📚 Reference Documentation

If you need context:
- **Full Backend Context**: `CLAUDE_KICKOFF_BACKEND.md`
- **Current Schema**: `db/schema.rb`
- **Current Routes**: `config/routes.rb`
- **Models**: `app/models/`
- **Controllers**: `app/controllers/api/`
- **Mobile Integration**: `/Users/beaulazear/Desktop/scoop-mobile/docs/status/API_INTEGRATION_SUMMARY.md`

---

## 🔗 Coordination Notes

**Frontend Changes**: Any API changes will need coordination with mobile app
**WebSocket**: Update broadcasts if job structure changes
**Deployment**: Changes will auto-deploy on push to main (Render)
**Testing**: We'll test locally before pushing to production

---

## 🧪 Testing Checklist

After implementation:
- [ ] All migrations run successfully
- [ ] All models have validations
- [ ] All new endpoints work (test with curl/Postman)
- [ ] Existing endpoints still work
- [ ] WebSocket broadcasts updated
- [ ] Mobile app integration tested
- [ ] Error cases handled
- [ ] Documentation updated

---

**Ready!** Please review the documentation pasted above and provide your analysis and implementation plan.
