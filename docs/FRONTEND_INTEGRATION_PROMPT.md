# Frontend Integration Prompt - Scoop MVP Job Board

**Backend Status:** ✅ Complete and Ready
**Last Updated:** February 19, 2026

---

## Executive Summary

The Scoop backend has been fully updated to support the MVP "job board on a map" model. This document contains everything you need to update the React Native frontend to work with the new backend architecture.

---

## 🎯 Core Concept Change

**OLD MODEL:** Pledge/subscription system with monthly recurring payments
**NEW MODEL:** On-demand job board where posters create one-time cleanup jobs and scoopers claim them

---

## 📋 Required Frontend Changes

### 1. Job Creation Form (Poster View)

When a poster creates a cleanup job, they must provide:

#### **Required Fields:**
```javascript
{
  latitude: 40.758,           // Current location or map pin
  longitude: -73.9855,
  address: "Times Square, NY", // Reverse geocoded or user input
  price: 15.00,               // User sets price
  note: "Optional notes",     // Optional

  // NEW MVP FIELDS:
  job_type: "poop",           // Required: "poop", "litter", or "both"

  // Conditional on job_type:
  poop_itemization: "4-8",    // Required if job_type is "poop" or "both"
                              // Options: "1-3", "4-8", "9+"

  litter_itemization: "moderate", // Required if job_type is "litter" or "both"
                                  // Options: "light", "moderate", "heavy"

  segments_selected: ["north", "east"] // Required: array of 1-4 segments
                                       // Options: "north", "south", "east", "west"
}
```

#### **UI Components Needed:**

1. **Job Type Selector** (Required)
   ```
   [ 🐕💩 Poop ]  [ 🗑️ Litter ]  [ 🐕💩 + 🗑️ Both ]
   ```

2. **Poop Itemization Selector** (Show when job_type is "poop" or "both")
   ```
   How much dog waste?
   [ 1-3 piles ]  [ 4-8 piles ]  [ 9+ piles ]
   ```

3. **Litter Itemization Selector** (Show when job_type is "litter" or "both")
   ```
   How much litter/trash?
   [ Light ]  [ Moderate ]  [ Heavy ]
   ```

4. **Block Segment Selector** (Required - multi-select)
   ```
   Which parts of the block?
   ☑️ North side    ☐ South side
   ☐ East side      ☑️ West side

   (At least one must be selected)
   ```

5. **Price Input** (Required)
   ```
   How much will you pay?
   $ [15.00]

   Suggested: $12-$25 based on job size
   ```

#### **API Endpoint:**
```javascript
POST /cleanup_jobs
Headers: { Authorization: "Bearer <token>" }
Body: {
  latitude: 40.758,
  longitude: -73.9855,
  address: "Times Square, NY",
  price: 15.00,
  note: "Please clean carefully",
  job_type: "poop",
  poop_itemization: "4-8",
  segments_selected: ["north", "east"]
}

Response: {
  job: {
    id: 1,
    status: "open",
    job_type: "poop",
    poop_itemization: "4-8",
    segments_selected: ["north", "east"],
    // ... all other fields
  }
}
```

---

### 2. Job Board/Map View (Scooper View)

Display all available jobs on a map with filtering:

#### **Fetch Jobs API:**
```javascript
GET /cleanup_jobs?latitude=40.758&longitude=-73.9855&radius=0.5&job_type=poop&sort=highest_pay

Response: {
  jobs: [
    {
      id: 1,
      latitude: 40.758,
      longitude: -73.9855,
      address: "Times Square, NY",
      price: 15.00,
      job_type: "poop",
      poop_itemization: "4-8",
      litter_itemization: null,
      segments_selected: ["north", "east"],
      status: "open",
      poster_name: "John Doe",
      poster_id: 5,
      created_at: "2026-02-19T10:30:00Z",
      before_photos: ["https://..."],
      after_photos: []
    }
  ],
  pagination: {
    current_page: 1,
    per_page: 50,
    total_count: 25,
    total_pages: 1
  }
}
```

