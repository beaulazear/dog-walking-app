# Client API Reference for React Native App

## Overview

This document describes the Client (Pet Owner) API endpoints and data relationships for integrating the mobile app with the Rails backend. The client system allows pet owners to view their pets, appointments, and invoices through a mobile interface.

**Key Points:**
- Clients are **separate from Users** (walkers manage the system, clients view their pets)
- Pets have an **optional** `client_id` (supports existing pets without clients)
- Authentication uses **JWT tokens** (not sessions)
- All authenticated requests require `Authorization: Bearer <token>` header

---

## Base Configuration

### API Base URL
- **Development:** `http://localhost:4000` or your local IP
- **Production:** Your production API URL

### Request Headers
All authenticated requests must include:
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

---

## Authentication Flow

### 1. Client Signup

**Endpoint:** `POST /client/signup`

**Request Body:**
```json
{
  "client": {
    "first_name": "Jane",
    "last_name": "Doe",
    "email": "jane@example.com",
    "password": "securepassword123",
    "password_confirmation": "securepassword123",
    "phone_number": "555-123-4567",
    "notification_preferences": "email"
  }
}
```

**Parameters:**
- `first_name` (required): Client's first name
- `last_name` (required): Client's last name
- `email` (required): Unique email address (case-insensitive)
- `password` (required): Password (will be encrypted with bcrypt)
- `password_confirmation` (required): Must match password
- `phone_number` (optional): Phone number for SMS notifications
- `notification_preferences` (optional): One of `"email"`, `"sms"`, `"both"`, `"none"` (defaults to `"email"`)

**Success Response (201 Created):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "client": {
    "id": 1,
    "first_name": "Jane",
    "last_name": "Doe",
    "full_name": "Jane Doe",
    "email": "jane@example.com",
    "phone_number": "555-123-4567",
    "notification_preferences": "email",
    "email_verified_at": null,
    "phone_verified_at": null
  }
}
```

**Error Response (422 Unprocessable Entity):**
```json
{
  "errors": [
    "Email has already been taken",
    "Password confirmation doesn't match Password"
  ]
}
```

**Implementation Notes:**
- Store the `token` securely (e.g., React Native AsyncStorage or SecureStore)
- Token payload includes: `{ client_id: <id>, user_type: "client", exp: <timestamp> }`
- Token expires after 24 hours by default
- Email is automatically normalized (lowercased, stripped)

---

### 2. Client Login

**Endpoint:** `POST /client/login`

**Request Body:**
```json
{
  "email": "jane@example.com",
  "password": "securepassword123"
}
```

**Success Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "client": {
    "id": 1,
    "first_name": "Jane",
    "last_name": "Doe",
    "full_name": "Jane Doe",
    "email": "jane@example.com",
    "phone_number": "555-123-4567",
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

**Implementation Notes:**
- Email lookup is case-insensitive
- Uses bcrypt to verify password
- Store token for subsequent authenticated requests

---

### 3. Client Logout

**Endpoint:** `DELETE /client/logout`

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (204 No Content):**
Empty response body

**Implementation Notes:**
- JWT logout is handled client-side
- Simply delete the stored token from local storage
- Backend returns 204 regardless (stateless)

---

## Client Profile Management

### 4. Get Current Client Dashboard

**Endpoint:** `GET /client/me`

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200 OK):**
```json
{
  "id": 1,
  "first_name": "Jane",
  "last_name": "Doe",
  "full_name": "Jane Doe",
  "email": "jane@example.com",
  "phone_number": "555-123-4567",
  "notification_preferences": "email",
  "email_verified_at": null,
  "phone_verified_at": null,
  "pets": [
    {
      "id": 5,
      "name": "Max",
      "birthdate": "2018-03-15",
      "sex": "male",
      "spayed_neutered": true,
      "address": "123 Main St, Brooklyn, NY 11201",
      "active": true
    }
  ],
  "upcoming_appointments": [
    {
      "id": 42,
      "pet": {
        "id": 5,
        "name": "Max"
      },
      "appointment_date": "2026-01-20",
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
        "first_name": "John"
      }
    }
  ],
  "unpaid_invoices": [
    {
      "id": 15,
      "pet": {
        "id": 5,
        "name": "Max"
      },
      "date_completed": "2026-01-15",
      "compensation": 25.00,
      "title": "30-minute walk",
      "paid": false,
      "pending": true
    }
  ],
  "total_unpaid_amount": 150.00
}
```

**Error Response (401 Unauthorized):**
```json
{
  "error": "Not authorized"
}
```

**Implementation Notes:**
- This is the main dashboard endpoint for the mobile app
- Returns complete client profile with nested data
- `upcoming_appointments`: appointments from today forward, not completed/canceled
- `unpaid_invoices`: invoices where `paid: false` and `cancelled: false`
- All times are in UTC (convert to local timezone in the app)

---

### 5. Update Client Profile

**Endpoint:** `PATCH /client/me`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "client": {
    "first_name": "Jane",
    "last_name": "Smith",
    "phone_number": "555-987-6543",
    "notification_preferences": "both"
  }
}
```

