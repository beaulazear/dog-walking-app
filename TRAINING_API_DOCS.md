# Dog Training Certification Tracker API Documentation

## Base URL
```
http://localhost:3000  # Development
```

## Authentication
All endpoints require authentication using the existing session-based auth system. User must be logged in via `/login` endpoint.

```javascript
// Login first
POST /login
{
  "username": "your_username",
  "password": "your_password"
}
```

---

## 📊 Training Sessions

### List All Training Sessions
```http
GET /training_sessions
```

**Response:**
```json
[
  {
    "id": 1,
    "user_id": 1,
    "pet_id": 5,
    "session_date": "2025-11-06T10:00:00.000Z",
    "duration_minutes": 60,
    "session_type": "solo_walk",
    "notes": "Worked on loose leash walking",
    "training_focus": ["leash_manners", "recall"],
    "created_at": "2025-11-06T10:30:00.000Z",
    "updated_at": "2025-11-06T10:30:00.000Z",
    "pet": {
      "id": 5,
      "name": "Moose"
    }
  }
]
```

---

### Get Training Summary
```http
GET /training_sessions/summary
```

**Response:**
```json
{
  "total_hours": 47.5,
  "total_sessions": 95,
  "hours_remaining": 252.5,
  "progress_percentage": 15.8,
  "current_streak": 12,
  "longest_streak": 14
}
```

---

### Get This Week's Training
```http
GET /training_sessions/this_week
```

**Response:**
```json
{
  "sessions": [...],
  "total_hours": 8.5,
  "goal_hours": 12,
  "progress_percentage": 70.8
}
```

---

### Get This Month's Training
```http
GET /training_sessions/this_month
```

**Response:**
```json
{
  "sessions": [...],
  "total_hours": 32.5,
  "session_count": 65
}
```

---

### Create Training Session
```http
POST /training_sessions
```

**Request Body:**
```json
{
  "training_session": {
    "pet_id": 5,
    "session_date": "2025-11-06T10:00:00Z",
    "duration_minutes": 60,
    "session_type": "solo_walk",
    "notes": "Great progress on recall training",
    "training_focus": ["recall", "socialization"]
  }
}
```

**Valid Session Types:**
- `"solo_walk"`
- `"pack_walk"`
- `"group_class"`
- `"private_lesson"`
- `"shelter_volunteer"`
- `"other"`

**Valid Training Focus Areas:**
- `"leash_manners"`
- `"recall"`
- `"reactivity"`
- `"socialization"`
- `"basic_obedience"`
- `"advanced_obedience"`
- (Any custom string is accepted)

**Response:**
```json
{
  "session": {
    "id": 123,
    "session_date": "2025-11-06T10:00:00Z",
    "duration_minutes": 60,
    "session_type": "solo_walk",
    "notes": "Great progress on recall training",
    "training_focus": ["recall", "socialization"],
    "pet": {
      "id": 5,
      "name": "Moose"
    }
  },
  "new_milestone": {
    "id": 5,
    "hours_reached": 50,
    "achieved_at": "2025-11-06T11:00:00Z",
    "celebrated": false,
    "celebration_message": "🎯 You're 1/6th there! Most people quit before this."
  }
}
```

**Note:** `new_milestone` will be `null` if no milestone was reached.

---

### Update Training Session
```http
PATCH /training_sessions/:id
```

**Request Body:** Same as Create

**Response:**
```json
{
  "id": 123,
  "session_date": "2025-11-06T10:00:00Z",
  "duration_minutes": 75,
  // ... updated fields
}
```

---

### Delete Training Session
```http
DELETE /training_sessions/:id
```

**Response:** 204 No Content

---

### Export Training Hours (CSV)
```http
GET /training_sessions/export
```

**Response:** CSV file download
```csv
Date,Duration (hours),Session Type,Dog Name,Training Focus
2025-11-06,1.0,Solo Walk,Moose,"recall, socialization"
2025-11-05,0.5,Pack Walk,Multiple,"leash_manners"

Total Hours,47.5
```

---

### Sync Invoices to Training Sessions
```http
POST /training_sessions/sync_from_invoices
```

Automatically converts all existing invoices with "training" in the title to training sessions.

**Response:**
```json
{
  "synced_count": 15,
  "sessions": [
    // Array of created training sessions
  ],
  "errors": [],
  "new_milestones": [
    // Array of any new milestones achieved
  ]
}
```

---

## 🎯 Certification Goals

### Get Certification Goal
```http
GET /certification_goal
```

**Response:**
```json
{
  "goal": {
    "id": 1,
    "user_id": 1,
    "certification_type": "CPDT-KA",
    "target_hours": 300,
    "weekly_goal_hours": 12,
    "target_completion_date": "2026-06-01",
    "created_at": "2025-11-01T10:00:00Z",
    "updated_at": "2025-11-01T10:00:00Z"
  },
  "hours_per_week_needed": 8.5,
  "projected_completion": "2026-03-15"
}
```