#### **Filter Options:**

1. **Job Type Filter**
   ```
   Show: [ All ] [ 🐕💩 Poop ] [ 🗑️ Litter ] [ 🐕💩 + 🗑️ Both ]
   Query param: ?job_type=poop
   ```

2. **Distance Filter**
   ```
   Within: [ 0.5 mi ] [ 1 mi ] [ 2 mi ] [ 5 mi ]
   Query params: ?latitude=40.758&longitude=-73.9855&radius=0.5
   ```

3. **Just Posted Filter**
   ```
   [ ⚡ Just Posted (last hour) ]
   Query param: ?just_posted=true
   ```

4. **Sort Options**
   ```
   Sort by: [ 💰 Highest Pay ] [ 🆕 Newest ]
   Query param: ?sort=highest_pay  or  ?sort=newest
   ```

#### **Map Pin Design:**

Display different colored pins based on job type:
- 🐕💩 Poop only: Brown pin
- 🗑️ Litter only: Gray pin
- 🐕💩 + 🗑️ Both: Orange pin

Show price in pin badge: "$15"

#### **Job Detail Card:**

When user taps a pin or list item:
```
┌──────────────────────────────────┐
│ Times Square, NY            $15  │
│                                  │
│ 🐕💩 Dog Waste Cleanup           │
│ Amount: 4-8 piles                │
│ Area: North & East sides         │
│                                  │
│ Posted by: John Doe              │
│ Posted: 5 minutes ago            │
│                                  │
│ [View Photos] [Claim Job]        │
└──────────────────────────────────┘
```

For "both" type jobs:
```
┌──────────────────────────────────┐
│ West Village, NY            $18  │
│                                  │
│ 🐕💩 + 🗑️ Dog Waste + Litter     │
│ Dog waste: 1-3 piles             │
│ Litter level: Light              │
│ Area: South side                 │
│                                  │
│ [View Photos] [Claim Job]        │
└──────────────────────────────────┘
```

---

### 3. Job Lifecycle & Status Updates

#### **Job Statuses:**
```
open → claimed → in_progress → completed → confirmed
              ↘ cancelled
                          ↘ disputed
                          ↘ expired
```

#### **Status Flow:**

1. **Open** → Scooper can claim
   ```javascript
   POST /cleanup_jobs/:id/claim
   Response: { job: { status: "claimed", claimed_at: "...", scooper_id: 2 } }
   ```

2. **Claimed** → Scooper has 60 minutes to arrive
   - Show countdown timer: "Arrive within: 54:32"
   - If timer expires, job auto-releases back to "open"

   ```javascript
   POST /cleanup_jobs/:id/start
   Response: { job: { status: "in_progress", scooper_arrived_at: "..." } }
   ```

3. **In Progress** → Scooper is on-site
   - Show "Upload After Photos" button
   - Enable real-time location sharing

   ```javascript
   POST /cleanup_jobs/:id/complete
   Body: { pickup_count: 6 }  // Optional
   Response: { job: { status: "completed", completed_at: "..." } }
   ```

4. **Completed** → Poster has 2 hours to confirm
   - Poster sees: "Review and Confirm" or "Report Issue"
   - Show countdown: "Auto-confirms in: 1:45:12"

   ```javascript
   // Poster confirms:
   POST /cleanup_jobs/:id/confirm
   Response: { job: { status: "confirmed", confirmed_at: "..." } }

   // Or disputes:
   POST /cleanup_jobs/:id/dispute
   Body: { dispute_reason: "incomplete", dispute_notes: "..." }
   Response: { job: { status: "disputed" } }
   ```

5. **Confirmed** → Job complete, payment processed
   - Show success message
   - Rate the other user

#### **Cancel Flow:**

**Poster can cancel if:**
- Status is "open" (before claimed) - No fee
- Status is "claimed" (after claimed) - 20% cancellation fee