**Allowed Parameters:**
- `first_name`
- `last_name`
- `phone_number`
- `notification_preferences` (`"email"`, `"sms"`, `"both"`, `"none"`)

**Note:** Email and password cannot be updated via this endpoint (security)

**Success Response (200 OK):**
```json
{
  "id": 1,
  "first_name": "Jane",
  "last_name": "Smith",
  "full_name": "Jane Smith",
  "email": "jane@example.com",
  "phone_number": "555-987-6543",
  "notification_preferences": "both",
  "email_verified_at": null,
  "phone_verified_at": null
}
```

**Error Response (422 Unprocessable Entity):**
```json
{
  "errors": ["Phone number is invalid"]
}
```

---

### 6. Update Push Notification Token

**Endpoint:** `PATCH /client/push_token`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "push_token": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]"
}
```

**Success Response (200 OK):**
```json
{
  "message": "Push token updated successfully"
}
```

**Error Response (422 Unprocessable Entity):**
```json
{
  "errors": ["Push token can't be blank"]
}
```

**Implementation Notes:**
- Call this after obtaining the Expo push token
- Update whenever the token changes
- Token format: `ExponentPushToken[...]` for Expo
- Used for sending push notifications to the client

---

## Data Models & Relationships

### Client Model

**Database Fields:**
- `id`: Primary key
- `first_name`: String (required)
- `last_name`: String (required)
- `email`: String (required, unique, case-insensitive)
- `password_digest`: String (bcrypt hash, never returned in API)
- `phone_number`: String (optional)
- `notification_preferences`: Enum (`"email"`, `"sms"`, `"both"`, `"none"`)
- `push_token`: String (Expo push notification token)
- `email_verified_at`: DateTime (nullable)
- `phone_verified_at`: DateTime (nullable)
- `created_at`: DateTime
- `updated_at`: DateTime

**Associations:**
```ruby
Client
  ├── has_many :pets (dependent: nullify)
  ├── has_many :appointments (through: pets)
  └── has_many :invoices (through: pets)
```

**Important:** When a client is deleted, their pets are NOT deleted. Instead, `client_id` is set to `null` (nullify dependency).

---

### Pet Model

**Database Fields:**
- `id`: Primary key
- `name`: String (required)
- `birthdate`: Date (required, must be in the past)
- `sex`: String
- `spayed_neutered`: Boolean
- `address`: String (required)
- `behavioral_notes`: String (required)
- `supplies_location`: String (required)
- `allergies`: String
- `active`: Boolean (default: true)
- `user_id`: Integer (required) - References the walker managing this pet
- `client_id`: Integer (optional) - References the pet owner
- `latitude`: Float (auto-geocoded from address)
- `longitude`: Float (auto-geocoded from address)
- `geocoded_at`: DateTime
- `geocoding_failed`: Boolean
- `geocoding_error`: String
- `origin_trainer`: String
- `created_at`: DateTime
- `updated_at`: DateTime

**Associations:**
```ruby
Pet
  ├── belongs_to :user (walker - required)
  ├── belongs_to :client (owner - optional: true)
  ├── has_many :appointments
  ├── has_many :pet_sits
  ├── has_many :invoices
  └── has_many :additional_incomes
