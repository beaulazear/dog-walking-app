# Infrastructure Services Guide - Scoop MVP

**Last Updated:** February 20, 2026
**Purpose:** Comprehensive guide to all services needed beyond the Rails app

---

## Overview

Your Rails app needs **supporting services** to function properly in production. This document explains what each service does, why you need it, and when to implement it.

**Current Status:**
- ✅ Rails app deployed on Render
- ✅ PostgreSQL database (included with Render)
- ✅ AWS S3 for file storage
- ⚠️ **Missing critical services** documented below

---

## Service Categories

### 🔴 **CRITICAL** - App won't work properly without these
### 🟡 **IMPORTANT** - Needed soon for production launch
### 🟢 **NICE TO HAVE** - Improves experience but not required

---

## 🔴 1. Redis (In-Memory Data Store)

### What It Is
Redis is a fast in-memory database used for caching, sessions, and background jobs.

### Why You Need It

**Current Problem:**
Your app uses Redis for **3 critical features** but doesn't have it configured:

1. **ActionCable (WebSockets)** - Real-time job updates
   - When a job is claimed, all users see it disappear from map instantly
   - Without Redis: WebSockets won't work, no real-time updates
   - Status: ⚠️ Currently using in-memory adapter (breaks with multiple servers)

2. **Sidekiq (Background Jobs)** - Job expiration timers
   - Jobs expire after 24 hours if unclaimed
   - Without Redis: Jobs never expire automatically
   - Status: ⚠️ Currently using async adapter (doesn't persist across restarts)

3. **Caching** - Speed up API responses
   - Cache expensive database queries
   - Without Redis: Slower API responses, higher database load

### When to Implement
🔴 **CRITICAL** - Implement before launch

**Why it's critical:**
- Real-time features won't work on Render (multiple server instances)
- Background jobs won't survive server restarts
- App will be slow without caching

### How to Implement

#### Option 1: Render Redis (Recommended)

**Pros:**
- Same platform as your app
- Easy setup (3 clicks)
- Automatic backups
- Free tier available

**Cons:**
- Free tier limits (25 MB, 30 connections)
- Paid tier: $7/month for 256 MB

**Setup Steps:**
1. Go to Render Dashboard
2. Click "New" → "Redis"
3. Choose "Free" tier for testing
4. Click "Create Redis"
5. Copy the "Internal Redis URL"
6. Add to your Rails app environment variables:
   ```
   REDIS_URL=redis://red-xxx.oregon-postgres.render.com:6379
   ```

7. Update `config/cable.yml`:
   ```yaml
   production:
     adapter: redis
     url: <%= ENV['REDIS_URL'] %>
     channel_prefix: scoop_production
   ```

8. Update `config/initializers/sidekiq.rb`:
   ```ruby
   Sidekiq.configure_server do |config|
     config.redis = { url: ENV['REDIS_URL'] }
   end

   Sidekiq.configure_client do |config|
     config.redis = { url: ENV['REDIS_URL'] }
   end
   ```

9. Redeploy your app

#### Option 2: Upstash Redis (Alternative)

**Pros:**
- Better free tier (10,000 commands/day)
- Pay-per-use pricing
- Global edge network

**Cons:**
- Separate service to manage
- Requires credit card for setup

**Setup:** Similar to Render, just use Upstash URL

### Cost
- **Free tier:** 25 MB on Render (enough for MVP)
- **Paid:** $7/month (Render) or ~$0.20/10K commands (Upstash)

### Testing
```bash
# After setup, test Redis connection
rails console

# Try caching
Rails.cache.write('test', 'hello')
Rails.cache.read('test')  # Should return "hello"

# Try Sidekiq
CleanupJobExpirationJob.perform_later(job_id: 1)
```

---

## 🔴 2. Cron Job Service (Scheduled Tasks)

### What It Is
A service that runs tasks on a schedule (like cron on Unix systems).

### Why You Need It

**Current Problem:**
Recurring cleanup subscriptions need a **daily job** to generate CleanupJobs:

```bash
# This needs to run every day at 6 AM
rails recurring_cleanups:generate_jobs
```

**Without cron:**
- Subscriptions won't generate jobs automatically
- Users will pay monthly but get no service
- Manual job generation required (not scalable)

### When to Implement
🔴 **CRITICAL** - Implement IMMEDIATELY (you have recurring subscriptions live!)

### How to Implement

#### Option 1: Render Cron Jobs (Recommended)

**Pros:**
- Integrated with Render
- Simple setup
- Free (uses your existing Rails service)

**Cons:**
- Spins up new container for each job (slower)
- Limited scheduling options

**Setup Steps:**

1. Create `render.yaml` in your project root:
   ```yaml
   services:
     - type: web
       name: dog-walking-app
       env: ruby
       buildCommand: bundle install
       startCommand: bundle exec puma -C config/puma.rb
       envVars:
         - key: DATABASE_URL
           fromDatabase:
             name: dog-walking-app-db
             property: connectionString
         - key: REDIS_URL
           fromService:
             name: dog-walking-app-redis
             type: redis
             property: connectionString
         - key: RAILS_MASTER_KEY
           sync: false

     - type: worker
       name: dog-walking-app-sidekiq
       env: ruby
       buildCommand: bundle install
       startCommand: bundle exec sidekiq -C config/sidekiq.yml
       envVars:
         - key: DATABASE_URL
           fromDatabase:
             name: dog-walking-app-db
             property: connectionString
         - key: REDIS_URL
           fromService:
             name: dog-walking-app-redis
             type: redis
             property: connectionString

   jobs:
     - type: cron
       name: generate-recurring-jobs
       env: ruby
       schedule: "0 6 * * *"  # Every day at 6 AM EST
       buildCommand: bundle install
       startCommand: rails recurring_cleanups:generate_jobs

   databases:
     - name: dog-walking-app-db
       databaseName: scoop_production
       plan: free

   services:
     - type: redis
       name: dog-walking-app-redis
       plan: free
   ```

2. Commit and push to GitHub
3. Render will auto-deploy with new cron job

#### Option 2: Heroku Scheduler (If using Heroku)

**Setup:**
1. Add Heroku Scheduler addon
2. Configure job:
   - Task: `rails recurring_cleanups:generate_jobs`
   - Frequency: Daily at 6:00 AM

#### Option 3: GitHub Actions (Free alternative)

**Pros:**
- Completely free
- No additional service needed

**Cons:**
- Requires GitHub
- Less reliable for mission-critical tasks

**Setup:**

Create `.github/workflows/cron.yml`:
```yaml
name: Daily Recurring Job Generation

on:
  schedule:
    - cron: '0 6 * * *'  # 6 AM UTC daily
  workflow_dispatch:  # Manual trigger

jobs:
  generate_jobs:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Render cron
        run: |
          curl -X POST https://www.pocket-walks.com/admin/cron/generate_jobs \
            -H "Authorization: Bearer ${{ secrets.ADMIN_API_KEY }}"
```

### Cost
- **Render:** Free (included)
- **Heroku Scheduler:** Free
- **GitHub Actions:** Free

### Testing
```bash
# Test the rake task manually first
rails recurring_cleanups:generate_jobs

# Should see output like:
# 🔄 Generating recurring cleanup jobs...
#   ✅ Generated job for 123 Main St (weekly)
# 📊 Summary: Generated: 2 jobs
```

---

## 🟡 3. Sidekiq (Background Job Processor)

### What It Is
A background job processor that handles tasks asynchronously (outside the web request).

### Why You Need It

**Current Uses in Your App:**

1. **Job Expiration** - Jobs expire 24 hours after creation
   ```ruby
   CleanupJobExpirationJob.set(wait: 24.hours).perform_later(job_id: job.id)
   ```

2. **Photo Processing** - Analyze uploaded images
   ```ruby
   ActiveStorage::AnalyzeJob.perform_later(blob)
   ```

3. **Push Notifications** - Send notifications without slowing down API
   ```ruby
   SendNotificationJob.perform_later(user_id: user.id, message: "Job claimed!")
   ```

**Without Sidekiq:**
- Jobs processed in-memory (lost on restart)
- Can't retry failed jobs
- Slow API responses (notifications block request)

### When to Implement
🟡 **IMPORTANT** - Implement within first week of launch

**Why it's important:**
- Job expiration is a core feature
- Push notifications should be fast
- Need retry logic for failed jobs

### How to Implement

**Prerequisites:**
- ✅ Redis must be set up first (Sidekiq requires Redis)

**Setup Steps:**

1. Add Sidekiq worker to Render (via `render.yaml` above)

2. Or manually in Render Dashboard:
   - Click "New" → "Background Worker"
   - Name: "dog-walking-app-sidekiq"
   - Start Command: `bundle exec sidekiq -C config/sidekiq.yml`
   - Environment: Copy from web service

3. Create `config/sidekiq.yml`:
   ```yaml
   :concurrency: 5
   :queues:
     - default
     - mailers
     - active_storage_analysis
     - active_storage_purge
   ```

4. Update `config/application.rb`:
   ```ruby
   config.active_job.queue_adapter = :sidekiq
   ```

5. Deploy

### Monitoring Sidekiq

Add to `config/routes.rb`:
```ruby
require 'sidekiq/web'

authenticate :user, ->(user) { user.admin? } do
  mount Sidekiq::Web => '/sidekiq'
end
```

Access at: `https://www.pocket-walks.com/sidekiq`

### Cost
- **Free** - Uses your existing Rails service resources
- Render charges by container size, not number of processes

### Testing
```bash
# Test Sidekiq is working
rails console

# Queue a test job
CleanupJobExpirationJob.perform_later(job_id: 1)

# Check Sidekiq dashboard
# Visit https://www.pocket-walks.com/sidekiq
```

---

## 🟡 4. Email Service (Transactional Emails)

### What It Is
A service for sending automated emails (notifications, receipts, password resets).

### Why You Need It

**Current Problem:**
Your app has NO email configured. Users can't:
- Reset passwords
- Get payment receipts
- Receive job notifications (if they want email)

**Future Use Cases:**
- Password reset emails
- Stripe payment receipts
- Weekly summary emails ("You earned $150 this week!")
- Subscription renewal reminders
- Dispute notifications

### When to Implement
🟡 **IMPORTANT** - Before public launch

**Why it's important:**
- Password resets are critical for user support
- Payment receipts required for tax purposes
- Professional appearance

### How to Implement

#### Option 1: SendGrid (Recommended)

**Pros:**
- 100 emails/day free
- Easy Rails integration
- Good deliverability

**Cons:**
- Requires API key
- Free tier limited

**Setup:**

1. Sign up at sendgrid.com
2. Create API key
3. Add to Render environment variables:
   ```
   SENDGRID_API_KEY=SG.xxx
   ```

4. Update `config/environments/production.rb`:
   ```ruby
   config.action_mailer.delivery_method = :smtp
   config.action_mailer.smtp_settings = {
     address: 'smtp.sendgrid.net',
     port: 587,
     domain: 'pocket-walks.com',
     user_name: 'apikey',
     password: ENV['SENDGRID_API_KEY'],
     authentication: 'plain',
     enable_starttls_auto: true
   }

   config.action_mailer.default_url_options = {
     host: 'www.pocket-walks.com',
     protocol: 'https'
   }
   ```

#### Option 2: Postmark (Alternative)

**Pros:**
- Better deliverability
- Cleaner interface
- 100 emails/month free

**Cons:**
- Smaller free tier

**Setup:** Similar to SendGrid

#### Option 3: AWS SES (Cheapest)

**Pros:**
- $0.10 per 1,000 emails
- You already have AWS account

**Cons:**
- Requires verification
- More setup work

### Cost
- **SendGrid:** Free (100/day), then $15/month (40,000/month)
- **Postmark:** Free (100/month), then $10/month (10,000/month)
- **AWS SES:** $0.10 per 1,000 emails

### Testing
```ruby
# In rails console
UserMailer.password_reset(user).deliver_now
```

---

## 🟢 5. Error Monitoring (Sentry, Bugsnag)

### What It Is
Service that catches and reports errors happening in production.

### Why You Need It

**Current Problem:**
When errors happen in production, you have NO IDEA unless users report them.

**What it catches:**
- 500 errors in API
- JavaScript errors in frontend
- Background job failures
- Performance issues

### When to Implement
🟢 **NICE TO HAVE** - Week 2-3 after launch

### How to Implement

#### Sentry (Recommended)

1. Sign up at sentry.io
2. Add gem: `gem 'sentry-ruby'` and `gem 'sentry-rails'`
3. Create `config/initializers/sentry.rb`:
   ```ruby
   Sentry.init do |config|
     config.dsn = ENV['SENTRY_DSN']
     config.breadcrumbs_logger = [:active_support_logger, :http_logger]
     config.traces_sample_rate = 0.5
     config.environment = Rails.env
   end
   ```

### Cost
- **Free:** 5,000 errors/month
- **Paid:** $26/month for 50,000 errors

---

## 🟢 6. APM (Application Performance Monitoring)

### What It Is
Tools that show you where your app is slow and why.

### Options
- **New Relic** - Full featured, $99/month
- **Scout APM** - Rails-focused, $79/month
- **Skylight** - Simple, $20/month

### When to Implement
🟢 **NICE TO HAVE** - After you have real users

### Why it's useful
- Find slow database queries
- Identify bottlenecks
- Optimize API response times

---

## 🟢 7. Database Backups

### What It Is
Automatic backups of your PostgreSQL database.

### Why You Need It

**Current Status:**
- Render Free tier: NO automatic backups ⚠️
- Render Paid tier: Daily backups included

**Risk without backups:**
- Database corruption = lose all data
- Accidental deletion = no recovery

### When to Implement
🟢 **NICE TO HAVE** - If you upgrade to paid Render plan

### How to Implement

#### Option 1: Upgrade Render Database
- $7/month for Starter plan
- Includes daily backups
- Point-in-time recovery

#### Option 2: Manual Backups (Free)

Create GitHub Action `.github/workflows/backup.yml`:
```yaml
name: Weekly Database Backup

on:
  schedule:
    - cron: '0 2 * * 0'  # Every Sunday at 2 AM

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - name: Backup database
        run: |
          pg_dump $DATABASE_URL > backup.sql
          # Upload to S3 or GitHub release
```

### Cost
- **Render Starter:** $7/month (includes backups)
- **Manual:** Free (requires setup)

---

## Implementation Roadmap

### Phase 1: CRITICAL (Do This Week) 🔴

**Order of implementation:**

1. **Redis** (1-2 hours)
   - Set up Render Redis (free tier)
   - Configure ActionCable
   - Configure Sidekiq
   - Test WebSockets
   - **Why first:** Required for Sidekiq and cron jobs

2. **Cron Job** (30 minutes)
   - Add `render.yaml` with cron job config
   - Test recurring job generation
   - **Why second:** Subscriptions are live but not generating jobs!

3. **Sidekiq Worker** (1 hour)
   - Add Sidekiq worker to Render
   - Test background jobs
   - Monitor Sidekiq dashboard
   - **Why third:** Depends on Redis, needed for job expiration

**Estimated Time:** 4 hours
**Cost:** $0 (all free tiers)

### Phase 2: IMPORTANT (Before Public Launch) 🟡

**Launch checklist:**

4. **Email Service** (2 hours)
   - Sign up for SendGrid
   - Configure SMTP
   - Test password resets
   - Create email templates

5. **Monitoring Setup** (1 hour)
   - Add Sentry for error tracking
   - Configure alerts
   - Test error reporting

6. **Upgrade Redis** (if needed)
   - Monitor free tier usage
   - Upgrade if hitting limits ($7/month)

**Estimated Time:** 3 hours
**Cost:** $0-7/month

### Phase 3: NICE TO HAVE (After Launch) 🟢

7. **Database Backups** (if on free tier)
   - Set up manual backup script
   - Or upgrade to Render Starter ($7/month)

8. **APM** (optional)
   - Add performance monitoring
   - Optimize slow queries

9. **CDN** (if needed)
   - Add Cloudflare for faster S3 assets
   - Cache API responses at edge

**Estimated Time:** Varies
**Cost:** $0-100/month depending on choices

---

## Quick Setup Guide (This Weekend)

### Saturday Morning (4 hours)

```bash
# 1. Set up Redis (1 hour)
# - Go to Render → New → Redis
# - Copy URL to environment variables
# - Update cable.yml and sidekiq.rb
# - Deploy

# 2. Set up Cron Job (30 min)
# - Create render.yaml
# - Commit and push
# - Render auto-deploys

# 3. Set up Sidekiq (1 hour)
# - Add worker to render.yaml
# - Configure sidekiq.yml
# - Deploy
# - Test jobs

# 4. Testing (1.5 hours)
# - Test WebSockets work
# - Test job expiration
# - Test cron job runs
# - Monitor Sidekiq dashboard
```

### Sunday (Optional - Email)

```bash
# Set up SendGrid (2 hours)
# - Create account
# - Get API key
# - Configure mailer
# - Test emails
```

---

## Cost Breakdown

### Free Tier (MVP)
```
Redis (Render):           $0/month (free tier)
Cron Jobs (Render):       $0/month (included)
Sidekiq:                  $0/month (uses web service)
Email (SendGrid):         $0/month (100/day)
─────────────────────────────────
TOTAL:                    $0/month
```

### Production (Recommended)
```
Redis (Render):           $7/month (256 MB)
Cron Jobs:                $0/month (included)
Sidekiq:                  $0/month (included)
Email (SendGrid):         $15/month (40K/month)
Database Backups:         $7/month (Render Starter)
Error Monitoring:         $26/month (Sentry)
─────────────────────────────────
TOTAL:                    $55/month
```

---

## Frequently Asked Questions

### Q: Can I launch without Redis?
**A:** Not recommended. Your real-time features won't work with multiple servers, and background jobs won't persist. Use the free tier at minimum.

### Q: What happens if I don't set up the cron job?
**A:** Recurring subscriptions will charge users monthly but never generate cleanup jobs. This would be a critical bug!

### Q: Do I need Sidekiq if I have cron jobs?
**A:** Yes, they're different:
- **Cron jobs:** Run on a schedule (daily, weekly)
- **Sidekiq:** Run immediately when triggered (job expiration, notifications)

### Q: Can I use free tiers forever?
**A:** For MVP, yes. But you'll hit limits as you grow:
- Redis: 25 MB fills up with ~1,000 cached items
- SendGrid: 100/day = ~3,000/month limit
- Switch to paid when you hit 80% of limits

### Q: What's the most important service to implement first?
**A:** Redis, because it enables both Sidekiq AND cron jobs. Everything else depends on it.

---

## Summary

**This Week (Critical):**
1. ✅ Set up Redis (free)
2. ✅ Set up cron job for recurring cleanups (free)
3. ✅ Set up Sidekiq worker (free)

**Before Launch (Important):**
4. ✅ Set up SendGrid for emails (free tier)
5. ✅ Set up Sentry for error monitoring (free tier)

**After Launch (Nice to Have):**
6. Database backups ($7/month)
7. APM monitoring ($20-99/month)
8. Upgrade services as you grow

**Total MVP Cost:** $0/month (all free tiers)
**Total Production Cost:** ~$55/month (paid tiers)

---

**Next Steps:**
1. Read through this document
2. Follow Phase 1 implementation (4 hours)
3. Test everything works
4. Launch your MVP! 🚀
