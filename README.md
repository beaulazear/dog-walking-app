# Dog Walking App - Multi-Product Platform

**A professional Rails + React application for dog care professionals**

**Last Updated:** February 22, 2026
**Status:** ✅ MVP v3 Complete - Block Sponsorships Live

---

## 🎯 Overview

This is a **three-product platform** sharing a single Rails backend with PostgreSQL database:

1. **Pocket Walks** - Dog walking business management (✅ Deployed)
2. **Client Portal** - Pet owner interface (✅ Backend complete, ⚠️ Frontend needed)
3. **Scoop MVP v3** - Block sponsorship subscriptions (✅ Backend complete, 🚧 Frontend in progress)

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
2. **[docs/MVP_V3_HANDOFF_PROMPT.md](docs/MVP_V3_HANDOFF_PROMPT.md)** - MVP v3 quick start
3. **[DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md)** - Navigate all docs

### Quick Links:
- **Security:** [docs/SECURITY_QUICK_WINS.md](docs/SECURITY_QUICK_WINS.md)
- **MVP v3 API:** [docs/MVP_V3_BACKEND_COMPLETE.md](docs/MVP_V3_BACKEND_COMPLETE.md)
- **MVP v3 Handoff:** [docs/MVP_V3_HANDOFF_PROMPT.md](docs/MVP_V3_HANDOFF_PROMPT.md)
- **Client API:** [CLIENT_API_DOCUMENTATION.md](CLIENT_API_DOCUMENTATION.md)
- **Architecture:** [ARCHITECTURE_REPORT.md](ARCHITECTURE_REPORT.md)

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
# Run test data generation
bundle exec rake test_data:create_sponsorships

# Check database
rails runner "puts Sponsorship.count"
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

**See:** [docs/SECURITY_QUICK_WINS.md](docs/SECURITY_QUICK_WINS.md) for implementation guide

**Key Security Features:**
- JWT token expiration (24 hours)
- Rate limiting (Rack::Attack)
- GPS boundary validation (~150m tolerance)
- First-tap-wins database locking
- Authorization checks on all endpoints

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

### Scoop MVP v3 (Block Sponsorships)
- Monthly block sponsorships
- GPS-verified maintenance sweeps
- Neighbor contributions
- Monthly ratings & reviews
- First-tap-wins claiming

**Total:** 100+ RESTful JSON API endpoints

**See:** [docs/MVP_V3_BACKEND_COMPLETE.md](docs/MVP_V3_BACKEND_COMPLETE.md) for complete API docs

---

## 🗄️ Database

**Single PostgreSQL database with 30+ tables:**

**Core Tables:**
- `users` (walkers + scoopers)
- `clients` (pet owners + residents)
- `pets`, `appointments`, `invoices`

**Scoop MVP v3 Tables:**
- `sponsorships`, `sweeps`, `contributions`
- `sponsorship_ratings`

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

**See:** [docs/MVP_V3_BACKEND_COMPLETE.md](docs/MVP_V3_BACKEND_COMPLETE.md) for deployment details

---

## 🧪 Testing

### Run Tests
```bash
# Generate test data
bundle exec rake test_data:create_sponsorships

# Clear test data
bundle exec rake test_data:clear_sponsorships

# Check database records
rails runner "puts 'Sponsorships: ' + Sponsorship.count.to_s"
rails runner "puts 'Sweeps: ' + Sweep.count.to_s"
```

### Common Tasks
```bash
# Create test sponsorship
rails console
> Sponsorship.create!(sponsor_id: 1, latitude: 40.6782, longitude: -73.9442, ...)

# View all sponsorships
> Sponsorship.all

# Check user roles
> User.find(1).update(is_dog_walker: true)
```

---

## 📱 Frontend Development

### Pocket Walks (React - Deployed)
```bash
cd client
npm start
# Runs on http://localhost:4000
```

### Scoop MVP v3 (React Native - In Progress)
- Mobile app for sponsors and dog walkers
- Block sponsorship creation
- GPS-verified maintenance sweeps
- Neighbor contribution support
- See: [docs/MVP_V3_HANDOFF_PROMPT.md](docs/MVP_V3_HANDOFF_PROMPT.md)

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
rails routes | grep sponsorships  # View sponsorship routes

# Test data
bundle exec rake test_data:create_sponsorships  # Generate test data
bundle exec rake test_data:clear_sponsorships   # Clear test data

# Rake tasks
rails -T                      # View all rake tasks
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

**More help:** See [docs/SECURITY_QUICK_WINS.md](docs/SECURITY_QUICK_WINS.md)

---

## 📞 Support

### Documentation
- **Overview:** [PROJECT_STATUS.md](PROJECT_STATUS.md)
- **MVP v3:** [docs/MVP_V3_BACKEND_COMPLETE.md](docs/MVP_V3_BACKEND_COMPLETE.md)
- **Security:** [docs/SECURITY_QUICK_WINS.md](docs/SECURITY_QUICK_WINS.md)
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
- [ ] Read [docs/SECURITY_QUICK_WINS.md](docs/SECURITY_QUICK_WINS.md)
- [ ] Review [docs/MVP_V3_HANDOFF_PROMPT.md](docs/MVP_V3_HANDOFF_PROMPT.md)

---

**Ready to build?** Start with [docs/MVP_V3_HANDOFF_PROMPT.md](docs/MVP_V3_HANDOFF_PROMPT.md) then dive into [PROJECT_STATUS.md](PROJECT_STATUS.md)!