```

**Key Points:**
- `client_id` is **optional** - supports existing pets without clients
- `user_id` is **required** - every pet must have a walker managing them
- Address is automatically geocoded after save (if changed)
- Geocoding uses OpenStreetMap (free, 1 req/sec limit)

---

### Appointment Model

**Database Fields (Relevant to Clients):**
- `id`: Primary key
- `appointment_date`: Date
- `start_time`: Time (stored as UTC)
- `end_time`: Time (stored as UTC)
- `duration`: Integer (minutes: 30, 45, or 60)
- `price`: Decimal
- `recurring`: Boolean
- `monday` through `sunday`: Boolean (recurring pattern)
- `completed`: Boolean
- `canceled`: Boolean
- `pet_id`: Integer (required)
- `user_id`: Integer (required) - Original walker
- `completed_by_user_id`: Integer (nullable) - Who actually completed it

**Associations:**
```ruby
Appointment
  ├── belongs_to :user (walker)
  ├── belongs_to :pet
  └── belongs_to :completed_by_user (optional)
```

**Client Access:**
Clients can view appointments through their pets:
```
Client → has_many pets → has_many appointments
```

**Recurring Appointments:**
- If `recurring: true`, the appointment repeats on specified weekdays
- Example: `monday: true, wednesday: true, friday: true` = MWF recurring walk
- `appointment_date` is the original start date
- The app should calculate future occurrences based on day flags

---

### Invoice Model

**Database Fields (Relevant to Clients):**
- `id`: Primary key
- `date_completed`: Date
- `compensation`: Decimal (amount owed)
- `title`: String (description, e.g., "30-minute walk")
- `paid`: Boolean
- `pending`: Boolean
- `cancelled`: Boolean
- `pet_id`: Integer (required)
- `appointment_id`: Integer (optional)
- `pet_sit_id`: Integer (optional)

**Associations:**
```ruby
Invoice
  ├── belongs_to :pet
  ├── belongs_to :appointment (optional)
  └── belongs_to :pet_sit (optional)
```

**Client Access:**
```
Client → has_many pets → has_many invoices
```

**Business Rules:**
- Invoice must have either `appointment_id` OR `pet_sit_id` (not both, not neither)
- Unpaid invoices: `paid: false` AND `cancelled: false`
- Clients see invoices for all their pets combined

---

## How to Associate Pets with Clients

### Current State
- Your existing pets have `client_id: null`
- The `client_id` field is **optional** in the Pet model
- This allows backward compatibility with your existing data

### Options for Integration

#### Option 1: Walker Creates Client and Associates Pet (Recommended for MVP)

**Scenario:** Walker manually creates a client account for a pet owner, then associates existing pets

**Backend Changes Needed:**
Currently, the `/pets` endpoint doesn't accept `client_id` in the params. You would need to:

1. Add `client_id` to `pet_params` in `PetsController`:
```ruby
def pet_params
  params.require(:pet).permit(
    :user_id, :name, :spayed_neutered, :supplies_location,
    :behavioral_notes, :birthdate, :sex, :allergies, :address,
    :id, :active, :origin_trainer, :client_id  # Add this
  )
end

def pet_params_update
  params.permit(
    :name, :spayed_neutered, :supplies_location, :behavioral_notes,
    :birthdate, :sex, :allergies, :address, :active, :origin_trainer,
    :client_id  # Add this
  )
