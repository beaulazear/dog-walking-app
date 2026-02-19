# Dog Walking App - Multi-Product Platform

**A professional Rails + React application for dog care professionals**

**Last Updated:** February 18, 2026
**Status:** ✅ Production-Ready with Security Hardening Complete

---

## 🎯 Overview

This is a **three-product platform** sharing a single Rails backend with PostgreSQL database:

1. **Pocket Walks** - Dog walking business management (✅ Deployed)
2. **Client Portal** - Pet owner interface (✅ Backend complete, ⚠️ Frontend needed)
3. **Scoop** - Dog waste cleanup marketplace (✅ Backend deployed, 🚧 Frontend in progress)

**Key Features:**
- ✅ Enterprise-grade security (all vulnerabilities fixed)
- ✅ Stripe payment integration (test mode)
- ✅ AWS S3 file storage
- ✅ JWT authentication
- ✅ Rate limiting & monitoring
- ✅ 100+ API endpoints
- ✅ Comprehensive documentation

---

## 📚 Documentation

### **START HERE:**
1. **[PROJECT_STATUS.md](PROJECT_STATUS.md)** - Complete project overview
2. **[SECURITY_QUICK_START.md](SECURITY_QUICK_START.md)** - Get running in 5 minutes
3. **[DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md)** - Navigate all docs

### Quick Links:
- **Security:** [SECURITY_FIXES_SUMMARY.md](SECURITY_FIXES_SUMMARY.md)
- **Scoop API:** [docs/SCOOP_BACKEND_SUMMARY.md](docs/SCOOP_BACKEND_SUMMARY.md)
- **Client API:** [CLIENT_API_DOCUMENTATION.md](CLIENT_API_DOCUMENTATION.md)
- **Architecture:** [ARCHITECTURE_REPORT.md](ARCHITECTURE_REPORT.md)
- **Next Steps:** [docs/NEXT_STEPS.md](docs/NEXT_STEPS.md)

---

## 🚀 Quick Start

### Prerequisites
- Ruby 2.7.4
- PostgreSQL
- Node.js 16+
- Stripe account (for payments)
- AWS S3 bucket (for file storage)

### Installation

```bash
# Clone repository
git clone <your-repo-url>
cd dog-walking-app

# Install dependencies
bundle install
npm install --prefix client

# Set up database
rails db:create
rails db:migrate
rails db:seed

# Configure credentials (see SECURITY_QUICK_START.md)
EDITOR="code --wait" rails credentials:edit
# Add your Stripe keys, AWS credentials, etc.

# Start servers
rails server                    # Backend on port 3000
npm start --prefix client       # Frontend on port 4000
```

### Verify Setup

```bash
# Check Stripe configuration
./bin/check_stripe_config

# Run security tests
ruby test/security_test.rb

# Check Stripe health
rails stripe:monitor:health
```

---

## 🔒 Security (Updated Feb 18, 2026)

**All critical vulnerabilities have been fixed:**

✅ SQL Injection Protection
✅ Stripe Subscription Security
✅ Authorization Enforcement
✅ GPS Fraud Prevention
✅ File Upload Validation
✅ Rate Limiting
✅ Error Monitoring
✅ Comprehensive Testing

**See:** [SECURITY_FIXES_SUMMARY.md](SECURITY_FIXES_SUMMARY.md) for details

**Security Commands:**
```bash
./bin/check_stripe_config           # Verify configuration
ruby test/security_test.rb          # Run tests
rails stripe:monitor:health         # Monitor Stripe
```

---

## 💻 Tech Stack

### Backend
- **Framework:** Rails 7.2.2
- **Database:** PostgreSQL with lat/lng support
- **Authentication:** JWT + bcrypt
- **Payments:** Stripe + Stripe Connect
- **Storage:** AWS S3 (Active Storage)
- **Security:** Rack::Attack, custom monitoring

### Frontend
- **Framework:** React 18.3.1
- **Routing:** React Router v6
- **Styling:** styled-components
- **Charts:** Chart.js
- **Build:** react-scripts 5.0.1

