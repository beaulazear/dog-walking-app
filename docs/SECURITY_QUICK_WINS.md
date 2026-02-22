# Security Quick Wins - Implementation Guide
**Time to Implement:** 1-2 hours total

---

## Good News First! ✅

### Already Implemented (Strong Security):
- ✅ **JWT tokens expire** (24 hours) - I found this in `json_web_token.rb`!
- ✅ **Authorization checks** - Only owners can modify their sponsorships
- ✅ **Rate limiting** - 300 req/5min per IP, 500 req/5min per user
- ✅ **HTTPS enforcement** - Production uses SSL
- ✅ **GPS boundary validation** - 150m tolerance
- ✅ **First-tap-wins locking** - Database locks prevent race conditions
- ✅ **Attack blocking** - SQL injection, bad bots, file scanners

**Your API security is excellent!** The remaining items are mobile app implementation details and nice-to-haves.

---

## Critical Item #1: Secure Token Storage in Mobile App

**Time:** 15 minutes
**Priority:** CRITICAL

### Install Package:
```bash
cd mobile-app
expo install expo-secure-store
```

### Implementation:

**Create auth utility file:**
```javascript
// utils/auth.js
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'jwt_token';

export const AuthStorage = {
  // Save token securely
  async saveToken(token) {
    try {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
      return true;
    } catch (error) {
      console.error('Error saving token:', error);
      return false;
    }
  },

  // Get token
  async getToken() {
    try {
      return await SecureStore.getItemAsync(TOKEN_KEY);
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  },

  // Delete token (logout)
  async deleteToken() {
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      return true;
    } catch (error) {
      console.error('Error deleting token:', error);
      return false;
    }
  }
};
```

**Usage in Login:**
```javascript
// screens/LoginScreen.js
import { AuthStorage } from '../utils/auth';

const handleLogin = async (email, password) => {
  try {
    const response = await fetch('https://www.pocket-walks.com/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email_address: email, password })
    });

    const data = await response.json();

    if (response.ok && data.token) {
      // ✅ SECURE - Store in Keychain/Keystore
      await AuthStorage.saveToken(data.token);

      navigation.navigate('Home');
    } else {
      alert(data.error || 'Login failed');
    }
  } catch (error) {
    alert('Network error');
  }
};
```

**Usage in API calls:**
```javascript
// utils/api.js
import { AuthStorage } from './auth';

export const makeAuthRequest = async (url, options = {}) => {
  const token = await AuthStorage.getToken();

  if (!token) {
    // Redirect to login if no token
    return { error: 'Not authenticated' };
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    // Handle expired tokens
    if (response.status === 401) {
      await AuthStorage.deleteToken();
      // Navigate to login (pass navigation object)
      return { error: 'Session expired', expired: true };
    }

    if (!response.ok) {
      const error = await response.json();
      return { error: error.error || 'Request failed' };
    }

    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    return { error: error.message };
  }
};
```

**Usage in Logout:**
```javascript
// screens/ProfileScreen.js
import { AuthStorage } from '../utils/auth';

const handleLogout = async () => {
  await AuthStorage.deleteToken();
  navigation.navigate('Login');
};
```

**Why This Matters:**
- ❌ **AsyncStorage** (what many tutorials use) - Not encrypted, can be read by malware
- ✅ **SecureStore** - Uses iOS Keychain / Android Keystore, hardware-encrypted

---

## Critical Item #2: GPS Accuracy Validation

**Time:** 20 minutes
**Priority:** HIGH (prevents low-accuracy GPS spoofing)

### Backend - Add Validation:

**Add column to sweeps:**
```bash
rails generate migration AddGpsAccuracyToSweeps gps_accuracy:decimal
```

**Edit migration:**
```ruby
class AddGpsAccuracyToSweeps < ActiveRecord::Migration[7.2]
  def change
    add_column :sweeps, :gps_accuracy, :decimal, precision: 8, scale: 2
  end
end
```

**Run migration:**
```bash
rails db:migrate
```

**Update Sweep model:**
```ruby
# app/models/sweep.rb
class Sweep < ApplicationRecord
  # ... existing code ...

  # Add validation
  validates :gps_accuracy,
    numericality: { less_than_or_equal_to: 100 },
    allow_nil: true

  # Add to validation callback
  def gps_within_block_boundaries
    return if arrival_latitude.blank? || arrival_longitude.blank?

    # Check accuracy first
    if gps_accuracy && gps_accuracy > 100
      errors.add(:base, "GPS accuracy too low (#{gps_accuracy}m). Please wait for better signal.")
      self.gps_verified = false
      return
    end

    # Existing boundary check
    lat_diff = (arrival_latitude - sponsorship.latitude).abs
    lng_diff = (arrival_longitude - sponsorship.longitude).abs
    max_tolerance = 0.0015

    if lat_diff > max_tolerance || lng_diff > max_tolerance
      errors.add(:base, "GPS location is too far from the sponsored block")
      self.gps_verified = false
    else
      self.gps_verified = true
    end
  end
end
```

