# Documentation Index

**Quick navigation guide to all project documentation**

Last Updated: February 22, 2026

---

## 🚀 Start Here

**New to the project?** Read these in order:

1. **[PROJECT_STATUS.md](PROJECT_STATUS.md)** - **START HERE!** Complete project overview
2. **[security/SECURITY_QUICK_START.md](security/SECURITY_QUICK_START.md)** - Get running in 5 minutes
3. **[ARCHITECTURE_REPORT.md](ARCHITECTURE_REPORT.md)** - System architecture

---

## 🔒 Security Documentation

**Essential for all developers:**

- **[docs/SECURITY_QUICK_WINS.md](docs/SECURITY_QUICK_WINS.md)** - Security implementation guide
- **[docs/MOBILE_APP_SECURITY_GUIDE.md](docs/MOBILE_APP_SECURITY_GUIDE.md)** - Mobile security guide

**Key Security Features (MVP v3):**
- JWT token expiration (24 hours)
- Rate limiting (Rack::Attack)
- GPS boundary validation (~150m)
- First-tap-wins database locking
- Authorization checks on all endpoints

**Security Commands:**
```bash
# Generate test data
bundle exec rake test_data:create_sponsorships

# Check database
rails runner "puts Sponsorship.count"
```

---

## 🛍️ Scoop MVP v3 Documentation

**For Scoop MVP v3 development:**

- **[docs/MVP_V3_BACKEND_COMPLETE.md](docs/MVP_V3_BACKEND_COMPLETE.md)** - Complete technical reference (1000+ lines)
- **[docs/MVP_V3_HANDOFF_PROMPT.md](docs/MVP_V3_HANDOFF_PROMPT.md)** - Session handoff for new Claude sessions
- **[docs/SECURITY_QUICK_WINS.md](docs/SECURITY_QUICK_WINS.md)** - Security implementation guide
- **[docs/MONTHLY_CRON_SETUP.md](docs/MONTHLY_CRON_SETUP.md)** - Monthly maintenance tasks

**Old System (Archived):**
- Old Scoop marketplace docs → `docs/archive/old-scoop-system/`
- See `docs/archive/README.md` for historical context

---

## 👥 Client Portal Documentation

**For Client Portal development:**

- **[CLIENT_API_DOCUMENTATION.md](CLIENT_API_DOCUMENTATION.md)** - API reference
- **[CLIENT_API_REFERENCE.md](CLIENT_API_REFERENCE.md)** - Endpoint details

---

## 🐕 Pocket Walks Documentation

**For Pocket Walks development:**

- **[ARCHITECTURE_REPORT.md](ARCHITECTURE_REPORT.md)** - Full system architecture
- **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** - Command reference
- **[PERFORMANCE_TOOLS.md](PERFORMANCE_TOOLS.md)** - Performance profiling

**Future Features:**
- **[ROUTE_OPTIMIZER_FINAL_SPEC.md](ROUTE_OPTIMIZER_FINAL_SPEC.md)** - Route optimization plans
- **[DEPLOYMENT_GUIDE_GEOCODING.md](DEPLOYMENT_GUIDE_GEOCODING.md)** - Geocoding setup

---

## 📊 Status & Planning

- **[PROJECT_STATUS.md](PROJECT_STATUS.md)** - Master status document (READ THIS FIRST!)
- **[docs/CURRENT_STATUS.md](docs/CURRENT_STATUS.md)** - Scoop deployment status
- **[docs/NEXT_STEPS.md](docs/NEXT_STEPS.md)** - Priority TODO list
- **[SHARING_SYSTEM_STATUS.md](SHARING_SYSTEM_STATUS.md)** - Team sharing feature status
- **[PET_SITS_FEATURE_PLAN.md](PET_SITS_FEATURE_PLAN.md)** - Pet sitting feature plans

---

## 🔧 Development & Deployment

- **[README.md](README.md)** - Project setup & deployment
- **[DEPLOYMENT_SUCCESS.md](DEPLOYMENT_SUCCESS.md)** - Deployment guide
- **[DEPLOYMENT_GUIDE_GEOCODING.md](DEPLOYMENT_GUIDE_GEOCODING.md)** - Geocoding deployment
- **[TEMPORARY_STRIPE_CONFIG.md](TEMPORARY_STRIPE_CONFIG.md)** - Stripe test mode notes

---

## 🧪 Testing

- **[security/security_test.rb](security/security_test.rb)** - Automated security tests
- **[security/manual_security_tests.md](security/manual_security_tests.md)** - Manual testing guide

