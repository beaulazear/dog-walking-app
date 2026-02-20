# Infrastructure Implementation Plan

**Purpose:** Step-by-step checklist to implement all infrastructure services
**Estimated Total Time:** 8-10 hours
**Total Cost:** $0 (using free tiers)

---

## 📋 Pre-Implementation Checklist

Before you start, make sure you have:

- [ ] Access to Render dashboard
- [ ] Git repository connected to Render
- [ ] Rails app currently deployed and working
- [ ] Admin access to your app (to test features)
- [ ] 4-6 hours of uninterrupted time this weekend

---

## Phase 1: Redis Setup (Critical) 🔴

**Time Required:** 1-2 hours
**Cost:** $0 (free tier)

### Step 1.1: Create Redis Instance on Render

1. [ ] Log in to Render dashboard (https://dashboard.render.com)
2. [ ] Click "New +" button in top right
3. [ ] Select "Redis"
4. [ ] Configure Redis:
   - Name: `dog-walking-app-redis`
   - Region: Same as your web service (Oregon)
   - Plan: **Free** (25 MB, 30 connections)
   - Eviction Policy: `noeviction` (default)
5. [ ] Click "Create Redis"
6. [ ] Wait for Redis to deploy (2-3 minutes)
7. [ ] Copy the **Internal Redis URL**
   - Format: `redis://red-xxxxx:6379`
   - ⚠️ Use INTERNAL URL, not external
8. [ ] Keep this URL handy for next step

### Step 1.2: Add Redis URL to Rails App

1. [ ] Go to your Rails web service in Render
2. [ ] Click "Environment" tab
3. [ ] Click "Add Environment Variable"
4. [ ] Add:
   - Key: `REDIS_URL`
   - Value: (paste Internal Redis URL from Step 1.1)
5. [ ] Click "Save Changes"
6. [ ] ⚠️ Don't click "Manual Deploy" yet - we'll deploy after all config changes

### Step 1.3: Configure ActionCable for Redis

1. [ ] Open your local code editor
2. [ ] Edit `config/cable.yml`
3. [ ] Update production section:

```yaml
production:
  adapter: redis
  url: <%= ENV.fetch('REDIS_URL', 'redis://localhost:6379/1') %>
  channel_prefix: scoop_production
```

4. [ ] Save file
5. [ ] Commit changes:

```bash
git add config/cable.yml
git commit -m "Configure ActionCable to use Redis in production"
```

### Step 1.4: Configure Sidekiq for Redis

1. [ ] Create file `config/initializers/sidekiq.rb`:

```ruby
# config/initializers/sidekiq.rb
Sidekiq.configure_server do |config|
  config.redis = { url: ENV.fetch('REDIS_URL', 'redis://localhost:6379/1') }
end

Sidekiq.configure_client do |config|
  config.redis = { url: ENV.fetch('REDIS_URL', 'redis://localhost:6379/1') }
end
```

2. [ ] Save file
3. [ ] Commit changes:

```bash
git add config/initializers/sidekiq.rb
git commit -m "Configure Sidekiq to use Redis"
```

### Step 1.5: Update Application Config

1. [ ] Edit `config/application.rb`
2. [ ] Make sure this line exists (should already be there):

```ruby
config.active_job.queue_adapter = :sidekiq
```

3. [ ] If you had to add it, commit:

```bash
git add config/application.rb
git commit -m "Set ActiveJob to use Sidekiq"
```

### Step 1.6: Deploy Changes

1. [ ] Push all commits to GitHub:

```bash
git push origin main
```

2. [ ] Render will auto-deploy (watch logs in Render dashboard)
3. [ ] Wait for deploy to complete (3-5 minutes)

### Step 1.7: Test Redis Connection

1. [ ] Go to Render dashboard → your web service
2. [ ] Click "Shell" tab
3. [ ] Click "Launch Shell"
4. [ ] Run these commands:

```bash
# Test Rails can connect to Redis
rails console

# In console, test caching:
Rails.cache.write('test_key', 'hello from redis')
Rails.cache.read('test_key')
# Should return: "hello from redis"

# Test Redis is working
Rails.cache.redis.ping
# Should return: "PONG"

exit
```

5. [ ] ✅ If all tests pass, Redis is working!

---

## Phase 2: Sidekiq Worker Setup (Critical) 🔴

**Time Required:** 1 hour
**Cost:** $0 (uses existing resources)
**Prerequisites:** ✅ Redis must be set up first

### Step 2.1: Create Sidekiq Configuration

1. [ ] Create file `config/sidekiq.yml`:

```yaml
# config/sidekiq.yml
:concurrency: 5
:timeout: 25
:verbose: false
:queues:
  - critical
  - default
  - mailers
  - active_storage_analysis
  - active_storage_purge
  - low_priority

# Retry failed jobs
:max_retries: 3
```

2. [ ] Commit:

```bash
git add config/sidekiq.yml
git commit -m "Add Sidekiq configuration"
git push origin main
```

### Step 2.2: Create Sidekiq Worker on Render

1. [ ] Go to Render dashboard
2. [ ] Click "New +" → "Background Worker"
3. [ ] Configure worker:
   - Name: `dog-walking-app-sidekiq`
   - Environment: **Ruby**
   - Region: Same as web service (Oregon)
   - Branch: `main`
   - Build Command: `bundle install`
   - Start Command: `bundle exec sidekiq -C config/sidekiq.yml`
   - Plan: **Free**
4. [ ] Add Environment Variables (copy from web service):
   - Click "Advanced" → "Add from Service"
   - Select your web service
   - This copies all environment variables
5. [ ] Click "Create Background Worker"
6. [ ] Wait for worker to deploy (3-5 minutes)

### Step 2.3: Add Sidekiq Web UI (Optional but Recommended)

1. [ ] Edit `config/routes.rb`
2. [ ] Add this at the top (after the first line):

```ruby
require 'sidekiq/web'

Rails.application.routes.draw do
  # Sidekiq web UI - only accessible by admins
  authenticate :user, ->(user) { user.admin? } do
    mount Sidekiq::Web => '/admin/sidekiq'
  end

  # ... rest of your routes
```

3. [ ] Commit:

```bash
git add config/routes.rb
git commit -m "Add Sidekiq web UI for monitoring"
git push origin main
```

### Step 2.4: Test Sidekiq

1. [ ] Open Rails console on Render (Shell tab)
2. [ ] Test background job:

```ruby
# Queue a test job
TestJob.perform_later("Hello Sidekiq!")

# Or use a real job
CleanupJobExpirationJob.perform_later(job_id: 1)
```

3. [ ] Go to your app: `https://www.pocket-walks.com/admin/sidekiq`
4. [ ] Log in as admin user
5. [ ] You should see:
   - Jobs processed count
   - Queue sizes
   - Recent jobs
6. [ ] ✅ If you see the dashboard, Sidekiq is working!

---

## Phase 3: Cron Job Setup (Critical) 🔴

**Time Required:** 30-60 minutes
**Cost:** $0 (included with Render)
**Prerequisites:** ✅ Redis and Sidekiq must be set up first

### Step 3.1: Create render.yaml

1. [ ] Create file `render.yaml` in project root:

```yaml
services:
  # Main web application
  - type: web
    name: dog-walking-app
    env: ruby
    region: oregon
    plan: free
    buildCommand: bundle install && rails db:migrate
    startCommand: bundle exec puma -C config/puma.rb
    envVars:
      - key: DATABASE_URL
        fromDatabase:
          name: dog-walking-app-db
          property: connectionString
      - key: REDIS_URL
        fromService:
          type: redis
          name: dog-walking-app-redis
          property: connectionString
      - key: RAILS_MASTER_KEY
        sync: false
      - key: AWS_ACCESS_KEY_ID
        sync: false
      - key: AWS_SECRET_ACCESS_KEY
        sync: false
      - key: AWS_REGION
        sync: false
      - key: AWS_BUCKET
        sync: false

  # Sidekiq background worker
  - type: worker
    name: dog-walking-app-sidekiq
    env: ruby
    region: oregon
    plan: free
    buildCommand: bundle install
    startCommand: bundle exec sidekiq -C config/sidekiq.yml
    envVars:
      - key: DATABASE_URL
        fromDatabase:
          name: dog-walking-app-db
          property: connectionString
      - key: REDIS_URL
        fromService:
          type: redis
          name: dog-walking-app-redis
          property: connectionString
      - key: RAILS_MASTER_KEY
        sync: false

  # Redis
  - type: redis
    name: dog-walking-app-redis
    region: oregon
    plan: free
    maxmemoryPolicy: noeviction

# Cron jobs
jobs:
  # Generate recurring cleanup jobs daily
  - type: cron
    name: generate-recurring-jobs
    env: ruby
    region: oregon
    schedule: "0 10 * * *"  # 10 AM UTC = 6 AM EST / 3 AM PST
    buildCommand: bundle install
    startCommand: rails recurring_cleanups:generate_jobs
    envVars:
      - key: DATABASE_URL
        fromDatabase:
          name: dog-walking-app-db
          property: connectionString
      - key: REDIS_URL
        fromService:
          type: redis
          name: dog-walking-app-redis
          property: connectionString
      - key: RAILS_MASTER_KEY
        sync: false

# Database
databases:
  - name: dog-walking-app-db
    databaseName: scoop_production
    plan: free
```

2. [ ] ⚠️ **IMPORTANT:** Check the schedule time!
   - `"0 10 * * *"` = 10 AM UTC
   - Convert to your timezone:
     - EST: 10 AM UTC = 5 AM EST
     - PST: 10 AM UTC = 2 AM PST
   - Adjust if needed (format: `"minute hour * * *"`)

3. [ ] Commit:

```bash
git add render.yaml
git commit -m "Add render.yaml with cron job for recurring cleanups"
git push origin main
```

### Step 3.2: Enable Blueprint on Render

1. [ ] Go to Render dashboard
2. [ ] Click your web service
3. [ ] Look for banner: "Blueprint detected in repository"
4. [ ] Click "Apply Blueprint"
5. [ ] Review changes (should show cron job being added)
6. [ ] Click "Apply"
7. [ ] Wait for changes to deploy

### Step 3.3: Verify Cron Job Created

1. [ ] Go to Render dashboard
2. [ ] You should see new service: `generate-recurring-jobs`
3. [ ] Click on it
4. [ ] Check:
   - Status: "Suspended" (normal - only runs on schedule)
   - Schedule: Shows your cron expression
   - Last Run: Will be empty until first run
   - Next Run: Shows when it will run next

### Step 3.4: Test Cron Job (Manual Trigger)

1. [ ] Click on `generate-recurring-jobs` in Render
2. [ ] Click "Manual Deploy" button
3. [ ] This triggers the job immediately
4. [ ] Watch the logs
5. [ ] You should see:

```
🔄 Generating recurring cleanup jobs...
📊 Summary:
   Generated: X jobs
   Skipped: Y jobs
   Total active subscriptions checked: Z
```

6. [ ] ✅ If you see the summary, cron job works!

### Step 3.5: Create Test Subscription (If Needed)

If you see "Total active subscriptions checked: 0", create a test subscription:

1. [ ] Use API to create test subscription:

```bash
curl -X POST https://www.pocket-walks.com/recurring_cleanups \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "recurring_cleanup": {
      "address": "123 Test St, Brooklyn, NY",
      "latitude": 40.6782,
      "longitude": -73.9442,
      "frequency": "weekly",
      "day_of_week": 2,
      "price": 40,
      "job_type": "poop",
      "segments_selected": ["north"],
      "poop_itemization": "4-8"
    }
  }'
```

2. [ ] Set `next_job_date` to today in Rails console:

```ruby
RecurringCleanup.last.update(next_job_date: Date.current)
```

3. [ ] Run cron job manually again (Manual Deploy)
4. [ ] Should see "Generated: 1 job"

---

## Phase 4: Email Service Setup (Important) 🟡

**Time Required:** 1-2 hours
**Cost:** $0 (100 emails/day free)
**Priority:** Before public launch

### Step 4.1: Sign Up for SendGrid

1. [ ] Go to https://sendgrid.com/
2. [ ] Click "Start for Free"
3. [ ] Create account with your email
4. [ ] Verify email address
5. [ ] Complete account setup

### Step 4.2: Create API Key

1. [ ] Log in to SendGrid dashboard
2. [ ] Go to Settings → API Keys
3. [ ] Click "Create API Key"
4. [ ] Name: `Scoop Production`
5. [ ] Permission: **Full Access**
6. [ ] Click "Create & View"
7. [ ] **Copy the API key** (only shown once!)
8. [ ] Save it somewhere safe temporarily

### Step 4.3: Add SendGrid to Render

1. [ ] Go to Render dashboard → your web service
2. [ ] Click "Environment" tab
3. [ ] Add environment variable:
   - Key: `SENDGRID_API_KEY`
   - Value: (paste API key from Step 4.2)
4. [ ] Click "Save Changes"
5. [ ] Render will auto-redeploy

### Step 4.4: Configure Rails Mailer

1. [ ] Edit `config/environments/production.rb`
2. [ ] Add these lines in the `Rails.application.configure do` block:

```ruby
# Email configuration (SendGrid)
config.action_mailer.delivery_method = :smtp
config.action_mailer.perform_deliveries = true
config.action_mailer.raise_delivery_errors = true

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

3. [ ] Commit:

```bash
git add config/environments/production.rb
git commit -m "Configure SendGrid for production emails"
git push origin main
```

### Step 4.5: Create Test Mailer

1. [ ] Generate mailer:

```bash
rails generate mailer UserMailer
```

2. [ ] Edit `app/mailers/user_mailer.rb`:

```ruby
class UserMailer < ApplicationMailer
  default from: 'noreply@pocket-walks.com'

  def test_email(user)
    @user = user
    mail(
      to: user.email_address,
      subject: 'Test Email from Scoop'
    )
  end

  def password_reset(user)
    @user = user
    @reset_url = "https://www.pocket-walks.com/reset-password/#{user.reset_token}"
    mail(
      to: user.email_address,
      subject: 'Reset your Scoop password'
    )
  end
end
```

3. [ ] Create view `app/views/user_mailer/test_email.html.erb`:

```html
<!DOCTYPE html>
<html>
  <head>
    <meta content='text/html; charset=UTF-8' http-equiv='Content-Type' />
  </head>
  <body>
    <h1>Hello <%= @user.name %>!</h1>
    <p>This is a test email from Scoop.</p>
    <p>Your email is configured correctly! 🎉</p>
  </body>
</html>
```

4. [ ] Commit:

```bash
git add app/mailers/ app/views/user_mailer/
git commit -m "Add test mailer"
git push origin main
```

### Step 4.6: Test Email in Production

1. [ ] Open Rails console on Render (Shell tab)
2. [ ] Send test email:

```ruby
user = User.first
UserMailer.test_email(user).deliver_now
```

3. [ ] Check your email inbox
4. [ ] ✅ If you received the email, SendGrid is working!

### Step 4.7: Verify Domain (Optional but Recommended)

1. [ ] Go to SendGrid dashboard → Settings → Sender Authentication
2. [ ] Click "Authenticate Your Domain"
3. [ ] Enter your domain: `pocket-walks.com`
4. [ ] Follow DNS setup instructions
5. [ ] Add DNS records to your domain registrar
6. [ ] Wait for verification (can take 24-48 hours)
7. [ ] This improves deliverability (fewer emails in spam)

---

## Phase 5: Error Monitoring Setup (Nice to Have) 🟢

**Time Required:** 1 hour
**Cost:** $0 (5,000 errors/month free)
**Priority:** Week 2-3 after launch

### Step 5.1: Sign Up for Sentry

1. [ ] Go to https://sentry.io/
2. [ ] Click "Get Started"
3. [ ] Create account
4. [ ] Select "Rails" as platform
5. [ ] Note your DSN (will look like: `https://xxx@xxx.ingest.sentry.io/xxx`)

### Step 5.2: Add Sentry to Rails

1. [ ] Add to `Gemfile`:

```ruby
gem 'sentry-ruby'
gem 'sentry-rails'
```

2. [ ] Install:

```bash
bundle install
```

3. [ ] Create `config/initializers/sentry.rb`:

```ruby
Sentry.init do |config|
  config.dsn = ENV['SENTRY_DSN']
  config.breadcrumbs_logger = [:active_support_logger, :http_logger]

  # Sample 50% of transactions for performance monitoring
  config.traces_sample_rate = 0.5

  # Set environment
  config.environment = Rails.env

  # Send more context
  config.send_default_pii = false  # Set true if you want user data

  # Filter sensitive data
  config.excluded_exceptions += ['ActionController::RoutingError']
end
```

4. [ ] Add to Render environment variables:
   - Key: `SENTRY_DSN`
   - Value: (your DSN from Sentry)

5. [ ] Commit:

```bash
bundle lock
git add Gemfile Gemfile.lock config/initializers/sentry.rb
git commit -m "Add Sentry error monitoring"
git push origin main
```

### Step 5.3: Test Sentry

1. [ ] Trigger a test error in Rails console:

```ruby
begin
  1 / 0
rescue => e
  Sentry.capture_exception(e)
end
```

2. [ ] Go to Sentry dashboard
3. [ ] Check "Issues" tab
4. [ ] You should see "ZeroDivisionError"
5. [ ] ✅ If you see the error, Sentry is working!

---

## Post-Implementation Checklist

### Verify Everything Works

- [ ] **Redis:** Run `Rails.cache.redis.ping` in console (should return "PONG")
- [ ] **Sidekiq:** Check dashboard at `/admin/sidekiq` (should show stats)
- [ ] **Cron Job:** Manually trigger and check logs (should see job summary)
- [ ] **Email:** Send test email (should receive in inbox)
- [ ] **Sentry:** Trigger test error (should appear in dashboard)

### Monitor First 24 Hours

- [ ] Check Sidekiq dashboard for failed jobs
- [ ] Verify cron job runs on schedule (check "Last Run" time)
- [ ] Monitor Redis memory usage (Render dashboard)
- [ ] Check email deliverability (ask test users if they got emails)
- [ ] Review Sentry for any unexpected errors

### Performance Checks

- [ ] Test WebSocket connections (job updates should be instant)
- [ ] Test job expiration (create job, wait 24 hours, should expire)
- [ ] Test recurring job generation (next morning, check if jobs created)
- [ ] Test background jobs (upload photo, should process async)

---

## Troubleshooting Guide

### Redis Connection Errors

**Error:** `Error connecting to Redis`

**Solutions:**
1. Check REDIS_URL is set in environment variables
2. Verify Redis service is running on Render
3. Use INTERNAL URL, not external URL
4. Restart web service and Sidekiq worker

### Sidekiq Not Processing Jobs

**Error:** Jobs queued but never processed

**Solutions:**
1. Check Sidekiq worker is running (Render dashboard)
2. Verify Redis connection (see above)
3. Check Sidekiq logs for errors
4. Restart Sidekiq worker

### Cron Job Not Running

**Error:** Cron job shows "Never run"

**Solutions:**
1. Check schedule format (must be valid cron expression)
2. Verify render.yaml is committed to repo
3. Try manual trigger first to test job works
4. Check timezone - UTC vs local time

### Email Not Sending

**Error:** `Net::SMTPAuthenticationError`

**Solutions:**
1. Verify SENDGRID_API_KEY is correct
2. Check API key has "Full Access" permissions
3. Try creating new API key
4. Check SendGrid account is verified

### Sentry Not Capturing Errors

**Error:** No errors appear in Sentry

**Solutions:**
1. Verify SENTRY_DSN is set correctly
2. Check Sentry gems are installed (`bundle list | grep sentry`)
3. Trigger manual test error (see Step 5.3)
4. Check Sentry project is active

---

## Rollback Plan

If something breaks after implementation:

### Emergency Rollback Steps

1. [ ] **Remove Redis Config:**
   ```bash
   # Revert cable.yml to async
   git revert HEAD~3  # Adjust number based on commits
   git push origin main
   ```

2. [ ] **Stop Sidekiq Worker:**
   - Go to Render → Sidekiq worker
   - Click "Suspend"

3. [ ] **Disable Cron Job:**
   - Go to Render → Cron job
   - Click "Suspend"

4. [ ] **Remove Email Config:**
   ```ruby
   # In production.rb, comment out SMTP settings
   git commit -m "Temporarily disable email"
   git push origin main
   ```

5. [ ] **Your app should work again** (without new features)

---

## Success Metrics

After implementation, you should see:

### Redis Metrics (Render Dashboard)
- Memory usage: < 5 MB initially
- Connections: 2-5 active connections
- Commands: Increasing over time

### Sidekiq Metrics (Sidekiq Dashboard)
- Processed: Growing number
- Failed: Low number (< 5%)
- Queues: Should drain quickly (< 1 minute)
- Busy workers: 0-2 usually

### Cron Job Metrics (Render Dashboard)
- Last Run: Shows timestamp of last execution
- Next Run: Shows when it will run again
- Duration: < 1 minute usually
- Status: "Success" (green check)

### Email Metrics (SendGrid Dashboard)
- Delivered: > 95%
- Bounces: < 2%
- Spam reports: < 0.1%

---

## Next Steps After Implementation

Once all infrastructure is set up:

1. [ ] **Monitor for 1 week** - Watch for issues
2. [ ] **Create subscription test user** - Full end-to-end test
3. [ ] **Document any issues** - Update this guide
4. [ ] **Plan frontend development** - Start building UI
5. [ ] **Test with real users** - Beta testing

---

## Support Resources

If you get stuck:

- **Render Docs:** https://render.com/docs
- **Sidekiq Docs:** https://github.com/mperham/sidekiq/wiki
- **SendGrid Docs:** https://docs.sendgrid.com/
- **Sentry Docs:** https://docs.sentry.io/platforms/ruby/guides/rails/
- **Redis Docs:** https://redis.io/documentation

**Your generated docs:**
- `INFRASTRUCTURE_SERVICES_GUIDE.md` - Why you need each service
- `SESSION_SUMMARY_FEB_20_2026.md` - What was built today
- `CURRENT_STATUS.md` - Current app status

---

**Ready to implement?** Start with Phase 1 (Redis) and work through each phase in order. Good luck! 🚀
