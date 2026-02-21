# Quick Start Prompt (Copy & Paste)

**Copy everything below the line for new sessions:**

---

I'm implementing new features for a Rails API + React Native app ecosystem. Please review the current state before we start.

## Project Context

**Repo:** `/Users/beaulazear/Desktop/dog-walking-app/` (Rails API)
**Mobile:** `/Users/beaulazear/Desktop/scoop-mobile/` (React Native)
**Production:** https://dog-walking-app.onrender.com (Render) | https://www.pocket-walks.com

## Products (Shared Backend)
1. **Pocket Walks** - Dog walking management (web + mobile)
2. **Trainer** - Training tracker (web)
3. **Scoop** - Cleanup marketplace (mobile MVP)
   - One-off jobs (job board)
   - Recurring subscriptions (like cleaning service)

## Current Tech Stack
- Rails 7.2 + PostgreSQL
- JWT authentication (all products)
- AWS S3, Stripe (test mode)
- React Native (Expo) for mobile

## Recent Changes (Feb 20, 2026)
✅ Security hardened (HTTPS, rate limiting, headers)
✅ Recurring subscriptions added
✅ JWT-only auth (no sessions)
✅ Infrastructure docs created

## Key Documentation
Read before making changes:
- `docs/CURRENT_STATUS.md` - Full project status
- `docs/SCOOP_MVP_TESTING_GUIDE.md` - API testing guide
- `docs/FRONTEND_INTEGRATION_PROMPT.md` - Frontend specs

## Database Schema (Key Tables)
**Scoop MVP:** `cleanup_jobs`, `recurring_cleanups`, `reviews`
**Pocket Walks:** `users`, `pets`, `appointments`, `invoices`
**Dormant:** `blocks`, `pledges`, `cleanups` (old system, ignore)

## Critical Constraints
- ⚠️ DO NOT break Pocket Walks/Trainer (shared backend)
- ⚠️ Keep JWT auth pattern consistent
- ⚠️ Test changes don't affect other products
- ✅ Update docs as we go

---

## New Requirements

[PASTE YOUR MVP/UI/UX DOCUMENTS HERE]

---

**Instructions:**
1. Review current implementation (use docs above)
2. Compare to new requirements
3. Identify backend changes needed (migrations, models, endpoints)
4. Identify frontend changes needed (screens, components, flows)
5. Create implementation plan
6. Ask clarifying questions
7. Execute changes safely