**Scooper can cancel if:**
- Status is "claimed" (before arrival) - No fee, reputation penalty

```javascript
POST /cleanup_jobs/:id/cancel
Body: { cancellation_reason: "Can't make it" }

Response: {
  job: { status: "cancelled", cancelled_at: "...", scooper_id: null },
  cancellation_fee: 3.00,  // 20% of $15 if poster cancels after claim
  message: "Job cancelled. A 20% cancellation fee of $3.00 will be charged."
}
```

**UI Alert:**
```
⚠️ Cancellation Fee Warning

This job has been claimed by a scooper.
Canceling now will charge a 20% fee ($3.00).

Are you sure you want to cancel?

[Go Back]  [Cancel Job]
```

---

### 4. Real-Time Updates (WebSocket)

#### **Setup Action Cable:**

```javascript
import ActionCable from '@react-native-community/actioncable';

// Create connection with JWT token
const cable = ActionCable.createConsumer(
  `wss://your-api.com/cable?token=${userToken}`
);
```

#### **Subscribe to Job Board Updates:**

All scoopers see new jobs instantly:

```javascript
const boardSubscription = cable.subscriptions.create('JobBoardChannel', {
  received(data) {
    console.log('Job board update:', data);
    // data.type: "job_created" or "job_available"
    // data.job: full job object
    // data.timestamp: ISO timestamp

    if (data.type === 'job_created') {
      // Add new pin to map
      addJobToMap(data.job);

      // Show toast notification
      showToast(`New job: ${data.job.address} - $${data.job.price}`);
    }
  }
});
```

#### **Subscribe to Specific Job Updates:**

For poster and scooper on the same job:

```javascript
const jobSubscription = cable.subscriptions.create(
  { channel: 'CleanupJobChannel', job_id: currentJob.id },
  {
    received(data) {
      console.log('Job update:', data);
      // data.type: "job_claimed", "job_started", "job_completed", etc.
      // data.job: updated job object

      if (data.type === 'job_claimed') {
        // Update UI to show scooper info
        updateJobCard(data.job);
        showNotification('Job claimed!', `${data.job.scooper_name} is on the way`);
      }

      if (data.type === 'location_update') {
        // Update scooper's pin on map (poster view)
        updateScooperLocation(data.latitude, data.longitude);
      }
    }
  }
);

// Scooper sends location updates while en route
function sendLocationUpdate(lat, lng) {
  jobSubscription.perform('update_location', {
    latitude: lat,
    longitude: lng
  });
}
```

#### **Real-Time Events:**

Listen for these event types:
- `job_created` - New job posted (job board)
- `job_claimed` - Scooper claimed job
- `job_started` - Scooper arrived
- `job_completed` - Scooper finished
- `job_confirmed` - Poster confirmed
- `job_disputed` - Poster reported issue
- `job_cancelled` - Job was cancelled
- `location_update` - Scooper's real-time location

---

### 5. Push Notifications

#### **Register Device Token:**

On app startup:

```javascript
import * as Notifications from 'expo-notifications';

async function registerForPushNotifications() {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return;

  const token = (await Notifications.getExpoPushTokenAsync()).data;
  const platform = Platform.OS; // "ios" or "android"

  // Register with backend
  await fetch('https://your-api.com/users/register_device', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${userToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      device_token: token,
      device_platform: platform
    })
  });
}
```

#### **Notification Types:**

Users will receive push notifications for:
- 🎉 Job claimed
- 🚶 Scooper arrived
- ✅ Job completed (needs confirmation)
- 💰 Job confirmed (payment processing)
- ⚠️ Job disputed
- ⏰ Job auto-released (scooper didn't arrive)
- ⏰ Job auto-confirmed (poster didn't respond)
- ❌ Job expired (unclaimed)

**Example notification payload:**
```json
{
  "title": "Job Claimed",
  "body": "Jane Smith has claimed your cleanup job at Times Square!",
  "data": {
    "type": "job_claimed",
    "job_id": 1
  }
}
```

**Handle notification tap:**
```javascript
Notifications.addNotificationResponseReceivedListener(response => {
  const { type, job_id } = response.notification.request.content.data;

  if (type === 'job_claimed') {
    navigation.navigate('JobDetail', { id: job_id });
  }
});
```

---

### 6. Photo Upload

#### **Before Photos (Poster):**

```javascript
POST /cleanup_jobs/:id/upload_before_photo
Content-Type: multipart/form-data

