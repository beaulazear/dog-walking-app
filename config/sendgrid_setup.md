# SendGrid Email Configuration

## Setup Instructions

### 1. Get SendGrid API Key

1. Go to https://app.sendgrid.com/
2. Navigate to Settings > API Keys
3. Create a new API key with "Full Access" permission
4. Copy the API key (you'll only see it once!)

### 2. Add to Rails Credentials

```bash
# Edit credentials
EDITOR="code --wait" bin/rails credentials:edit

# Add this to the file:
sendgrid:
  api_key: YOUR_SENDGRID_API_KEY_HERE
  from_email: beau@scoopersnyc.com
  from_name: Scoopers NYC Moderation Team
```

### 3. Configure Action Mailer

In `config/environments/production.rb`:

```ruby
config.action_mailer.delivery_method = :smtp
config.action_mailer.smtp_settings = {
  address: 'smtp.sendgrid.net',
  port: 587,
  domain: 'scoopersnyc.com',
  user_name: 'apikey',
  password: Rails.application.credentials.dig(:sendgrid, :api_key),
  authentication: 'plain',
  enable_starttls_auto: true
}

config.action_mailer.default_url_options = { host: 'yourdomain.com' }
```

### 4. Email Notifications (TODO)

Create these mailers:

1. **ReportMailer** - Notify admin of new reports
   - `new_report_notification(report)` - Sent when report is created
   - Subject: "🚨 New Content Report #123 - 24hr Response Required"
   - To: beau@scoopersnyc.com

2. **UserModerationMailer** - Notify users of moderation actions
   - `warning_email(user)` - User warned (shows count 1/3, 2/3, 3/3)
   - `suspension_email(user)` - User suspended (duration + reason)
   - `ban_email(user)` - User banned (reason + appeal process)

### 5. Test Email Delivery

```bash
# In Rails console
rails c

# Test email
ActionMailer::Base.mail(
  from: 'beau@scoopersnyc.com',
  to: 'beau@scoopersnyc.com',
  subject: 'Test Email',
  body: 'This is a test'
).deliver_now
```

## Implementation Notes

The email notification calls are currently commented out in the codebase:

- `app/models/report.rb:191` - `notify_admin_of_new_report` callback
- `app/models/user.rb:330` - Warning email
- `app/models/user.rb:350` - Suspension email
- `app/models/user.rb:370` - Ban email

Uncomment these after setting up SendGrid and creating the mailer classes.