end
```

**Frontend Flow (React Native - Walker App):**
1. Walker creates client via signup endpoint
2. Walker gets back `client.id`
3. Walker updates pet: `PATCH /pets/:id` with `{ "client_id": 5 }`
4. Pet is now associated with client

**Frontend Flow (React Native - Client App):**
1. Walker shares login credentials with pet owner
2. Pet owner logs in with email/password
3. App calls `GET /client/me`
4. Pet appears in `pets` array automatically

---

#### Option 2: Client Self-Signup with Code (Future Enhancement)

**Scenario:** Pet owner signs up themselves and enters a code to claim their pets

This would require:
1. Generate unique "claim codes" for pets without clients
2. Client signs up → enters code → pets are associated
3. New endpoint: `POST /client/claim_pet` with `{ "claim_code": "ABC123" }`

**Not currently implemented** - requires new backend logic

---

#### Option 3: Email Invitation System (Future Enhancement)

**Scenario:** Walker sends email invitation to pet owner

Flow:
1. Walker enters pet owner's email
2. System sends invitation email with signup link + token
3. Pet owner clicks link → pre-filled signup → pets auto-associated

**Not currently implemented** - requires email service integration

---

## Implementation Checklist for React Native

### Authentication & Storage
- [ ] Install secure storage (expo-secure-store or react-native-keychain)
- [ ] Create authentication context/provider
- [ ] Implement token storage (save on login/signup)
- [ ] Implement token retrieval for API calls
- [ ] Implement logout (clear stored token)
- [ ] Add token refresh logic (tokens expire after 24 hours)

### API Client Setup
- [ ] Create API client with base URL configuration
- [ ] Add request interceptor to inject `Authorization: Bearer <token>` header
- [ ] Add response interceptor to handle 401 (redirect to login)
- [ ] Handle network errors gracefully

### Auth Screens
- [ ] Login screen (`POST /client/login`)
- [ ] Signup screen (`POST /client/signup`)
  - Form validation (password match, email format)
  - Handle validation errors from API
- [ ] Profile screen (`GET /client/me`, `PATCH /client/me`)

### Dashboard
- [ ] Fetch dashboard data (`GET /client/me`)
- [ ] Display pets list
  - Pet name, sex, spayed/neutered status
  - Active/inactive indicator
  - Handle empty state (no pets yet)
- [ ] Display upcoming appointments
  - Group by date
  - Show pet name, walker name, time
  - Handle recurring appointments (calculate occurrences)
- [ ] Display unpaid invoices
  - Show total unpaid amount
  - List individual invoices
  - Group by pet

### Push Notifications
- [ ] Register for push notifications (Expo)
- [ ] Get push token
- [ ] Send token to backend (`PATCH /client/push_token`)
- [ ] Handle notification permissions

### Date/Time Handling
- [ ] Install date library (date-fns or dayjs)
- [ ] Convert UTC times from API to local timezone
- [ ] Format dates for display
- [ ] Calculate recurring appointment occurrences

### Error Handling
- [ ] Display validation errors from API
- [ ] Handle 401 Unauthorized (expired token)
- [ ] Handle 422 Unprocessable Entity (validation errors)
- [ ] Handle network errors (offline mode)
- [ ] Show user-friendly error messages

---

## Example API Call Flow (React Native)

### Setup: API Client

```javascript
// api/client.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const API_BASE_URL = __DEV__
  ? 'http://localhost:4000'  // or your computer's IP
  : 'https://your-production-api.com';

class APIClient {
  async getToken() {
    return await AsyncStorage.getItem('authToken');
  }

  async setToken(token) {
    await AsyncStorage.setItem('authToken', token);
  }

  async clearToken() {
    await AsyncStorage.removeItem('authToken');
  }

  async request(endpoint, options = {}) {
    const token = await this.getToken();

    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      // Token expired or invalid
      await this.clearToken();
      // Navigate to login screen
      throw new Error('Authentication required');
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || data.errors?.join(', ') || 'Request failed');
    }

    return data;
  }

  // Auth endpoints
  async signup(clientData) {
    const data = await this.request('/client/signup', {
      method: 'POST',
      body: JSON.stringify({ client: clientData }),
    });
    await this.setToken(data.token);
    return data;
  }

  async login(email, password) {
    const data = await this.request('/client/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    await this.setToken(data.token);
    return data;
  }

  async logout() {
    await this.request('/client/logout', { method: 'DELETE' });
    await this.clearToken();
  }

  // Profile endpoints
  async getDashboard() {
    return await this.request('/client/me');
  }

  async updateProfile(updates) {
    return await this.request('/client/me', {
      method: 'PATCH',
      body: JSON.stringify({ client: updates }),
    });
  }

  async updatePushToken(pushToken) {
    return await this.request('/client/push_token', {
      method: 'PATCH',
      body: JSON.stringify({ push_token: pushToken }),
    });
  }
}

export default new APIClient();
```

### Usage: Login Screen

```javascript
// screens/LoginScreen.js
import { useState } from 'react';
import { View, TextInput, Button, Text } from 'react-native';
import api from '../api/client';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    try {
      setError('');
      setLoading(true);

      const data = await api.login(email, password);

      // Navigate to dashboard
      navigation.replace('Dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      {error ? <Text style={{ color: 'red' }}>{error}</Text> : null}
      <Button
        title="Login"
        onPress={handleLogin}
        disabled={loading}
      />
      <Button
        title="Sign Up"
        onPress={() => navigation.navigate('Signup')}
      />
    </View>
  );
}
```

### Usage: Dashboard Screen

```javascript
// screens/DashboardScreen.js
import { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator } from 'react-native';
import api from '../api/client';
import { format } from 'date-fns';