FormData: {
  before_photo: {
    uri: 'file:///...',
    type: 'image/jpeg',
    name: 'before.jpg'
  }
}

Response: {
  job: {
    before_photos: ["https://s3.../before.jpg"]
  }
}
```

#### **After Photos (Scooper):**

```javascript
POST /cleanup_jobs/:id/upload_after_photo
Content-Type: multipart/form-data

FormData: {
  after_photo: {
    uri: 'file:///...',
    type: 'image/jpeg',
    name: 'after.jpg'
  }
}

Response: {
  job: {
    after_photos: ["https://s3.../after1.jpg", "https://s3.../after2.jpg"]
  }
}
```

**UI:**
- Before photos: Optional, uploaded by poster before/after job creation
- After photos: Uploaded by scooper when marking job complete
- Both support multiple photos
- Display in before/after comparison view

---

### 7. My Jobs Views

#### **My Posted Jobs (Poster):**

```javascript
GET /cleanup_jobs/my_posted

Response: {
  jobs: [
    { id: 1, status: "in_progress", scooper_name: "Jane", ... },
    { id: 2, status: "completed", scooper_name: "Bob", ... },
    { id: 3, status: "open", scooper_id: null, ... }
  ]
}
```

**Group by status:**
- 🟢 Active (open, claimed, in_progress)
- ⏳ Needs Action (completed - awaiting confirmation)
- ✅ Completed (confirmed)
- ⚠️ Issues (disputed)
- 📁 Other (cancelled, expired)

#### **My Claimed Jobs (Scooper):**

```javascript
GET /cleanup_jobs/my_claimed

Response: {
  jobs: [
    { id: 5, status: "claimed", poster_name: "Alice", ... },
    { id: 6, status: "in_progress", poster_name: "Carol", ... }
  ]
}
```

---

### 8. Validation & Error Handling

#### **Frontend Validation:**

Before submitting job creation:
```javascript
function validateJobForm(formData) {
  const errors = [];

  // Job type is required
  if (!formData.job_type) {
    errors.push('Please select a job type');
  }

  // Poop itemization required for poop/both jobs
  if (['poop', 'both'].includes(formData.job_type) && !formData.poop_itemization) {
    errors.push('Please specify dog waste amount');
  }

  // Litter itemization required for litter/both jobs
  if (['litter', 'both'].includes(formData.job_type) && !formData.litter_itemization) {
    errors.push('Please specify litter level');
  }

  // At least one segment must be selected
  if (!formData.segments_selected || formData.segments_selected.length === 0) {
    errors.push('Please select at least one block segment');
  }

  // Price must be positive
  if (!formData.price || formData.price <= 0) {
    errors.push('Please enter a valid price');
  }

  return errors;
}
```

#### **Backend Error Responses:**

```javascript
// 422 Unprocessable Entity
{
  error: "Validation failed: Poop itemization is not included in the list"
}

// 403 Forbidden
{
  error: "Only the assigned scooper can start this job"
}

// 404 Not Found
{
  error: "Job not found"
}
```

---

## 🗂️ Data Models Reference

### Job Type Enums
```javascript
const JOB_TYPES = ['poop', 'litter', 'both'];
const POOP_ITEMIZATIONS = ['1-3', '4-8', '9+'];
const LITTER_ITEMIZATIONS = ['light', 'moderate', 'heavy'];
const SEGMENTS = ['north', 'south', 'east', 'west'];
const STATUSES = ['open', 'claimed', 'in_progress', 'completed', 'confirmed', 'disputed', 'expired', 'cancelled'];
```

### Full Job Object Structure
```typescript
interface CleanupJob {
  // Core fields
  id: number;
  poster_id: number;
  poster_name: string;
  scooper_id: number | null;
  scooper_name: string | null;