---

## 📚 Reference Documentation

- **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** - Quick command reference
- **[PERFORMANCE_TOOLS.md](PERFORMANCE_TOOLS.md)** - Performance profiling tools
- **[claude-context.md](claude-context.md)** - Claude AI continuation context

---

## 🗂️ By Topic

### Security
1. docs/SECURITY_QUICK_WINS.md
2. docs/MOBILE_APP_SECURITY_GUIDE.md

### MVP v3 (Block Sponsorships)
1. docs/MVP_V3_BACKEND_COMPLETE.md
2. docs/MVP_V3_HANDOFF_PROMPT.md
3. docs/MONTHLY_CRON_SETUP.md

### API Documentation
1. docs/MVP_V3_BACKEND_COMPLETE.md - Scoop MVP v3 API
2. CLIENT_API_DOCUMENTATION.md - Client Portal API
3. CLIENT_API_REFERENCE.md - Client API reference

### Deployment
1. PROJECT_STATUS.md - Master status
2. README.md - Quick start guide

### Pocket Walks Features (Future)
1. ROUTE_OPTIMIZER_FINAL_SPEC.md - Route optimization
2. PET_SITS_FEATURE_PLAN.md - Pet sitting
3. SHARING_SYSTEM_STATUS.md - Walk sharing

### Archived Documentation
1. docs/archive/old-scoop-system/ - Old Scoop marketplace (Feb 14-15)
2. docs/archive/old-prompts/ - Outdated session prompts
3. docs/archive/README.md - Archive index

---

## 🎯 Common Tasks

### Setting Up Development Environment
1. Read [README.md](README.md)
2. Read [docs/MVP_V3_HANDOFF_PROMPT.md](docs/MVP_V3_HANDOFF_PROMPT.md)
3. Run `bundle exec rake test_data:create_sponsorships`

### Understanding MVP v3
1. Read [PROJECT_STATUS.md](PROJECT_STATUS.md)
2. Read [docs/MVP_V3_BACKEND_COMPLETE.md](docs/MVP_V3_BACKEND_COMPLETE.md)
3. Read [docs/MVP_V3_HANDOFF_PROMPT.md](docs/MVP_V3_HANDOFF_PROMPT.md)

### Security Implementation
1. Read [docs/SECURITY_QUICK_WINS.md](docs/SECURITY_QUICK_WINS.md)
2. Read [docs/MOBILE_APP_SECURITY_GUIDE.md](docs/MOBILE_APP_SECURITY_GUIDE.md)
3. Implement secure token storage (expo-secure-store)

### Building Frontend
1. Read [docs/MVP_V3_BACKEND_COMPLETE.md](docs/MVP_V3_BACKEND_COMPLETE.md) - API reference
2. Review API endpoints (`/api/sponsorships`, `/api/sweeps`, etc.)
3. Test with generated data from rake task

### Testing & Development
```bash
bundle exec rake test_data:create_sponsorships  # Generate test data
bundle exec rake test_data:clear_sponsorships   # Clear test data
rails runner "puts Sponsorship.count"           # Check database
rails routes | grep sponsorships                # View routes
```

---

## 💡 Tips

- **Start with PROJECT_STATUS.md** - It's the master document
- **Use search (Cmd+F)** - All docs are markdown and searchable
- **Check docs/ folder** - Scoop-specific documentation
- **Run health checks** - Before making changes
- **Read security docs** - Before handling payments

---

## 📞 Need Help?

**Can't find what you're looking for?**

1. Check [PROJECT_STATUS.md](PROJECT_STATUS.md) - Most comprehensive
2. Search all .md files for keywords
3. Check [QUICK_REFERENCE.md](QUICK_REFERENCE.md) for commands
4. Look in docs/ folder for product-specific docs

**Common Questions:**

| Question | Document |
|----------|----------|
| How do I set up Stripe? | security/STRIPE_SECURITY_SETUP.md |
| What security fixes were made? | security/SECURITY_FIXES_SUMMARY.md |
| How do I test security? | security/manual_security_tests.md |
| What's the Scoop API? | docs/SCOOP_BACKEND_SUMMARY.md |
| What's deployed? | docs/CURRENT_STATUS.md |
| What's next? | docs/NEXT_STEPS.md |
| How's the system structured? | ARCHITECTURE_REPORT.md |

---

**Remember:** Documentation is living - it's updated as the project evolves. Always check the "Last Updated" date at the top of each file.
