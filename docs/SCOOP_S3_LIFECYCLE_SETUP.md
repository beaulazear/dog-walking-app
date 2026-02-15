# Scoop S3 Lifecycle Policy Setup

This document explains how to configure S3 lifecycle policies to automatically delete Scoop photos after 7-14 days.

## Overview

Scoop uses Active Storage with Amazon S3 for photo uploads. Photos are attached to:
- **Cleanups** - GPS-verified cleanup photos
- **Poop Reports** - Resident-submitted poop location photos

For privacy and storage efficiency, these photos should automatically delete after 7-14 days.

## S3 Configuration

The app is already configured to use S3 in production (see `config/storage.yml`):

```yaml
amazon:
  service: S3
  access_key_id: <%= Rails.application.credentials.dig(:aws, :access_key_id) %>
  secret_access_key: <%= Rails.application.credentials.dig(:aws, :secret_access_key) %>
  region: us-east-2
  bucket: beaubucketone
```

## Setting Up Lifecycle Policy in AWS Console

### Step 1: Navigate to S3 Bucket

1. Log in to AWS Console
2. Go to **S3** service
3. Click on bucket: `beaubucketone`

### Step 2: Create Lifecycle Rule

1. Click on **Management** tab
2. Click **Create lifecycle rule**

### Step 3: Configure Rule

**Rule Name:** `scoop-photos-auto-delete`

**Rule Scope:**
- Choose "Limit the scope of this rule using one or more filters"
- **Prefix:** `scoop-photos/` (or whatever prefix Active Storage uses)
  - Note: Check your Active Storage configuration for actual prefix pattern
  - Active Storage typically uses pattern: `variants/` or custom prefixes

**Lifecycle rule actions:**
- ✅ Check "Expire current versions of objects"
- Set: **14 days after object creation**

Optionally:
- ✅ Check "Delete expired object delete markers or incomplete multipart uploads"

### Step 4: Review and Create

1. Review the rule configuration
2. Click **Create rule**

## Alternative: Tag-Based Lifecycle Policy

If you want more granular control, you can tag photos on upload and create a tag-based lifecycle policy:

### In Rails Code (Optional Enhancement)

```ruby
# In Cleanup or PoopReport model
def attach_photo_with_tags!(photo_file)
  self.photo.attach(photo_file)
  self.photo.blob.update(
    metadata: self.photo.blob.metadata.merge(tags: { auto_delete: 'true', type: 'scoop_photo' })
  )
  update!(has_photo: true)
end
```

### In AWS Console

Create lifecycle rule with tag filter:
- **Tag Key:** `type`
- **Tag Value:** `scoop_photo`
- **Action:** Expire after 14 days

## Verification

After creating the rule:

1. Upload a test photo through the app
2. Check S3 bucket after rule propagation (up to 24 hours)
3. Verify the expiration date is set on the object:
   - In S3 Console, click on the object
   - Check **Properties** tab
   - Look for "Expiration date"

## Current Implementation

The models already have placeholder methods for photo deletion:

**Cleanup Model** (`app/models/cleanup.rb:117-120`):
```ruby
def schedule_photo_deletion
  # Photos are automatically deleted after 14 days via S3 lifecycle policy
  # This is just a marker - actual deletion happens on S3
end
```

**PoopReport Model** (`app/models/poop_report.rb:47-49`):
```ruby
def schedule_photo_deletion
  # Photos are automatically deleted after 14 days via S3 lifecycle policy
end
```

These callbacks run after record creation but don't perform any action - the actual deletion is handled by S3 lifecycle policies.

## Database Cleanup (Optional)

The `has_photo` boolean flag in the database will remain `true` even after S3 deletes the file. If you want to clean up these references:

### Option 1: Rake Task (Run Monthly)

```ruby
# lib/tasks/scoop.rake
namespace :scoop do
  desc "Clean up photo references for expired photos"
  task cleanup_expired_photos: :environment do
    # Cleanups older than 14 days with has_photo=true
    Cleanup.where("cleanup_date < ? AND has_photo = ?", 14.days.ago, true).find_each do |cleanup|
      cleanup.update(has_photo: false) unless cleanup.photo.attached?
    end

    # Poop reports older than 14 days with has_photo=true
    PoopReport.where("reported_at < ? AND has_photo = ?", 14.days.ago, true).find_each do |report|
      report.update(has_photo: false) unless report.photo.attached?
    end
  end
end
```

### Option 2: Background Job (Run Daily)

Use Sidekiq/DelayedJob to check and update photo flags automatically.

## Cost Considerations

- S3 lifecycle policies are free to use
- You only pay for storage until deletion occurs
- Early deletion (7 days) saves more money but provides less evidence
- 14 days is recommended balance between cost and utility

## Privacy & Legal

- Auto-deletion supports privacy compliance (GDPR, CCPA)
- Cleanup photos are ephemeral proof of work
- 7-14 day retention is sufficient for dispute resolution
- Consider your terms of service and privacy policy

## Testing

To test lifecycle policies without waiting 14 days:

1. Create a separate test bucket
2. Set lifecycle policy to expire after 1 day
3. Upload test photo
4. Verify deletion after 24-48 hours

## Notes

- S3 lifecycle deletion is eventual (may take 24-48 hours after expiration date)
- Once deleted, photos cannot be recovered
- Consider creating a separate bucket for Scoop photos if you want different retention policies
- Active Storage automatically handles missing files gracefully (returns nil for `photo.attached?`)