---

### Create Certification Goal
```http
POST /certification_goal
```

**Request Body:**
```json
{
  "certification_goal": {
    "certification_type": "CPDT-KA",
    "target_hours": 300,
    "weekly_goal_hours": 12,
    "target_completion_date": "2026-06-01"
  }
}
```

**Response:**
```json
{
  "id": 1,
  "user_id": 1,
  "certification_type": "CPDT-KA",
  "target_hours": 300,
  "weekly_goal_hours": 12,
  "target_completion_date": "2026-06-01"
}
```

---

### Update Certification Goal
```http
PATCH /certification_goal
```

**Request Body:** Same as Create

---

## 🏆 Milestones

### List All Milestones
```http
GET /milestones
```

**Response:**
```json
[
  {
    "id": 1,
    "user_id": 1,
    "hours_reached": 50,
    "achieved_at": "2025-10-15T14:30:00Z",
    "celebrated": true,
    "celebration_message": "🎯 You're 1/6th there! Most people quit before this.",
    "created_at": "2025-10-15T14:30:00Z",
    "updated_at": "2025-10-15T14:35:00Z"
  }
]
```

**Milestone Hours:** 50, 100, 150, 200, 250, 300

---

### Mark Milestone as Celebrated
```http
PATCH /milestones/:id/mark_celebrated
```

**Response:**
```json
{
  "id": 1,
  "user_id": 1,
  "hours_reached": 50,
  "achieved_at": "2025-10-15T14:30:00Z",
  "celebrated": true,
  "celebration_message": "🎯 You're 1/6th there! Most people quit before this."
}
```

---

## 📈 Dashboard & Statistics

### Get Dashboard Data
```http
GET /training/dashboard
```

**Response:**
```json
{
  "progress": {
    "total_hours": 47.5,
    "target_hours": 300,
    "hours_remaining": 252.5,
    "percentage": 15.8
  },
  "streaks": {
    "current": 12,
    "longest": 14
  },
  "this_week": {
    "hours": 8.5,
    "goal": 12,
    "percentage": 70.8
  },
  "projected_completion": "2026-03-15",
  "recent_sessions": [
    // Last 5 training sessions
  ],
  "uncelebrated_milestones": [
    // Milestones not yet marked as celebrated
  ]
}
```

---

### Get Detailed Statistics
```http
GET /training/stats
```

**Response:**
```json
{
  "total_stats": {
    "total_hours": 47.5,
    "total_sessions": 95,
    "unique_dogs": 8,
    "average_session_duration": 45
  },
  "breakdown_by_type": {
    "solo_walk": 25.5,
    "pack_walk": 15.0,
    "private_lesson": 7.0
  },
  "monthly_comparison": {
    "this_month": 32.5,
    "last_month": 28.0,
    "change_percentage": 16.1
  },
  "weekly_trend": [
    { "week": "Oct 01", "hours": 8.5 },
    { "week": "Oct 08", "hours": 10.2 },
    // ... 12 weeks of data
  ]
}
```

---

## 🔗 Invoice Integration

### How It Works

When creating invoices in your Walk Pocket Walks app, if the title contains "training", it automatically:
1. Creates a linked training session
2. Extracts duration from title (e.g., "60 minute training walk" → 60 minutes)
3. Detects session type (solo, pack, private)
4. Checks for milestone achievements

### Create Invoice (with Auto Training Session)
```http
POST /invoices
```

**Request Body:**
```json
{
  "invoice": {
    "pet_id": 5,
    "appointment_id": 123,
    "title": "60 minute training walk",
    "date_completed": "2025-11-06T10:00:00Z",
    "compensation": 50,
    "paid": false
  }
}
```

**Response:**
```json
{
  "invoice": {
    "id": 456,
    "appointment_id": 123,
    "pet_id": 5,
    "date_completed": "2025-11-06T10:00:00Z",
    "compensation": 50,
    "paid": false,
    "pending": false,
    "title": "60 minute training walk",
    "cancelled": false,
    "training_session_id": 789
  },
  "training_session": {
    "id": 789,
    "user_id": 1,
    "pet_id": 5,
    "session_date": "2025-11-06T10:00:00Z",
    "duration_minutes": 60,
    "session_type": "solo_walk",
    "notes": "Imported from invoice: 60 minute training walk",
    "training_focus": [],
    "pet": {
      "id": 5,
      "name": "Moose"
    }
  },
  "new_milestone": null
}
```

**Title Pattern Recognition:**
- `"60 minute training walk"` → 60 min, solo_walk
- `"45 min training pack walk"` → 45 min, pack_walk
- `"30 minute private training"` → 30 min, private_lesson
- `"Training session"` → Uses appointment duration or 60 min default

---

## 🚨 Error Handling

All endpoints return standard error responses:

