# Client API Documentation (Phase 1)

**Backend-Only Implementation**
**Last Updated:** January 16, 2026
**Status:** Production Ready ✅

---

## Overview

This document describes the Client (Pet Owner) API endpoints for the React Native mobile app. These endpoints are completely separate from the walker (web app) endpoints and do not affect the existing web application.

---

## Authentication

Client authentication uses JWT tokens with `user_type: 'client'` in the payload.

### Token Format
```
Authorization: Bearer <jwt_token>
```

### Token Payload
```json
{
  "client_id": 1,
  "user_type": "client",
  "exp": 1234567890
}
```

---

## Endpoints

### 1. Client Signup

**Endpoint:** `POST /client/signup`

**Request Body:**
```json
{
  "client": {
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com",
    "password": "password123",
    "password_confirmation": "password123",
    "phone_number": "555-1234",
    "notification_preferences": "email"
  }
}
```

**Response (201 Created):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "client": {
    "id": 1,
    "first_name": "John",
    "last_name": "Doe",
    "full_name": "John Doe",
    "email": "john@example.com",
    "phone_number": "555-1234",
    "notification_preferences": "email",
    "email_verified_at": null,
    "phone_verified_at": null
  }
}
```

**Validation Rules:**
- `first_name`: required
- `last_name`: required
- `email`: required, unique, valid email format
- `password`: required, minimum 6 characters (Rails default)
- `notification_preferences`: optional, must be one of: `email`, `sms`, `both`, `none` (default: `email`)

---

### 2. Client Login

**Endpoint:** `POST /client/login`

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "client": {
    "id": 1,
    "first_name": "John",
    "last_name": "Doe",
    "full_name": "John Doe",
    "email": "john@example.com",
    "phone_number": "555-1234",
    "notification_preferences": "email",
    "email_verified_at": null,
    "phone_verified_at": null
  }
}
```

**Error Response (401 Unauthorized):**
```json
{
  "error": "Invalid email or password"
}
```

---

### 3. Get Client Dashboard

**Endpoint:** `GET /client/me`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200 OK):**
```json
{
  "id": 1,
  "first_name": "John",
  "last_name": "Doe",
  "full_name": "John Doe",
  "email": "john@example.com",
  "phone_number": "555-1234",
  "notification_preferences": "email",
  "email_verified_at": null,
  "phone_verified_at": null,
  "pets": [
    {
      "id": 1,
      "name": "Moose",
      "birthdate": "2020-01-01",
      "sex": "Male",
      "spayed_neutered": true,
      "address": "123 Main St",
      "active": true
    }
  ],
  "upcoming_appointments": [
    {
      "id": 123,
      "pet": {
        "id": 1,
        "name": "Moose"
      },
      "appointment_date": "2026-01-17T00:00:00.000Z",
      "start_time": "2000-01-01T10:00:00.000Z",
      "end_time": "2000-01-01T10:30:00.000Z",
      "duration": 30,
      "recurring": true,
      "monday": true,
      "tuesday": false,
      "wednesday": true,
      "thursday": false,
      "friday": true,
      "saturday": false,
      "sunday": false,
      "walker": {
        "first_name": "Sarah"
      }
    }
  ],
  "unpaid_invoices": [
    {
      "id": 456,
      "pet": {
        "id": 1,
        "name": "Moose"
      },
      "date_completed": "2026-01-15T00:00:00.000Z",
      "compensation": 30,
      "title": "30 Minute Walk - Moose",
      "paid": false,
      "pending": false
    }
  ],
  "total_unpaid_amount": 150
}
```

**Notes:**
- Returns client profile, pets, upcoming appointments, and unpaid invoices in one call
- Walker info is limited to first name only (privacy)
- Only shows active pets
- Only shows upcoming (not past) appointments
- Only shows unpaid invoices

---

### 4. Update Client Profile

**Endpoint:** `PATCH /client/me`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "client": {
    "first_name": "John",
    "last_name": "Smith",
    "phone_number": "555-9999",
    "notification_preferences": "both"
  }
}
```

**Response (200 OK):**
```json
{
  "id": 1,
  "first_name": "John",
  "last_name": "Smith",
  "full_name": "John Smith",
  "email": "john@example.com",
  "phone_number": "555-9999",
  "notification_preferences": "both",
  "email_verified_at": null,
  "phone_verified_at": null
}
```

**Allowed Fields:**
- `first_name`
- `last_name`
- `phone_number`
- `notification_preferences`

**Not Allowed:**
- `email` (cannot be changed after signup)
- `password` (use separate password reset flow - not implemented yet)

---

### 5. Update Push Token (React Native)

**Endpoint:** `PATCH /client/push_token`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "push_token": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]"
}
```

**Response (200 OK):**
```json
{
  "message": "Push token updated successfully"
}
```

**Notes:**
- Call this endpoint after successful login in React Native
- Use Expo's `Notifications.getExpoPushTokenAsync()` to get the token
- Push notifications will be implemented in Phase 4

---

### 6. Client Logout

**Endpoint:** `DELETE /client/logout`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (204 No Content)**

**Notes:**
- With JWT, logout is primarily handled client-side by removing the token
- This endpoint exists for consistency but doesn't invalidate the token

---

## Database Schema

