# Geocoding Feature Deployment Guide

## Overview
This guide covers deploying the geocoding and map visualization feature to production, including migrating existing pet data.

---

## Pre-Deployment Checklist

### 1. Verify All Changes Are Committed
```bash
git status
git add -A
git commit -m "Add geocoding and map visualization features"
```

### Files Changed:
**Backend:**
- `db/migrate/20251109212117_add_geocoding_to_pets.rb` - New migration
- `app/services/geocoding_service.rb` - New service
- `app/services/distance_calculator.rb` - New service
- `app/models/pet.rb` - Added geocoding callbacks
- `app/serializers/pet_serializer.rb` - Added geocoding fields
- `app/controllers/distance_controller.rb` - New controller
- `config/routes.rb` - Added distance routes
- `config/application.rb` - Added services to autoload paths
- `lib/tasks/geocode.rake` - New rake tasks

**Frontend:**
- `client/package.json` - Added leaflet dependencies
- `client/src/index.js` - Added leaflet CSS import
- `client/src/components/WalksMapView.js` - New map component
- `client/src/components/TodaysWalks.js` - Added map integration

---

## Deployment Steps

### Step 1: Push Backend Changes

```bash
# Commit all changes
git add .
git commit -m "feat: Add geocoding and map visualization

- Add geocoding service with Nominatim API
- Add distance calculator with walking/biking/driving modes
- Add map view component with Leaflet
- Add rake tasks for batch geocoding
- Normalize NYC addresses automatically"

# Push to your production branch
git push origin main
```

### Step 2: Deploy Backend to Heroku/Render

**For Heroku:**
```bash
# If using Heroku
git push heroku main

# Run migration
heroku run rails db:migrate

# Check migration status
heroku run rails db:migrate:status
```

**For Render (or other platforms):**
- The migration will run automatically on deploy
- Or SSH into your server and run: `rails db:migrate RAILS_ENV=production`

### Step 3: Geocode Existing Production Data

⚠️ **IMPORTANT: Rate Limiting**
Nominatim API has a limit of 1 request per second. The rake task automatically handles this with a 1-second delay between each pet.

**Option A: Geocode all pets at once (recommended for small datasets)**
```bash
# For Heroku
heroku run rails geocode:pets

# For other platforms
rails geocode:pets RAILS_ENV=production
```

**Expected output:**
```
Found 10 pets to geocode...
Geocoding Artu (450 Clinton St, Brooklyn, NY)... ✓
Geocoding Chloe (206 Carroll St, Brooklyn, NY)... ✓
...
============================================================
Geocoding Complete!
============================================================
✓ Successfully geocoded: 8 pets
✗ Failed: 2 pets
Total with coordinates: 8
============================================================
```

**Option B: Manual/batched geocoding (for large datasets)**
```bash
# Check how many pets need geocoding first
heroku run rails geocode:stats

# If you have many pets, you can run it in batches
# The task automatically processes only un-geocoded pets
heroku run rails geocode:pets
# Wait 5 minutes, then run again for any that failed
heroku run rails geocode:retry_failed
```

### Step 4: Install Frontend Dependencies

```bash
cd client

# Install new dependencies (leaflet)
npm install

# Test build locally first
npm run build

# If build succeeds, commit the updated package-lock.json
git add package-lock.json
git commit -m "Update dependencies for map feature"
```

### Step 5: Deploy Frontend

**For GitHub Pages:**
```bash
cd client
npm run build
npm run deploy  # or however you deploy to GitHub Pages
```

**For Netlify/Vercel:**
- Push to your repo (they auto-deploy on push)
- Or trigger manual deploy from their dashboard
- Ensure build command is: `cd client && npm run build`

**For custom hosting:**
```bash
cd client
npm run build
# Upload the build/ folder to your hosting
```

### Step 6: Verify Deployment

1. **Check Migration:**
```bash
heroku run rails runner "puts Pet.column_names"
# Should include: latitude, longitude, geocoded_at, geocoding_failed, geocoding_error
```

2. **Check Geocoding:**
```bash
heroku run rails runner "Pet.where.not(latitude: nil).count"
# Should return number of successfully geocoded pets
```

3. **Check API Endpoint:**
```bash
curl https://your-api-domain.com/pets
# Should include geocoding fields in response
```

4. **Test Frontend:**
- Navigate to your production app
- Go to "Today's Walks"
- Click "Map View" button
- Verify map loads with markers for geocoded pets

