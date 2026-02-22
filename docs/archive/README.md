# Archived Documentation

This folder contains historical documentation that has been superseded by newer versions.

## Archived Security Documentation (Feb 14-15, 2026)

These documents were created during an earlier security review before the comprehensive security hardening on Feb 18-19, 2026.

**Superseded by:** `security/` folder (created Feb 18-19)

### Files Archived:

1. **FINAL_SECURITY_REVIEW.md** (27K)
   - Date: Feb 15, 2026
   - Superseded by: `security/SECURITY_FIXES_SUMMARY.md`

2. **SECURITY_FIXES_APPLIED.md** (21K)
   - Date: Feb 15, 2026
   - Superseded by: `security/SECURITY_FIXES_SUMMARY.md`

3. **STRIPE_SECURITY_AND_INTEGRATION.md** (25K)
   - Date: Feb 15, 2026
   - Superseded by: `security/STRIPE_SECURITY_SETUP.md`

4. **QUICK_REFERENCE_STRIPE_SECURITY.md** (5.3K)
   - Date: Feb 15, 2026
   - Superseded by: `security/SECURITY_QUICK_START.md`

5. **STRIPE_INTEGRATION_GUIDE.md** (30K)
   - Date: Feb 15, 2026
   - Superseded by: `security/STRIPE_SECURITY_SETUP.md`

## Why Archived?

These documents reflected an earlier state of security fixes. On Feb 18-19, 2026, we:
- Fixed 8 critical vulnerabilities (vs earlier partial fixes)
- Added comprehensive security infrastructure (Rack::Attack, error monitoring, etc.)
- Created condensed, organized documentation in the `security/` folder
- Implemented automated and manual security testing suites

## Current Documentation

For up-to-date security and Stripe documentation, see:
- **`security/`** folder - All current security documentation
- **`docs/SCOOP_STRIPE_CONNECT_SETUP.md`** - Scoop-specific Stripe Connect guide (still current)

---

**Note:** These files are kept for historical reference and audit trail purposes.

---

## Archived Scoop Marketplace System (Feb 14-15, 2026)

**Location:** `docs/archive/old-scoop-system/`

These documents describe the **OLD Scoop system** that was **completely replaced** by MVP v3 on Feb 21-22, 2026.

**OLD System:** Competitive blocks/pledges/cleanups marketplace
- Multiple scoopers compete for blocks
- First-to-fund-wins mechanics
- PostGIS geospatial features
- Separate blocks, coverage_regions, pledges tables

**NEW System (MVP v3):** Block sponsorship subscriptions
- Monthly sponsorships
- GPS-verified sweeps
- Neighbor contributions
- Simpler sponsorships/sweeps/contributions model

### Files Archived:

1. **CLAUDE_CONTINUATION_PROMPT.md**
   - OLD system continuation context
   - Superseded by: `docs/MVP_V3_HANDOFF_PROMPT.md`

2. **SCOOP_SAFETY_VERIFICATION.md**
   - Safety verification for OLD system
   - No longer relevant (different architecture)

3. **APP_SEPARATION_COMPLETE.md**
   - App separation for OLD system
   - No longer relevant (different user model)

4. **TEMPORARY_STRIPE_CONFIG.md**
   - Stripe configuration for OLD blocks/pledges system
   - No longer relevant (MVP v3 uses different payment model)

5. **DEPLOYMENT_SUCCESS.md**
   - Deployment guide for OLD Scoop system
   - Superseded by MVP v3 deployment

6. **STRIPE_SETUP_COMPLETE.md**
   - Security setup for OLD system (Feb 15, 2026)
   - Superseded by current security docs

7. **AUTH_FIXES_COMPLETE.md**
   - Auth fixes for OLD system (Feb 21, 2026)
   - No longer relevant (different auth flow)

---

## Archived Session Prompts

**Location:** `docs/archive/old-prompts/`

Generic or outdated session kickoff prompts.

### Files Archived:

1. **CLAUDE_KICKOFF_BACKEND.md**
   - Date: Feb 20, 2026
   - Described one-off cleanup jobs system
   - Superseded by: `docs/MVP_V3_HANDOFF_PROMPT.md`

2. **NEW_MVP_IMPLEMENTATION_PROMPT.md**
   - Generic template with placeholders
   - No longer needed (specific docs exist)

---

## Current Documentation for New Sessions

**Use these for current development:**

1. **`docs/MVP_V3_HANDOFF_PROMPT.md`** - Complete handoff for new sessions
2. **`docs/MVP_V3_BACKEND_COMPLETE.md`** - Full MVP v3 technical reference
3. **`docs/SECURITY_QUICK_WINS.md`** - Security implementation guide
4. **`README.md`** - Project overview
5. **`DOCUMENTATION_INDEX.md`** - Navigate all docs
