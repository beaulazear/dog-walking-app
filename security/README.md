# Security Documentation

All security-related documentation for the Scoop dog-walking API platform.

## Quick Reference

### 🚀 Getting Started
- **[Quick Start Guide](SECURITY_QUICK_START.md)** - 5-minute security setup

### 🔒 Security Fixes
- **[Security Fixes Summary](SECURITY_FIXES_SUMMARY.md)** - All 8 critical vulnerability fixes implemented

### 💳 Stripe Security
- **[Stripe Security Setup](STRIPE_SECURITY_SETUP.md)** - Complete Stripe integration guide

### 🧪 Testing
- **[Automated Security Tests](security_test.rb)** - Run with: `ruby security/security_test.rb`
- **[Manual Security Tests](manual_security_tests.md)** - Step-by-step testing procedures

## Security Status

✅ **All Critical Vulnerabilities Fixed** (as of Feb 19, 2026)

1. SQL Injection - FIXED
2. Stripe Subscription Cancellation - FIXED
3. Unauthorized Pledge Access - FIXED
4. GPS Boundary Validation - FIXED
5. Pledge Amount Modification - FIXED
6. JWT Token Type Confusion - FIXED
7. User Enumeration - FIXED
8. File Upload Validation - FIXED

## Monitoring & Maintenance

### Daily Health Checks
```bash
rails stripe:monitor:health
rails stripe:monitor:errors
```

### Security Testing
```bash
# Automated tests
ruby security/security_test.rb

# Manual tests
# See manual_security_tests.md
```

### Rate Limiting
Configured via `config/initializers/rack_attack.rb`
- Login attempts: 5/hour per IP
- Signups: 3/day per IP
- API requests: 300/5min per IP

## Emergency Contacts

**Stripe Issues:**
- Dashboard: https://dashboard.stripe.com
- Support: support@stripe.com
- Status: https://status.stripe.com

**Security Incidents:**
1. Check `log/stripe_critical_errors.log`
2. Run monitoring rake tasks
3. Review error tracking service (when configured)

## Related Documentation

- [Project Status](../PROJECT_STATUS.md)
- [Documentation Index](../DOCUMENTATION_INDEX.md)
- [Changelog](../CHANGELOG.md)