**Update Sweeps controller:**
```ruby
# app/controllers/api/sweeps_controller.rb
def create
  sweep_params = params.permit(
    :arrival_latitude,
    :arrival_longitude,
    :pickup_count,
    :notes,
    :litter_flagged,
    :gps_accuracy  # ← Add this
  )

  sweep = @sponsorship.sweeps.build(sweep_params)
  sweep.scooper = current_user
  sweep.status = 'completed'
  sweep.completed_at = Time.current

  if sweep.save
    render json: { sweep: sweep_json(sweep) }, status: :created
  else
    render json: { errors: sweep.errors.full_messages }, status: :unprocessable_entity
  end
end
```

### Mobile App - Send Accuracy:

**Get location with accuracy:**
```javascript
// screens/LogSweepScreen.js
import * as Location from 'expo-location';

const handleLogSweep = async () => {
  // Request permission
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    alert('Permission to access location was denied');
    return;
  }

  // Get high-accuracy location
  const location = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.High  // Use GPS, not cell towers
  });

  // Check accuracy before proceeding
  if (location.coords.accuracy > 50) {
    alert(`GPS accuracy is ${Math.round(location.coords.accuracy)}m. Please wait for better signal (need < 50m).`);
    return;
  }

  // Submit sweep with accuracy
  const result = await makeAuthRequest(
    `https://www.pocket-walks.com/api/sponsorships/${sponsorshipId}/sweeps`,
    {
      method: 'POST',
      body: JSON.stringify({
        arrival_latitude: location.coords.latitude,
        arrival_longitude: location.coords.longitude,
        gps_accuracy: location.coords.accuracy,  // ← Send accuracy
        pickup_count: pickupCount,
        notes: notes
      })
    }
  );

  if (result.error) {
    alert(result.error);
  } else {
    alert('Sweep logged successfully!');
    navigation.goBack();
  }
};
```

**Show accuracy to user:**
```javascript
// Display GPS accuracy status
const [gpsAccuracy, setGpsAccuracy] = useState(null);
const [gpsStatus, setGpsStatus] = useState('checking');

useEffect(() => {
  const checkGPS = async () => {
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High
    });

    setGpsAccuracy(location.coords.accuracy);

    if (location.coords.accuracy <= 20) {
      setGpsStatus('excellent');
    } else if (location.coords.accuracy <= 50) {
      setGpsStatus('good');
    } else if (location.coords.accuracy <= 100) {
      setGpsStatus('fair');
    } else {
      setGpsStatus('poor');
    }
  };

  checkGPS();
}, []);

// In your JSX
<View>
  <Text>GPS Accuracy: {Math.round(gpsAccuracy)}m</Text>
  <Text style={{ color: gpsStatus === 'excellent' ? 'green' : 'orange' }}>
    Status: {gpsStatus.toUpperCase()}
  </Text>
  {gpsStatus === 'poor' && (
    <Text style={{ color: 'red' }}>
      Wait for better signal before logging sweep
    </Text>
  )}
</View>
```

**Why This Matters:**
- Low-accuracy GPS (cell tower triangulation) can be 100-1000m off
- GPS spoofers often provide perfect coordinates with poor accuracy
- Requiring high accuracy makes spoofing harder

---

## Nice-to-Have #1: Suspicious Activity Monitoring

**Time:** 30 minutes
**Priority:** MEDIUM (helps detect abuse)

### Add Monitoring Module:

```ruby
# app/controllers/concerns/security_monitoring.rb
module SecurityMonitoring
  extend ActiveSupport::Concern

  def detect_suspicious_sweep(sweep, user)
    warnings = []

    # Check 1: Too many sweeps in short time
    recent_sweeps = user.sweeps
      .where('completed_at > ?', 1.hour.ago)
      .count

    if recent_sweeps > 10
      warnings << "Rapid sweep logging: #{recent_sweeps} sweeps in 1 hour"
    end

    # Check 2: Perfect GPS coordinates (suspicious)
    if sweep.arrival_latitude == sweep.sponsorship.latitude &&
       sweep.arrival_longitude == sweep.sponsorship.longitude
      warnings << "Perfect GPS match (possible spoofing)"
    end

    # Check 3: Suspiciously high accuracy (fake GPS apps often report 0m)
    if sweep.gps_accuracy && sweep.gps_accuracy < 5
      warnings << "Suspiciously high GPS accuracy: #{sweep.gps_accuracy}m"
    end

    # Check 4: Low accuracy (cell tower, not GPS)
    if sweep.gps_accuracy && sweep.gps_accuracy > 100
      warnings << "Low GPS accuracy: #{sweep.gps_accuracy}m"
    end

    # Log if suspicious
    if warnings.any?
      Rails.logger.warn "[SECURITY] Suspicious sweep detected:"
      Rails.logger.warn "  User: #{user.id} (#{user.email_address})"
      Rails.logger.warn "  Sweep: #{sweep.id}"
      Rails.logger.warn "  Warnings: #{warnings.join(', ')}"

      # In production, send to monitoring service
      # Sentry.capture_message("Suspicious sweep", extra: {
      #   user_id: user.id,
      #   sweep_id: sweep.id,
      #   warnings: warnings
      # })
    end

    warnings
  end
