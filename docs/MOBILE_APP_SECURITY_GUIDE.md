# Mobile App Security Guide
**Last Updated:** February 22, 2026

---

## TL;DR - What You Need to Know

✅ **Good News:** Your API is already well-secured!
⚠️ **Focus Area:** Mobile-specific security (JWT storage, GPS spoofing, etc.)

**The Reality:** Since mobile apps can be reverse-engineered, **your API is your security perimeter**. Apple/Google handle app-level security, but YOU must secure your backend.

---

## Current Security Status: ✅ STRONG

### ✅ What You Already Have (Very Good!)

1. **JWT Authentication** ✓
   - Tokens properly validated on every request
   - Token type checking (prevents client tokens on user endpoints)
   - Session fallback for web compatibility

2. **Authorization Checks** ✓
   - `authorize_sponsor!` - verifies ownership before modifications
   - Only sponsors can pause/resume/cancel their sponsorships
   - Only dog walkers can claim sponsorships
   - Only scoopers can log sweeps

3. **Rate Limiting** ✓
   - 300 requests per 5 min per IP (general)
   - 500 requests per 5 min per authenticated user
   - Login throttling (5 attempts/hour)
   - Signup throttling (3/day)
   - Job creation throttling
   - Sweep logging throttling (50/day)

4. **Input Validation** ✓
   - Strong params (prevents mass assignment)
   - Database-level validations
   - GPS boundary checks

5. **Attack Prevention** ✓
   - SQL injection pattern blocking
   - Bad user agent blocking
   - File scanner blocking (.env, .git, etc.)
   - HTTPS enforcement in production

---

## Mobile App Security - What Apple/Google Handle

### ✅ What the App Stores Give You (FREE)

**Code Signing:**
- Apple/Google cryptographically sign your app
- Users can't install modified/tampered apps
- App Store review catches obvious malware

**App Sandboxing:**
- Your app can't access other apps' data
- Secure data storage (Keychain/Keystore)
- OS-level permission system

**Network Security:**
- HTTPS by default (App Transport Security on iOS)
- Certificate validation

---

## What YOU Must Handle - Critical Mobile Security

### 1. JWT Token Storage ⚠️ CRITICAL

**The Problem:**
Mobile apps need to store JWT tokens locally. If stored improperly, attackers can steal tokens and impersonate users.

**✅ SECURE - Do This:**

**iOS (React Native):**
```javascript
import * as SecureStore from 'expo-secure-store';

// Store token
await SecureStore.setItemAsync('jwt_token', token);

// Retrieve token
const token = await SecureStore.getItemAsync('jwt_token');

// Delete token (on logout)
await SecureStore.deleteItemAsync('jwt_token');
```

**Android (React Native):**
```javascript
// expo-secure-store handles both platforms
import * as SecureStore from 'expo-secure-store';

// Same API as iOS above
```

**❌ INSECURE - Don't Do This:**
```javascript
// ❌ NEVER store tokens in AsyncStorage (not encrypted)
await AsyncStorage.setItem('jwt_token', token); // BAD!

// ❌ NEVER store tokens in localStorage (web)
localStorage.setItem('jwt_token', token); // BAD!

// ❌ NEVER hardcode tokens
const token = "eyJhbGciOiJ..."; // BAD!
```

**Why It Matters:**
- Rooted/jailbroken devices can read AsyncStorage
- Malware can access unencrypted storage
- Secure storage uses hardware encryption (iOS Keychain, Android Keystore)

---

### 2. Token Lifecycle ⚠️ IMPORTANT

**Current Implementation:**
Your JWT tokens don't expire (no `exp` claim). This is a security risk.

**✅ Recommended: Add Token Expiration**

Update your JWT generation:

```ruby
# app/controllers/concerns/json_web_token.rb (or wherever jwt_encode is)

def jwt_encode(payload)
  payload[:exp] = 24.hours.from_now.to_i  # Token expires in 24 hours
  JWT.encode(payload, Rails.application.credentials.secret_key_base.to_s)
end
```

**Mobile App Flow:**
```javascript
// When token expires, refresh or re-login
const makeAuthRequest = async (url, options = {}) => {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    if (response.status === 401) {
      // Token expired - redirect to login
      navigation.navigate('Login');
    }

    return response;
  } catch (error) {
    console.error('Request failed:', error);
  }
};
```

**Why Expiration Matters:**
- Stolen tokens are only valid for 24 hours
- Forces attackers to steal fresh tokens
- Limits damage from compromised tokens

