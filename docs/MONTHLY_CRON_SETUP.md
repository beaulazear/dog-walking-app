# Monthly Cron Job Setup

## Rake Tasks Available

Three rake tasks are available for monthly sponsorship maintenance:

### 1. Reset Monthly Pickup Counters
```bash
rails sponsorships:reset_monthly_stats
```
Resets `pickups_this_month` to 0 for all active sponsorships and blocks.
**Run on:** 1st of each month at 12:01 AM

### 2. Send Monthly Rating Reminders
```bash
rails sponsorships:send_rating_reminders
```
Sends push notifications to sponsors who haven't rated their dog walker for the previous month.
**Run on:** 1st of each month at 9:00 AM

### 3. Update Scooper Overall Ratings
```bash
rails sponsorships:update_scooper_ratings
```
Recalculates overall ratings for all scoopers based on job and sponsorship ratings.
**Run on:** 1st of each month at 12:05 AM

## Cron Schedule (for production)

Add to your crontab or use a scheduler like Heroku Scheduler or Render Cron Jobs:

```cron
# Reset monthly stats (12:01 AM on 1st of month)
1 0 1 * * cd /path/to/app && RAILS_ENV=production bundle exec rails sponsorships:reset_monthly_stats

# Update scooper ratings (12:05 AM on 1st of month)
5 0 1 * * cd /path/to/app && RAILS_ENV=production bundle exec rails sponsorships:update_scooper_ratings

# Send rating reminders (9:00 AM on 1st of month)
0 9 1 * * cd /path/to/app && RAILS_ENV=production bundle exec rails sponsorships:send_rating_reminders
```

## Render Setup

If deploying on Render, add these as Cron Jobs:

1. **Monthly Stats Reset**
   - Command: `bundle exec rails sponsorships:reset_monthly_stats`
   - Schedule: `0 0 1 * *` (12:01 AM on 1st)

2. **Scooper Ratings Update**
   - Command: `bundle exec rails sponsorships:update_scooper_ratings`
   - Schedule: `5 0 1 * *` (12:05 AM on 1st)

3. **Rating Reminders**
   - Command: `bundle exec rails sponsorships:send_rating_reminders`
   - Schedule: `0 9 1 * *` (9:00 AM on 1st)

## Manual Testing

Test these commands locally before setting up cron:

```bash
# Run in development
rails sponsorships:reset_monthly_stats
rails sponsorships:update_scooper_ratings
rails sponsorships:send_rating_reminders
```

## What Each Task Does

### reset_monthly_stats
- Sets `Sponsorship.pickups_this_month = 0` for all active sponsorships
- Sets `Block.this_week_pickups = 0` and `current_month_pickups = 0`
- Ensures fresh monthly counters for stats tracking

### send_rating_reminders
- Finds sponsorships that haven't been rated for the previous month
- Sends push notification: "How's your block looking? Rate [Walker Name]'s service this month."
- TODO: Implement push notification service integration

### update_scooper_ratings
- Recalculates `User.overall_rating` for all scoopers
- Averages job ratings and sponsorship ratings
- Updates profile ratings displayed on map