---

## Post-Deployment Tasks

### Monitor Geocoding Quality

Run this to check geocoded addresses:
```bash
heroku run rails runner "
Pet.where.not(latitude: nil).each do |p|
  puts \"#{p.name}: #{p.address} -> (#{p.latitude}, #{p.longitude})\"
end
"
```

### Handle Failed Geocodes

```bash
# Check which pets failed
heroku run rails geocode:stats

# Retry failed geocodes (after fixing addresses if needed)
heroku run rails geocode:retry_failed
```

### Update Pet Addresses (if needed)

If some pets geocoded incorrectly, you can update their addresses and re-geocode:

```bash
heroku run rails runner "
pet = Pet.find_by(name: 'Moose')
pet.update(address: '262 Bond St, Brooklyn, NY')
# The after_save callback will automatically re-geocode
"
```

---

## Rollback Plan

If something goes wrong:

### Rollback Backend:
```bash
# Heroku
heroku rollback

# Manual rollback migration
heroku run rails db:rollback
```

### Rollback Frontend:
```bash
# Revert to previous commit
git revert HEAD
git push origin main
# Redeploy
```

---

## Important Notes

### Rate Limiting
- Nominatim API: 1 request/second (handled automatically)
- For large datasets (100+ pets), geocoding will take time
- Consider running geocoding during off-hours

### NYC Address Normalization
The geocoding service automatically appends "Brooklyn, NY" to addresses without city/state info. If your pets are in different boroughs, update the `normalize_nyc_address` method in `app/services/geocoding_service.rb`:

```ruby
# For Manhattan addresses:
"#{address}, Manhattan, NY"

# For Queens addresses:
"#{address}, Queens, NY"

# For mixed boroughs, skip auto-append:
return address
```

### Future: Upgrade to Paid API
If you need better reliability, consider upgrading to:
- **Mapbox** ($0.50-$2 per 1000 requests): Uncomment `geocode_with_mapbox` method
- **Google Maps** ($5 per 1000 requests): Uncomment `geocode_with_google` method

Set environment variable:
```bash
heroku config:set MAPBOX_API_KEY=your_key_here
# or
heroku config:set GOOGLE_MAPS_API_KEY=your_key_here
```

---

## Testing Commands

```bash
# Test geocoding a specific address
heroku run rails runner "
result = GeocodingService.geocode('450 Clinton St')
puts result.inspect
"

# Test distance calculation
heroku run rails runner "
pet1 = Pet.first
pet2 = Pet.second
if pet1&.geocoded? && pet2&.geocoded?
  distance = DistanceCalculator.distance_between(
    pet1.latitude, pet1.longitude,
    pet2.latitude, pet2.longitude
  )
  puts \"Distance: #{distance} miles\"
end
"

# Check today's appointments with geocoding
heroku run rails runner "
today = Date.today
Appointment.where(appointment_date: today).includes(:pet).each do |appt|
  pet = appt.pet
  geocoded = pet.geocoded? ? '✓' : '✗'
  puts \"#{geocoded} #{pet.name} - #{pet.address}\"
end
"
```

---

## Troubleshooting

### "Address not found" errors
- Check if address is valid and specific enough
- Add city/state to ambiguous addresses
- Verify Nominatim API is accessible: `curl https://nominatim.openstreetmap.org/search?q=Brooklyn&format=json`

### Map shows markers in wrong locations
- Check geocoding results: `heroku run rails geocode:stats`
- Re-geocode with corrected addresses
- Verify addresses include city/state

### Map doesn't load / shows "Invalid LatLng NaN" error
- This should be fixed with the validation in WalksMapView.js
- Check browser console for errors
- Verify pets have valid lat/lng in API response

### API rate limit errors (503)
- Wait a few minutes and retry
- Nominatim has temporary overload issues
- Consider upgrading to Mapbox/Google Maps for production

---

## Success Criteria

- ✅ Migration runs successfully
- ✅ All (or most) existing pets are geocoded
- ✅ New pets are automatically geocoded on creation/update
- ✅ Map view loads and shows markers correctly
- ✅ Markers are in correct NYC locations
- ✅ Distance calculations work for route planning

---

## Support

If you encounter issues:
1. Check logs: `heroku logs --tail`
2. Check failed geocodes: `heroku run rails geocode:stats`
3. Verify API responses include geocoding data
4. Test map locally first before troubleshooting production