### 400 Bad Request
```json
{
  "errors": ["Validation error message"]
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 422 Unprocessable Entity
```json
{
  "errors": [
    "Duration minutes must be greater than 0",
    "Session date can't be blank"
  ]
}
```

---

## 📱 Frontend Integration Examples

### React Example: Fetch Dashboard Data
```javascript
const fetchDashboard = async () => {
  const response = await fetch('/training/dashboard', {
    credentials: 'include' // Include session cookie
  });

  if (!response.ok) {
    throw new Error('Failed to fetch dashboard');
  }

  const data = await response.json();
  return data;
};
```

### React Example: Create Training Session
```javascript
const createTrainingSession = async (sessionData) => {
  const response = await fetch('/training_sessions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      training_session: sessionData
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.errors.join(', '));
  }

  const result = await response.json();

  // Check if milestone was reached
  if (result.new_milestone) {
    showMilestoneModal(result.new_milestone);
  }

  return result.session;
};
```

### React Example: Sync Historical Invoices (One-Time)
```javascript
const syncInvoices = async () => {
  const response = await fetch('/training_sessions/sync_from_invoices', {
    method: 'POST',
    credentials: 'include'
  });

  const result = await response.json();

  console.log(`Synced ${result.synced_count} training sessions`);

  // Show any new milestones
  result.new_milestones.forEach(milestone => {
    showMilestoneModal(milestone);
  });

  return result;
};
```

---

## 🎨 Celebration Messages

Milestones include automatic celebration messages:

| Hours | Message |
|-------|---------|
| 50    | 🎯 You're 1/6th there! Most people quit before this. |
| 100   | 💪 You've hit triple digits! You're serious about this. |
| 150   | 🚀 Halfway! The finish line is in sight. |
| 200   | ⭐ 2/3 complete! You're unstoppable. |
| 250   | 🔥 Only 50 hours left! Final stretch! |
| 300   | 🏆 CPDT-KA READY! You did it! |

---

## 📝 Data Models Reference

### TrainingSession
```typescript
interface TrainingSession {
  id: number;
  user_id: number;
  pet_id: number | null;
  session_date: string; // ISO 8601 datetime
  duration_minutes: number;
  session_type: 'solo_walk' | 'pack_walk' | 'group_class' | 'private_lesson' | 'shelter_volunteer' | 'other';
  notes: string | null;
  training_focus: string[]; // Array of focus areas
  created_at: string;
  updated_at: string;
  pet?: {
    id: number;
    name: string;
  };
}
```

### CertificationGoal
```typescript
interface CertificationGoal {
  id: number;
  user_id: number;
  certification_type: string; // Default: "CPDT-KA"
  target_hours: number; // Default: 300
  weekly_goal_hours: number; // Default: 12
  target_completion_date: string | null; // ISO 8601 date
  created_at: string;
  updated_at: string;
}
```

### Milestone
```typescript
interface Milestone {
  id: number;
  user_id: number;
  hours_reached: number; // 50, 100, 150, 200, 250, or 300
  achieved_at: string; // ISO 8601 datetime
  celebrated: boolean;
  celebration_message: string;
  created_at: string;
  updated_at: string;
}
```

---

## 🔄 Workflow Recommendations

### First Time Setup
1. User logs in via `/login`
2. Create certification goal via `POST /certification_goal`
3. Run one-time sync via `POST /training_sessions/sync_from_invoices`
4. Load dashboard via `GET /training/dashboard`

### Ongoing Usage
1. Create invoices as normal in Walk Pocket Walks app
2. Training invoices automatically create training sessions
3. Frontend polls for new milestones or listens for them in create responses
4. Users can manually add non-invoice training (group classes, shelter work, etc.)

### Dashboard Loading
1. `GET /training/dashboard` - Main overview
2. `GET /training/stats` - Detailed charts/graphs
3. `GET /milestones` - Check for uncelebrated achievements
4. `GET /training_sessions` - Full session history

---

## 🧪 Testing Endpoints

Use tools like Postman, curl, or your browser's dev tools:

```bash
# Example: Get dashboard data
curl http://localhost:3000/training/dashboard \
  -H "Cookie: your_session_cookie"

# Example: Create training session
curl -X POST http://localhost:3000/training_sessions \
  -H "Content-Type: application/json" \
  -H "Cookie: your_session_cookie" \
  -d '{
    "training_session": {
      "pet_id": 5,
      "session_date": "2025-11-06T10:00:00Z",
      "duration_minutes": 60,
      "session_type": "solo_walk",
      "notes": "Great session!",
      "training_focus": ["recall"]
    }
  }'
```

---

## 📞 Support

For issues or questions:
- Check backend logs: `tail -f log/development.log`
- Verify authentication is working
- Ensure all migrations have run: `rails db:migrate`
- Test endpoints with curl before implementing in frontend

---

**Last Updated:** November 6, 2025
**API Version:** 1.0
**Rails Version:** 7.2