---

## 📊 API Endpoints

### Pocket Walks (Dog Walking)
- Appointments, Pets, Invoices
- Training sessions, Pet sitting
- Team sharing, Earnings tracking

### Client Portal (Pet Owners)
- Pet management, Booking
- Invoice viewing, Notifications

### Scoop (Marketplace)
- Block management, Pledges
- GPS-verified cleanups, Poop reports
- Gamification, Stripe Connect

**Total:** 100+ RESTful JSON API endpoints

**See:** [docs/SCOOP_BACKEND_SUMMARY.md](docs/SCOOP_BACKEND_SUMMARY.md) for complete API docs

---

## 🗄️ Database

**Single PostgreSQL database with 30+ tables:**

**Core Tables:**
- `users` (walkers + scoopers)
- `clients` (pet owners + residents)
- `pets`, `appointments`, `invoices`

**Scoop Tables:**
- `blocks`, `coverage_regions`, `pledges`
- `cleanups`, `poop_reports`, `scooper_milestones`

**Shared Infrastructure:**
- JWT authentication across all products
- S3 file storage for all photos
- Unified error monitoring

---

## 🚢 Deployment

### Current Deployment
- **Platform:** Render
- **Database:** PostgreSQL on Render
- **Storage:** AWS S3
- **Status:** ✅ Production-ready

### Environment Variables
Set these on Render (or in local `.env`):
```
DATABASE_URL=postgresql://...
RAILS_MASTER_KEY=<from config/master.key>
AWS_ACCESS_KEY_ID=<your-key>
AWS_SECRET_ACCESS_KEY=<your-secret>
AWS_REGION=us-east-1
AWS_BUCKET=beaubucketone
FRONTEND_URL=https://your-frontend.com
```

### Deploy
```bash
git push origin main
# Render auto-deploys from main branch
```

**See:** [DEPLOYMENT_SUCCESS.md](DEPLOYMENT_SUCCESS.md) for details

---

## 🧪 Testing

### Run Tests
```bash
# RSpec tests
bundle exec rspec

# Security tests
ruby test/security_test.rb

# Manual testing
# See test/manual_security_tests.md
```

### Monitoring
```bash
# Stripe health check
rails stripe:monitor:health

# Check for errors
rails stripe:monitor:errors

# Validate scoopers
rails stripe:monitor:validate_scoopers

# Check subscriptions
rails stripe:monitor:check_cancelled_subscriptions
```

---

## 📱 Frontend Development

### Pocket Walks (React - Deployed)
```bash
cd client
npm start
# Runs on http://localhost:4000
```

### Scoop (React Native - In Progress)
- Mobile app for scoopers and residents
- Map view with block markers
- GPS-verified cleanup logging
- See: [docs/NEXT_STEPS.md](docs/NEXT_STEPS.md)

### Client Portal (Not Yet Built)
- Web interface for pet owners
- Backend ready for integration
- See: [CLIENT_API_DOCUMENTATION.md](CLIENT_API_DOCUMENTATION.md)

---

## 🔧 Development Workflow

### Local Development
```bash
# Terminal 1: Rails backend
rails server

# Terminal 2: React frontend (Pocket Walks)
cd client && npm start

# Terminal 3: Stripe webhooks (optional)
stripe listen --forward-to localhost:3000/stripe/webhooks

# Terminal 4: Monitor logs
tail -f log/development.log | grep -E "Stripe|Rack::Attack"
```

### Common Commands
```bash
# Database
rails db:migrate              # Run migrations
rails db:seed                 # Seed data
rails db:reset                # Reset database

# Rails console
rails console                 # REPL

# Routes
rails routes                  # View all routes

# Security
./bin/check_stripe_config     # Verify Stripe
ruby test/security_test.rb    # Security tests

# Monitoring
rails stripe:monitor:health   # Stripe health
```

---

## 📋 Project Structure