export default function DashboardScreen() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const dashboard = await api.getDashboard();
      setData(dashboard);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <ActivityIndicator size="large" />;
  }

  if (error) {
    return <Text>Error: {error}</Text>;
  }

  return (
    <View>
      <Text>Welcome, {data.full_name}!</Text>

      <Text>Your Pets:</Text>
      <FlatList
        data={data.pets}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View>
            <Text>{item.name} ({item.sex})</Text>
            <Text>{item.address}</Text>
          </View>
        )}
      />

      <Text>Upcoming Appointments:</Text>
      <FlatList
        data={data.upcoming_appointments}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View>
            <Text>{item.pet.name} - {format(new Date(item.appointment_date), 'MMM d')}</Text>
            <Text>Walker: {item.walker.first_name}</Text>
          </View>
        )}
      />

      <Text>Total Unpaid: ${data.total_unpaid_amount}</Text>
    </View>
  );
}
```

---

## Common Pitfalls & Tips

### 1. Time Zone Handling
**Problem:** Times are stored in UTC, but need to display in local timezone

**Solution:**
```javascript
import { parseISO, format } from 'date-fns';
import { utcToZonedTime } from 'date-fns-tz';

// API returns: "2000-01-01T10:00:00.000Z"
const utcTime = parseISO(appointment.start_time);
const localTime = utcToZonedTime(utcTime, 'America/New_York'); // or user's timezone
const formatted = format(localTime, 'h:mm a'); // "10:00 AM"
```

### 2. Recurring Appointments
**Problem:** API returns one appointment record with day flags, need to show all occurrences

**Solution:**
```javascript
function getRecurringDates(appointment, startDate, endDate) {
  const dates = [];
  const dayFlags = {
    0: appointment.sunday,
    1: appointment.monday,
    2: appointment.tuesday,
    3: appointment.wednesday,
    4: appointment.thursday,
    5: appointment.friday,
    6: appointment.saturday,
  };

  let currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay();
    if (dayFlags[dayOfWeek]) {
      dates.push(new Date(currentDate));
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dates;
}
```

### 3. Token Expiration
**Problem:** Token expires after 24 hours, causing 401 errors

**Solution:**
- Decode JWT to check expiration before requests
- Implement token refresh flow (or prompt user to re-login)
- Handle 401 responses globally (redirect to login)

### 4. Optional Client Relationship
**Problem:** Existing pets have `client_id: null`

**Solution:**
- When displaying pets, handle `null` client gracefully
- Show "No owner assigned" state
- Only allow pet owner features if `client_id` is set

### 5. Network Requests on Mount
**Problem:** Making API calls in useEffect without cleanup

**Solution:**
```javascript
useEffect(() => {
  let cancelled = false;

  async function load() {
    try {
      const data = await api.getDashboard();
      if (!cancelled) {
        setData(data);
      }
    } catch (err) {
      if (!cancelled) {
        setError(err.message);
      }
    }
  }

  load();

  return () => {
    cancelled = true;
  };
}, []);
```

---

## Next Steps

### Immediate (MVP)
1. **Update Backend:** Add `client_id` to pet params in `PetsController`
2. **Build Auth Flow:** Implement signup/login/logout in React Native
3. **Build Dashboard:** Display pets, appointments, invoices
4. **Test Association:** Manually associate a test pet with a client

### Short Term
1. **Push Notifications:** Implement notification system
2. **Invoice Payment:** Add payment gateway integration
3. **Appointment Details:** Show full appointment details screen
4. **Pet Details:** Show full pet profile screen

### Long Term
1. **Self-Service Association:** Implement claim code or invitation system
2. **In-App Messaging:** Allow clients to message their walker
3. **Photo Gallery:** Show photos from walks (requires walker app updates)
4. **Schedule Requests:** Allow clients to request new appointments

---

## Support & Questions

When implementing in React Native, use this document as a reference for:
- ✅ Endpoint URLs and HTTP methods
- ✅ Request body structures
- ✅ Response formats and data shapes
- ✅ Authentication flow and token handling
- ✅ Data model relationships
- ✅ Error handling patterns

For backend changes (adding `client_id` to pet params), refer to the code examples in the "How to Associate Pets with Clients" section.