### Clients Table
```ruby
create_table "clients" do |t|
  t.string   "first_name",               null: false
  t.string   "last_name",                null: false
  t.string   "email",                    null: false
  t.string   "password_digest",          null: false
  t.string   "phone_number"
  t.string   "push_token"
  t.string   "notification_preferences", default: "email"
  t.datetime "email_verified_at"
  t.datetime "phone_verified_at"
  t.datetime "created_at",               null: false
  t.datetime "updated_at",               null: false
end

add_index "clients", ["email"], unique: true
add_index "clients", ["push_token"]
```

### Pets Table (Modified)
```ruby
# Added column:
t.bigint "client_id"  # Optional, nullable

add_index "pets", ["client_id"]
```

---

## Model Relationships

### Client Model
```ruby
has_many :pets
has_many :appointments, through: :pets
has_many :invoices, through: :pets
```

### Pet Model
```ruby
belongs_to :user                    # Walker (unchanged)
belongs_to :client, optional: true  # Pet owner (new, optional)
```

---

## Helper Methods

### Client Model

**`client.can_receive_push_notifications?`**
- Returns `true` if client has a push_token and notification_preferences allows push (sms or both)

**`client.can_receive_email?`**
- Returns `true` if notification_preferences allows email (email or both)

**`client.full_name`**
- Returns "First Last"

**`client.active_pets`**
- Returns pets where `active: true`

**`client.upcoming_appointments`**
- Returns future appointments (not canceled, not completed)

**`client.unpaid_invoices`**
- Returns invoices where `paid: false` and `cancelled: false`

**`client.total_unpaid_amount`**
- Returns sum of all unpaid invoice amounts

---

## React Native Implementation Example

### Authentication Context
```javascript
// contexts/ClientAuthContext.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://yourapi.com';

export const ClientAuthContext = createContext();

export const ClientAuthProvider = ({ children }) => {
  const [client, setClient] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check for saved token on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const savedToken = await AsyncStorage.getItem('clientToken');
    if (savedToken) {
      setToken(savedToken);
      await loadClient(savedToken);
    }
    setLoading(false);
  };

  const login = async (email, password) => {
    const response = await fetch(`${API_URL}/client/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (response.ok) {
      const data = await response.json();
      await AsyncStorage.setItem('clientToken', data.token);
      setToken(data.token);
      setClient(data.client);
      return { success: true };
    } else {
      const error = await response.json();
      return { success: false, error: error.error };
    }
  };

  const signup = async (clientData) => {
    const response = await fetch(`${API_URL}/client/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client: clientData })
    });

    if (response.ok) {
      const data = await response.json();
      await AsyncStorage.setItem('clientToken', data.token);
      setToken(data.token);
      setClient(data.client);
      return { success: true };
    } else {
      const errors = await response.json();
      return { success: false, errors: errors.errors };
    }
  };

  const loadClient = async (authToken) => {
    const response = await fetch(`${API_URL}/client/me`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    if (response.ok) {
      const data = await response.json();
      setClient(data);
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem('clientToken');
    setToken(null);
    setClient(null);
  };

  const updatePushToken = async (pushToken) => {
    if (!token) return;

    await fetch(`${API_URL}/client/push_token`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ push_token: pushToken })
    });
  };

  return (
    <ClientAuthContext.Provider value={{
      client,
      token,
      loading,
      login,
      signup,
      logout,
      updatePushToken,
      refreshClient: () => loadClient(token)
    }}>
      {children}
    </ClientAuthContext.Provider>
  );
};
```

### Push Notifications Setup
```javascript
// App.js or root component
import * as Notifications from 'expo-notifications';
import { ClientAuthContext } from './contexts/ClientAuthContext';

const App = () => {
  const { client, token, updatePushToken } = useContext(ClientAuthContext);

  useEffect(() => {
    if (client && token) {
      registerForPushNotifications();
    }
  }, [client, token]);

  const registerForPushNotifications = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') return;

    const token = await Notifications.getExpoPushTokenAsync();
    await updatePushToken(token.data);
  };

  // ...
};
```

---

## Testing

### Test Client Credentials (Development)
```
Email: john@example.com
Password: password123
```

### cURL Examples

**Login:**
```bash
curl -X POST http://localhost:4000/client/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}'
```

**Get Dashboard:**
```bash
curl http://localhost:4000/client/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Backwards Compatibility

✅ **Web application completely unaffected**
- All existing `/me`, `/login`, `/pets` endpoints work identically
- Pets without clients work perfectly (client_id is nullable)
- Zero breaking changes to walker authentication
- Client routes namespaced under `/client/*` to avoid conflicts

---

## Future Phases (Not Yet Implemented)

### Phase 2: Client Portal Views
- `GET /client/pets/:id` - View single pet details
- `GET /client/appointments` - List all appointments (past & future)
- `GET /client/invoices` - List all invoices with filtering

### Phase 3: Walk Sessions & Reports
- Walk check-in/checkout flow
- Walk reports (pee, poop, notes, photos)
- Real-time walk tracking

### Phase 4: Notifications
- Email notifications (SendGrid)
- Push notifications (Expo)
- Walk started/completed alerts

### Phase 5: Client Requests
- Request new appointments
- Request cancellations
- Request rescheduling

### Phase 6: Payments
- Stripe integration
- View payment history
- Pay invoices via app

---

## Notes

- Email is case-insensitive (automatically lowercased)
- Passwords are hashed with bcrypt via `has_secure_password`
- JWT tokens expire after 24 hours (configurable in `application_controller.rb`)
- Push tokens follow Expo push notification format
- All timestamps are in UTC

---

## Support

For questions or issues, contact the development team.