  // Location
  latitude: number;
  longitude: number;
  address: string;

  // Job details
  price: number;
  note: string;
  status: 'open' | 'claimed' | 'in_progress' | 'completed' | 'confirmed' | 'disputed' | 'expired' | 'cancelled';
  pickup_count: number | null;

  // MVP fields
  job_type: 'poop' | 'litter' | 'both';
  poop_itemization: '1-3' | '4-8' | '9+' | null;
  litter_itemization: 'light' | 'moderate' | 'heavy' | null;
  segments_selected: ('north' | 'south' | 'east' | 'west')[];

  // Cancellation
  cancelled_by_id: number | null;
  cancelled_at: string | null;
  cancellation_fee_amount: number | null;
  cancellation_reason: string | null;

  // Timestamps
  claimed_at: string | null;
  completed_at: string | null;
  confirmed_at: string | null;
  created_at: string;
  updated_at: string;

  // Photos
  before_photos: string[];  // Array of S3 URLs
  after_photos: string[];   // Array of S3 URLs
}
```

---

## 📚 Testing the Backend

Use the provided test data:

```bash
# Create 25 realistic test jobs
rails test_data:populate_jobs

# Clear test jobs
rails test_data:clear_test_jobs
```

This creates jobs with:
- ✅ Full NYC addresses and coordinates
- ✅ All job types (poop, litter, both)
- ✅ All itemization levels
- ✅ Various segment combinations
- ✅ Price range $12-$25

---

## ✅ Implementation Checklist

### Phase 1: Job Creation
- [ ] Add job type selector (poop/litter/both)
- [ ] Add conditional poop itemization picker
- [ ] Add conditional litter itemization picker
- [ ] Add multi-select segment picker
- [ ] Update form validation
- [ ] Test job creation API

### Phase 2: Job Board
- [ ] Fetch and display jobs on map
- [ ] Add job type filter
- [ ] Add distance filter
- [ ] Add "just posted" filter
- [ ] Add sort options (highest pay, newest)
- [ ] Style map pins by job type
- [ ] Create job detail card with all MVP fields

### Phase 3: Job Lifecycle
- [ ] Implement claim action
- [ ] Add 60-minute arrival countdown
- [ ] Implement start/arrive action
- [ ] Add complete job flow
- [ ] Implement confirm/dispute for posters
- [ ] Add cancellation with fee warning
- [ ] Test all status transitions

### Phase 4: Real-Time Features
- [ ] Set up Action Cable connection
- [ ] Subscribe to job board channel
- [ ] Subscribe to specific job channel
- [ ] Handle all real-time event types
- [ ] Implement scooper location sharing
- [ ] Test WebSocket reconnection

### Phase 5: Notifications
- [ ] Register device token on startup
- [ ] Handle notification permissions
- [ ] Test notification tap navigation
- [ ] Display in-app notification badges

### Phase 6: Photos
- [ ] Add before photo upload (poster)
- [ ] Add after photo upload (scooper)
- [ ] Create before/after comparison view
- [ ] Test multiple photo uploads

### Phase 7: Polish
- [ ] Add loading states
- [ ] Add error handling
- [ ] Add offline support
- [ ] Test on iOS and Android
- [ ] Add accessibility labels

---

## 🚀 Ready to Start?

1. Read `docs/SCOOP_MVP_TESTING_GUIDE.md` for backend testing instructions
2. Check `docs/SCOOP_BACKEND_SUMMARY.md` for complete API documentation
3. Run `rails test_data:populate_jobs` to get test data
4. Start building! 🎉

**Questions?** The backend is fully documented and tested. All endpoints are working and ready for integration.
