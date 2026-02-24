# Sighting Expiration Cron Job Setup

## Overview

The `SightingExpirationJob` runs every 15 minutes to expire old sightings (older than 48-72 hours).

## Production Setup

### Option 1: Crontab (Simple)

Add this to your crontab:

```bash
# Open crontab
crontab -e

# Add this line (runs every 15 minutes)
*/15 * * * * cd /path/to/dog-walking-app && RAILS_ENV=production bin/rails sightings:expire >> log/cron.log 2>&1
```

Replace `/path/to/dog-walking-app` with your actual app path.

### Option 2: Heroku Scheduler

If deploying to Heroku:

1. Add the Heroku Scheduler add-on:
   ```bash
   heroku addons:create scheduler:standard
   ```

2. Open scheduler dashboard:
   ```bash
   heroku addons:open scheduler
   ```

3. Add a new job with frequency "Every 10 minutes":
   ```bash
   bin/rails sightings:expire
   ```

### Option 3: Render Cron Jobs

If deploying to Render:

Add to `render.yaml`:

```yaml
- type: cron
  name: sighting-expiration
  env: ruby
  schedule: "*/15 * * * *"
  buildCommand: bundle install
  startCommand: bin/rails sightings:expire
```

### Option 4: Sidekiq (Advanced)

If using Sidekiq for background jobs:

1. Install sidekiq-cron gem
2. Configure in `config/initializers/sidekiq.rb`:

```ruby
Sidekiq::Cron::Job.create(
  name: 'Expire Sightings',
  cron: '*/15 * * * *',
  class: 'SightingExpirationJob'
)
```

## Manual Testing

Run the job manually:

```bash
# Development
bin/rails sightings:expire

# Production
RAILS_ENV=production bin/rails sightings:expire
```

## Monitoring

Check logs:

```bash
# Development
tail -f log/development.log | grep "Expired"

# Production
tail -f log/production.log | grep "Expired"
```

Expected output:
```
⏰ Expired 3 sightings at 2026-02-23 16:45:00 -0500
```

## Troubleshooting

**Job not running:**
- Verify cron is running: `service cron status`
- Check cron logs: `grep CRON /var/log/syslog`
- Verify paths are correct in crontab

**No sightings expiring:**
- Check if sightings exist: `Sighting.active.count`
- Check expiration times: `Sighting.active.where('expires_at <= ?', Time.current).count`
- Run job manually to test: `SightingExpirationJob.perform_now`