---

### 3. GPS Spoofing Protection ⚠️ CRITICAL FOR YOUR APP

**The Problem:**
Mobile apps can fake GPS coordinates. Users could log sweeps without actually being at the location.

**✅ Current Protection (Good Start):**
```ruby
# app/models/sweep.rb
def gps_within_block_boundaries
  lat_diff = (arrival_latitude - sponsorship.latitude).abs
  lng_diff = (arrival_longitude - sponsorship.longitude).abs
  max_tolerance = 0.0015  # ~150 meters

  if lat_diff > max_tolerance || lng_diff > max_tolerance
    errors.add(:base, "GPS location is too far from the sponsored block")
    self.gps_verified = false
  else
    self.gps_verified = true
  end
end
```

**⚠️ Additional Protections to Consider:**

**Backend - Add Timestamp Validation:**
```ruby
# Prevent replay attacks (using old GPS coordinates)
validate :sweep_not_too_recent

def sweep_not_too_recent
  if sponsorship.sweeps.where(status: 'completed')
                       .where('completed_at > ?', 1.hour.ago)
                       .exists?
    errors.add(:base, "Too soon since last sweep (must wait 1 hour)")
  end
end
```

**Mobile App - Use Location Accuracy:**
```javascript
// Get location with accuracy check
const location = await Location.getCurrentPositionAsync({
  accuracy: Location.Accuracy.High,  // Require GPS (not cell tower)
});

// Check accuracy before submitting
if (location.coords.accuracy > 50) {  // More than 50 meters
  alert('GPS accuracy too low. Please wait for better signal.');
  return;
}

// Send to backend
await fetch('/api/sponsorships/1/sweeps', {
  method: 'POST',
  body: JSON.stringify({
    arrival_latitude: location.coords.latitude,
    arrival_longitude: location.coords.longitude,
    gps_accuracy: location.coords.accuracy,  // Include for backend validation
    pickup_count: 5
  })
});
```

**Backend - Validate Accuracy:**
```ruby
# Add to Sweep model
validates :gps_accuracy, numericality: { less_than_or_equal_to: 100 }, allow_nil: true

# In sweep creation
if params[:gps_accuracy].to_f > 100
  render json: { error: "GPS accuracy too low" }, status: :unprocessable_entity
  return
end
```

**⚠️ GPS Spoofing Can't Be Fully Prevented:**
- Jailbroken/rooted devices can mock GPS
- Desktop Android emulators can fake locations
- Hardware GPS spoofers exist