end
```

**Use in Sweeps controller:**
```ruby
# app/controllers/api/sweeps_controller.rb
class Api::SweepsController < ApplicationController
  include SecurityMonitoring

  def create
    # ... existing sweep creation code ...

    if sweep.save
      # Check for suspicious activity
      warnings = detect_suspicious_sweep(sweep, current_user)

      # Return warnings to app (for debugging in development)
      response = { sweep: sweep_json(sweep) }
      response[:warnings] = warnings if warnings.any? && Rails.env.development?

      render json: response, status: :created
    else
      render json: { errors: sweep.errors.full_messages }, status: :unprocessable_entity
    end
  end
end
```

**Why This Matters:**
- Helps detect patterns of abuse
- Logs for later review
- Can alert you to systematic problems

---

## Nice-to-Have #2: Add Admin Dashboard Endpoint

**Time:** 20 minutes
**Priority:** LOW (useful for monitoring)

### Create Admin Controller:

```ruby
# app/controllers/admin_controller.rb
class AdminController < ApplicationController
  before_action :admin_only

  def suspicious_sweeps
    # Find sweeps with perfect GPS (suspicious)
    perfect_gps = Sweep.joins(:sponsorship)
      .where('sweeps.arrival_latitude = sponsorships.latitude')
      .where('sweeps.arrival_longitude = sponsorships.longitude')
      .includes(:scooper, :sponsorship)
      .order(created_at: :desc)
      .limit(50)

    # Find users with rapid sweep logging
    rapid_users = User.joins(:sweeps)
      .where('sweeps.completed_at > ?', 1.day.ago)
      .group('users.id', 'users.email_address', 'users.name')
      .having('COUNT(sweeps.id) > 20')
      .select('users.id, users.email_address, users.name, COUNT(sweeps.id) as sweep_count')

    render json: {
      perfect_gps_sweeps: perfect_gps.map { |s| sweep_summary(s) },
      rapid_sweep_users: rapid_users.map { |u| user_summary(u) }
    }
  end

  private

  def sweep_summary(sweep)
    {
      id: sweep.id,
      scooper: sweep.scooper.email_address,
      sponsorship_id: sweep.sponsorship.id,
      latitude: sweep.arrival_latitude,
      longitude: sweep.arrival_longitude,
      accuracy: sweep.gps_accuracy,
      completed_at: sweep.completed_at
    }
  end

  def user_summary(user)
    {
      id: user.id,
      email: user.email_address,
      name: user.name,
      sweep_count: user.sweep_count
    }
  end
end
```

**Add route:**
```ruby
# config/routes.rb
get "/admin/suspicious_sweeps", to: "admin#suspicious_sweeps"
```

**Test it:**
```bash
# As admin user
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  https://www.pocket-walks.com/admin/suspicious_sweeps
```

---

## Summary - Priority Order

### Do These First (CRITICAL):
1. ✅ **JWT Expiration** - Already done!
2. ⚠️ **Secure Token Storage** - 15 min - Use SecureStore in mobile app
3. ⚠️ **GPS Accuracy Validation** - 20 min - Reject low-accuracy GPS

### Do These Later (NICE-TO-HAVE):
4. **Suspicious Activity Monitoring** - 30 min - Detect abuse patterns
5. **Admin Dashboard** - 20 min - View suspicious activity

### Don't Need To Do:
- ✅ Rate limiting (already implemented)
- ✅ Authorization checks (already implemented)
- ✅ HTTPS enforcement (already implemented)
- ✅ GPS boundary validation (already implemented)

---

## Testing Checklist

After implementing, test:

- [ ] Store token in SecureStore on login
- [ ] Token retrieved from SecureStore on API calls
- [ ] Token deleted from SecureStore on logout
- [ ] GPS accuracy shown to user
- [ ] Sweeps rejected if accuracy > 100m
- [ ] 401 errors handled (redirect to login)
- [ ] Network errors handled gracefully

---

## Questions?

Ask in the next session! Your security foundation is **excellent** - these are just polish items.