```
dog-walking-app/
├── app/                      # Rails backend
│   ├── controllers/          # 33 controllers
│   ├── models/               # 28 models
│   ├── serializers/          # API formatters
│   ├── services/             # Business logic
│   └── jobs/                 # Background jobs
├── client/                   # React frontend
│   └── src/
│       ├── components/       # React components
│       ├── context/          # Global state
│       └── App.js            # Main app
├── config/
│   ├── initializers/
│   │   ├── rack_attack.rb   # Rate limiting
│   │   ├── stripe.rb        # Stripe config
│   │   └── cors.rb          # CORS setup
│   └── routes.rb            # API routes
├── db/
│   ├── schema.rb            # Database schema
│   └── migrate/             # Migrations
├── docs/                    # Documentation
│   ├── SCOOP_BACKEND_SUMMARY.md
│   ├── CURRENT_STATUS.md
│   └── NEXT_STEPS.md
├── lib/tasks/
│   └── stripe_monitoring.rake
├── test/
│   ├── security_test.rb
│   └── manual_security_tests.md
├── PROJECT_STATUS.md        # Master status
├── SECURITY_FIXES_SUMMARY.md
├── STRIPE_SECURITY_SETUP.md
└── README.md                # This file
```

---

## 🎯 Current Status

### ✅ Complete
- Backend for all 3 products
- Security hardening (8 vulnerabilities fixed)
- Rate limiting & monitoring
- Stripe integration (test mode)
- Pocket Walks frontend
- Comprehensive documentation
- Production deployment

### ⚠️ In Progress
- Scoop mobile app
- Client Portal web app
- Stripe Connect configuration

### 📝 TODO
- Enable Stripe Connect
- Build remaining frontends
- Configure S3 lifecycle
- Set up error tracking
- Production launch

**See:** [docs/NEXT_STEPS.md](docs/NEXT_STEPS.md) for detailed roadmap

---

## 🆘 Troubleshooting

### Common Issues

**"Stripe webhook secret not configured"**
```bash
EDITOR="code --wait" rails credentials:edit
# Add webhook_secret under stripe section
```

**"Master key not found"**
```bash
# Create new credentials
rm config/credentials.yml.enc
EDITOR="code --wait" rails credentials:edit
```

**"Rate limiting not working"**
```bash
# Restart server after rack_attack.rb changes
rails server
```

**More help:** See [SECURITY_QUICK_START.md](SECURITY_QUICK_START.md)

---

## 📞 Support

### Documentation
- **Overview:** [PROJECT_STATUS.md](PROJECT_STATUS.md)
- **Security:** [SECURITY_FIXES_SUMMARY.md](SECURITY_FIXES_SUMMARY.md)
- **Scoop:** [docs/SCOOP_BACKEND_SUMMARY.md](docs/SCOOP_BACKEND_SUMMARY.md)
- **All Docs:** [DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md)

### Resources
- **Stripe Dashboard:** https://dashboard.stripe.com/
- **Render Dashboard:** https://dashboard.render.com/
- **AWS Console:** https://console.aws.amazon.com/

---

## 📄 License

See [LICENSE.md](LICENSE.md)

---

## 🎉 Getting Started Checklist

- [ ] Clone repository
- [ ] Install dependencies (`bundle install`, `npm install --prefix client`)
- [ ] Set up database (`rails db:create db:migrate`)
- [ ] Configure credentials (`rails credentials:edit`)
- [ ] Run security check (`./bin/check_stripe_config`)
- [ ] Start servers (`rails server`, `npm start --prefix client`)
- [ ] Run tests (`ruby test/security_test.rb`)
- [ ] Read [PROJECT_STATUS.md](PROJECT_STATUS.md)
- [ ] Read [SECURITY_QUICK_START.md](SECURITY_QUICK_START.md)
- [ ] Review [docs/NEXT_STEPS.md](docs/NEXT_STEPS.md)

---

**Ready to build?** Start with [SECURITY_QUICK_START.md](SECURITY_QUICK_START.md) then dive into [PROJECT_STATUS.md](PROJECT_STATUS.md)!