**✅ Defense Strategy:**
1. Make it inconvenient (most users won't bother)
2. Monitor for suspicious patterns (see below)
3. Use photo evidence (before/after photos)
4. Community reports (other users report fake sweeps)

---

### 4. Photo Upload Security ⚠️ IMPORTANT

**Current Implementation:**
You use Active Storage with S3 - this is good!

**✅ Additional Checks to Add:**

**File Size Limits:**
```ruby
# config/application.rb or in controller
validate :photo_size_limit

def photo_size_limit
  if after_photo.attached? && after_photo.byte_size > 10.megabytes
    errors.add(:after_photo, "must be less than 10MB")
  end
end
```

**File Type Validation:**
```ruby
# app/models/sweep.rb
validates :after_photo,
  content_type: ['image/png', 'image/jpg', 'image/jpeg'],
  size: { less_than: 10.megabytes }
```

**Mobile App - Compress Photos:**
```javascript
import * as ImageManipulator from 'expo-image-manipulator';

// Compress before upload
const compressedPhoto = await ImageManipulator.manipulateAsync(
  photo.uri,
  [{ resize: { width: 1200 } }],  // Max width 1200px
  { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
);

// Upload compressed photo
const formData = new FormData();
formData.append('after_photo', {
  uri: compressedPhoto.uri,
  type: 'image/jpeg',
  name: 'after_photo.jpg'
});
```

---

### 5. API Request Security ⚠️ IMPORTANT

**✅ Always Validate Server Responses:**

**❌ INSECURE - Trusting Server Data:**
```javascript
// BAD - Assumes response is always valid JSON
const data = await response.json();
console.log(data.sponsorship.id);  // Crashes if structure changes
```

**✅ SECURE - Validate Responses:**
```javascript
// GOOD - Validate response structure
const data = await response.json();

if (!data || !data.sponsorship || !data.sponsorship.id) {
  console.error('Invalid response from server');
  return;
}

console.log(data.sponsorship.id);  // Safe
```

**✅ Handle Rate Limiting Gracefully:**
```javascript
const response = await fetch(url, options);

if (response.status === 429) {
  const retryAfter = response.headers.get('RateLimit-Reset');
  const waitTime = parseInt(retryAfter) - Math.floor(Date.now() / 1000);

  alert(`Too many requests. Please wait ${waitTime} seconds.`);
  return;
}
```

---

### 6. Prevent Replay Attacks ✅ OPTIONAL

**The Problem:**
Attackers could intercept and replay valid requests to perform unauthorized actions.

**✅ Current Protection:**
- HTTPS prevents traffic interception (already enabled)
- JWT tokens include user_id (can't be reused for different users)

**⚠️ Advanced Protection (If Needed):**

**Backend - Add Request Nonce:**
```ruby
# For critical operations like claiming sponsorships
def claim
  unless params[:nonce] && !Sponsorship.where(nonce: params[:nonce]).exists?
    render json: { error: "Invalid or duplicate request" }, status: :conflict
    return
  end

  ActiveRecord::Base.transaction do
    @sponsorship = Sponsorship.lock.find(params[:id])
    @sponsorship.claim!(current_user)
    @sponsorship.update!(nonce: params[:nonce])
  end
end
```

**Mobile App - Generate Nonce:**
```javascript
import uuid from 'react-native-uuid';

const claimSponsorship = async (sponsorshipId) => {
  const nonce = uuid.v4();  // Generate unique ID

  await fetch(`/api/sponsorships/${sponsorshipId}/claim`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ nonce })
  });
};
```

**Note:** This is overkill for most apps. Your current first-tap-wins locking is sufficient.

---

## Attack Scenarios & Defenses

### Scenario 1: GPS Spoofing to Fake Sweeps

**Attack:**
User uses fake GPS app to log sweeps without actually being there.

**Defense (Already Implemented):**
1. ✅ GPS boundary validation (150m tolerance)
2. ✅ Photo requirements (before/after)
3. ⚠️ ADD: Timestamp validation (prevent rapid consecutive sweeps)
4. ⚠️ ADD: Accuracy validation (require high GPS accuracy)

**Detection:**
```ruby
# Add to monitoring/admin panel
class SweepsController
  def suspicious_sweeps
    # Find sweeps with suspiciously perfect coordinates
    perfect_sweeps = Sweep.where(
      'arrival_latitude = ? AND arrival_longitude = ?',
      sponsorship.latitude,
      sponsorship.longitude
    )

    # Find users with too many sweeps in short time
    rapid_sweeps = User.joins(:sweeps)
      .where('sweeps.created_at > ?', 1.day.ago)
      .group('users.id')
      .having('COUNT(sweeps.id) > 20')
  end
end
```

---

### Scenario 2: Token Theft from Compromised Device

**Attack:**
Attacker gains physical access to unlocked phone or uses malware to steal JWT token.

**Defense:**
1. ✅ Store tokens in Secure Storage (Keychain/Keystore)
2. ⚠️ ADD: Token expiration (24 hours)
3. ⚠️ ADD: Device fingerprinting (optional)

**Token Expiration Implementation:**
```ruby
# Update JWT encode to include expiration
def jwt_encode(payload)
  payload[:exp] = 24.hours.from_now.to_i
  payload[:iat] = Time.current.to_i  # Issued at
  JWT.encode(payload, Rails.application.credentials.secret_key_base.to_s)
end

# JWT decode automatically validates expiration
def jwt_decode(token)
  JWT.decode(token, Rails.application.credentials.secret_key_base.to_s, true, algorithm: 'HS256')[0]
rescue JWT::ExpiredSignature
  Rails.logger.warn "Expired JWT token"
  nil
rescue JWT::DecodeError
  Rails.logger.warn "Invalid JWT token"
  nil
end
```

---

### Scenario 3: Mass Account Creation

**Attack:**
Automated bots create thousands of fake accounts to spam the system.

**Defense (Already Implemented):**
1. ✅ Signup rate limiting (3 signups per day per IP)
2. ✅ Email validation (unique emails required)

**Additional Protection (Optional):**
```ruby
# Add CAPTCHA for signup (only if you see abuse)
# Using Google reCAPTCHA v3 (invisible)

def create
  unless verify_recaptcha(action: 'signup', minimum_score: 0.5)
    render json: { error: "Suspicious activity detected" }, status: :forbidden
    return
  end

  # Rest of signup logic...
end
```

---

### Scenario 4: API Key Extraction

**Attack:**
Attacker decompiles mobile app and extracts API keys or secrets.

**Defense:**
**❌ NEVER Put Secrets in Mobile App:**
```javascript
// ❌ BAD - API keys in code
const STRIPE_API_KEY = "sk_live_...";  // NEVER DO THIS!
const API_SECRET = "my_secret_key";    // NEVER DO THIS!
```

**✅ GOOD - All Secrets on Backend:**
```javascript
// ✓ GOOD - No secrets in app
const API_URL = "https://www.pocket-walks.com/api";

// All authentication uses JWT tokens (issued by backend)
const response = await fetch(`${API_URL}/sponsorships`, {
  headers: {
    'Authorization': `Bearer ${jwt_token}`  // Token from login
  }
});
```

**Your Current Implementation:** ✅ SECURE
- No API keys in mobile app
- JWT tokens issued by backend after login
- Stripe operations happen on backend (not in app)

---

## Mobile-Specific Best Practices

### ✅ DO THIS:

1. **Store Tokens Securely:**
   ```javascript
   // Use expo-secure-store (iOS Keychain / Android Keystore)
   import * as SecureStore from 'expo-secure-store';
   ```

2. **Validate All User Input:**
   ```javascript
   // Before sending to API
   if (!latitude || !longitude) {
     alert('GPS coordinates required');
     return;
   }

   if (pickupCount < 0 || pickupCount > 100) {
     alert('Invalid pickup count');
     return;
   }
   ```

3. **Handle Network Errors:**
   ```javascript
   try {
     const response = await fetch(url, options);

     if (!response.ok) {
       const error = await response.json();
       alert(error.error || 'Request failed');
       return;
     }

     const data = await response.json();
     return data;
   } catch (error) {
     if (error.message === 'Network request failed') {
       alert('No internet connection');
     } else {
       alert('Something went wrong');
     }
   }
   ```

4. **Clear Tokens on Logout:**
   ```javascript
   const logout = async () => {
     await SecureStore.deleteItemAsync('jwt_token');
     navigation.navigate('Login');
   };
   ```

5. **Use HTTPS Only:**
   ```javascript
   // React Native enforces HTTPS by default (App Transport Security)
   // Your API already uses HTTPS ✓
   const API_URL = "https://www.pocket-walks.com/api";  // ✓ HTTPS
   ```

---

### ❌ DON'T DO THIS:

1. **Don't Trust Client-Side Validation:**
   ```javascript
   // ❌ Client-side only validation is insufficient
   if (price < 0) {
     alert('Price must be positive');
     return;
   }
   // ✓ Backend MUST also validate (you already do this)
   ```

2. **Don't Store Sensitive Data:**
   ```javascript
   // ❌ Don't store payment info
   await AsyncStorage.setItem('credit_card', cardNumber);  // NEVER!

   // ✓ Let Stripe handle it (you already do this)
   ```

3. **Don't Ignore Certificate Errors:**
   ```javascript
   // ❌ Don't disable SSL verification
   fetch(url, {
     agent: new https.Agent({ rejectUnauthorized: false })  // NEVER!
   });

   // ✓ Let React Native validate certificates (default)
   ```

4. **Don't Hardcode URLs:**
   ```javascript
   // ❌ Don't hardcode different environments
   const url = "http://localhost:3000/api";  // BAD!

   // ✓ Use environment variables
   const API_URL = process.env.API_URL || "https://www.pocket-walks.com/api";
   ```

---

## Monitoring & Detection

### Set Up Alerts for Suspicious Activity

**Backend - Add Monitoring:**

```ruby
# app/controllers/concerns/security_monitoring.rb
module SecurityMonitoring
  extend ActiveSupport::Concern

  def log_suspicious_activity(reason, details = {})
    Rails.logger.warn "[SECURITY] #{reason}: #{details.to_json}"

    # In production, send to monitoring service (Sentry, Datadog, etc.)
    # Sentry.capture_message(reason, extra: details) if Rails.env.production?
  end

  # Detect GPS spoofing patterns
  def detect_gps_spoofing(user)
    recent_sweeps = user.sweeps.where('completed_at > ?', 1.hour.ago)

    if recent_sweeps.count > 10
      log_suspicious_activity("Rapid sweep logging", {
        user_id: user.id,
        sweep_count: recent_sweeps.count
      })
    end

    # Check for perfect coordinates (suspicious)
    perfect_coords = recent_sweeps.select do |sweep|
      sweep.arrival_latitude == sweep.sponsorship.latitude &&
      sweep.arrival_longitude == sweep.sponsorship.longitude
    end

    if perfect_coords.count > 5
      log_suspicious_activity("Perfect GPS coordinates", {
        user_id: user.id,
        perfect_count: perfect_coords.count
      })
    end
  end
end
```

**Use in Controller:**
```ruby
class Api::SweepsController < ApplicationController
  include SecurityMonitoring

  def create
    # ... create sweep logic ...

    # Monitor for suspicious patterns
    detect_gps_spoofing(current_user) if sweep.persisted?
  end
end
```

---

## Recommended Next Steps

### ⚠️ CRITICAL - Do These First:

1. **Add JWT Token Expiration** (30 minutes to implement)
   - Tokens currently don't expire
   - Add `exp` claim to JWT
   - Update mobile app to handle 401 responses

2. **Use Secure Storage in Mobile App** (15 minutes to implement)
   - Install `expo-secure-store`
   - Replace AsyncStorage with SecureStore for tokens

3. **Add GPS Accuracy Validation** (20 minutes to implement)
   - Mobile app: Send GPS accuracy with sweeps
   - Backend: Reject sweeps with accuracy > 100 meters

---

### ✅ NICE TO HAVE - Do These Later:

4. **Add Request Monitoring** (1 hour to implement)
   - Set up Sentry or similar for error tracking
   - Monitor for suspicious GPS patterns
   - Alert on unusual activity

5. **Implement Photo Requirements** (2 hours to implement)
   - Require photos for all sweeps
   - Validate photo timestamps (prevent old photos)

6. **Add Admin Dashboard** (4 hours to implement)
   - View suspicious sweeps
   - Flag problematic users
   - Review GPS patterns

---

## Testing Your Security

### Manual Security Tests:

1. **Test Token Expiration:**
   ```bash
   # Get JWT token
   TOKEN="eyJhbGci..."

   # Try using it 25 hours later (should fail)
   curl -H "Authorization: Bearer $TOKEN" \
     https://www.pocket-walks.com/api/sponsorships
   ```

2. **Test GPS Validation:**
   ```bash
   # Try creating sweep far from block
   curl -X POST \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "arrival_latitude": 0,
       "arrival_longitude": 0,
       "pickup_count": 5
     }' \
     https://www.pocket-walks.com/api/sponsorships/1/sweeps

   # Should return 422 with "GPS location too far" error
   ```

3. **Test Rate Limiting:**
   ```bash
   # Try creating 501 requests in 5 minutes
   # Should get 429 after 500 requests
   ```

4. **Test Authorization:**
   ```bash
   # Try pausing another user's sponsorship
   curl -X POST \
     -H "Authorization: Bearer $OTHER_USER_TOKEN" \
     https://www.pocket-walks.com/api/sponsorships/1/pause

   # Should return 403 Forbidden
   ```

---

## Summary - Your Security Posture

### ✅ Strong (Already Implemented):

- JWT authentication
- Authorization checks
- Rate limiting
- HTTPS enforcement
- Input validation
- First-tap-wins locking
- GPS boundary validation
- Attack pattern blocking

### ⚠️ Needs Improvement:

- ❌ JWT tokens don't expire (add `exp` claim)
- ❌ No GPS accuracy validation (accept any accuracy)
- ❌ No monitoring/alerting for suspicious patterns

### ✅ You're in Good Shape!

Your API is **well-secured** for a mobile app. The main gaps are:
1. Token expiration (easy fix)
2. GPS accuracy checks (easy fix)
3. Monitoring (nice-to-have)

**Bottom Line:** Focus on securing token storage in your mobile app (use Secure Storage), add token expiration, and you'll be in excellent shape for launch.

---

## Resources

**React Native Security:**
- [OWASP Mobile Security](https://owasp.org/www-project-mobile-security/)
- [React Native Security Best Practices](https://reactnative.dev/docs/security)
- [expo-secure-store Documentation](https://docs.expo.dev/versions/latest/sdk/securestore/)

**API Security:**
- [OWASP API Security Top 10](https://owasp.org/www-project-api-security/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)

**GPS Security:**
- [Location Spoofing Detection](https://developer.android.com/training/location/location-testing)
- [iOS Location Services](https://developer.apple.com/documentation/corelocation)

---

**Questions?** Ask in the next session!
