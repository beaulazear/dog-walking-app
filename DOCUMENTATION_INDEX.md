# Documentation Index

**Quick navigation guide to all project documentation**

Last Updated: February 18, 2026

---

## 🚀 Start Here

**New to the project?** Read these in order:

1. **[PROJECT_STATUS.md](PROJECT_STATUS.md)** - **START HERE!** Complete project overview
2. **[SECURITY_QUICK_START.md](SECURITY_QUICK_START.md)** - Get running in 5 minutes
3. **[ARCHITECTURE_REPORT.md](ARCHITECTURE_REPORT.md)** - System architecture

---

## 🔒 Security Documentation

**Essential for all developers:**

- **[SECURITY_FIXES_SUMMARY.md](SECURITY_FIXES_SUMMARY.md)** - All 8 security fixes explained
- **[STRIPE_SECURITY_SETUP.md](STRIPE_SECURITY_SETUP.md)** - Stripe configuration guide
- **[SECURITY_QUICK_START.md](SECURITY_QUICK_START.md)** - Quick start guide
- **[test/manual_security_tests.md](test/manual_security_tests.md)** - Manual testing guide
- **[test/security_test.rb](test/security_test.rb)** - Automated tests

**Security Commands:**
```bash
./bin/check_stripe_config           # Verify Stripe setup
ruby test/security_test.rb          # Run security tests
rails stripe:monitor:health         # Check Stripe health
```

---

## 🛍️ Scoop Marketplace Documentation

**For Scoop development:**

- **[docs/SCOOP_BACKEND_SUMMARY.md](docs/SCOOP_BACKEND_SUMMARY.md)** - Complete API docs (40+ endpoints)
- **[docs/CURRENT_STATUS.md](docs/CURRENT_STATUS.md)** - Deployment status & what's working
- **[docs/NEXT_STEPS.md](docs/NEXT_STEPS.md)** - Development roadmap & TODO list
- **[docs/SCOOP_STRIPE_CONNECT_SETUP.md](docs/SCOOP_STRIPE_CONNECT_SETUP.md)** - Payment setup
- **[docs/SCOOP_S3_LIFECYCLE_SETUP.md](docs/SCOOP_S3_LIFECYCLE_SETUP.md)** - Photo auto-deletion

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

- **[test/security_test.rb](test/security_test.rb)** - Automated security tests
- **[test/manual_security_tests.md](test/manual_security_tests.md)** - Manual testing guide

---

## 📚 Reference Documentation

- **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** - Quick command reference
- **[PERFORMANCE_TOOLS.md](PERFORMANCE_TOOLS.md)** - Performance profiling tools
- **[claude-context.md](claude-context.md)** - Claude AI continuation context

---

## 🗂️ By Topic

### Security
1. SECURITY_FIXES_SUMMARY.md
2. STRIPE_SECURITY_SETUP.md
3. SECURITY_QUICK_START.md
4. test/manual_security_tests.md

### Stripe Integration
1. STRIPE_SECURITY_SETUP.md
2. docs/SCOOP_STRIPE_CONNECT_SETUP.md
3. STRIPE_SETUP_COMPLETE.md
4. STRIPE_SETUP_INSTRUCTIONS.md

### API Documentation
1. docs/SCOOP_BACKEND_SUMMARY.md
2. CLIENT_API_DOCUMENTATION.md
3. CLIENT_API_REFERENCE.md

### Deployment
1. PROJECT_STATUS.md
2. docs/CURRENT_STATUS.md
3. DEPLOYMENT_SUCCESS.md

### Development Roadmap
1. docs/NEXT_STEPS.md
2. ROUTE_OPTIMIZER_FINAL_SPEC.md
3. PET_SITS_FEATURE_PLAN.md

---

## 🎯 Common Tasks

### Setting Up Development Environment
1. Read [README.md](README.md)
2. Read [SECURITY_QUICK_START.md](SECURITY_QUICK_START.md)
3. Run `./bin/check_stripe_config`

### Understanding the Codebase
1. Read [PROJECT_STATUS.md](PROJECT_STATUS.md)
2. Read [ARCHITECTURE_REPORT.md](ARCHITECTURE_REPORT.md)
3. Read [docs/SCOOP_BACKEND_SUMMARY.md](docs/SCOOP_BACKEND_SUMMARY.md)

### Security Review
1. Read [SECURITY_FIXES_SUMMARY.md](SECURITY_FIXES_SUMMARY.md)
2. Run `ruby test/security_test.rb`
3. Follow [test/manual_security_tests.md](test/manual_security_tests.md)

### Setting Up Payments
1. Read [STRIPE_SECURITY_SETUP.md](STRIPE_SECURITY_SETUP.md)
2. Read [docs/SCOOP_STRIPE_CONNECT_SETUP.md](docs/SCOOP_STRIPE_CONNECT_SETUP.md)
3. Run `./bin/check_stripe_config`

### Building Scoop Frontend
1. Read [docs/CURRENT_STATUS.md](docs/CURRENT_STATUS.md)
2. Read [docs/NEXT_STEPS.md](docs/NEXT_STEPS.md)
3. Read [docs/SCOOP_BACKEND_SUMMARY.md](docs/SCOOP_BACKEND_SUMMARY.md)

### Monitoring Production
```bash
rails stripe:monitor:health                         # Daily health check
rails stripe:monitor:errors                         # Check recent errors
rails stripe:monitor:validate_scoopers             # Validate accounts
rails stripe:monitor:check_cancelled_subscriptions # Check integrity
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
| How do I set up Stripe? | STRIPE_SECURITY_SETUP.md |
| What security fixes were made? | SECURITY_FIXES_SUMMARY.md |
| How do I test security? | test/manual_security_tests.md |
| What's the Scoop API? | docs/SCOOP_BACKEND_SUMMARY.md |
| What's deployed? | docs/CURRENT_STATUS.md |
| What's next? | docs/NEXT_STEPS.md |
| How's the system structured? | ARCHITECTURE_REPORT.md |

---

**Remember:** Documentation is living - it's updated as the project evolves. Always check the "Last Updated" date at the top of each file.
