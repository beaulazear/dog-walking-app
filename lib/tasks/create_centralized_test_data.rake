# Place this file in your backend's lib/tasks/ directory
# Run with: bundle exec rake test_data:create_centralized
# IMPORTANT: This creates TEST USERS ONLY - does not modify live accounts

namespace :test_data do
  desc "Create centralized test data with test dog walker (beauscooper)"
  task create_centralized: :environment do
    puts "🚀 Creating centralized TEST data for sponsorship testing..."
    puts "="*60
    puts "⚠️  This script creates ONLY test users - will not touch beaulazear!"
    puts "="*60

    # STEP 1: Create TEST dog walker user
    dog_walker = User.find_or_create_by!(email_address: "beau@scoopersnyc.com") do |u|
      u.username = "beauscooper"
      u.name = "Beau Test Walker"
      u.password = "password123"
      u.is_scooper = true
      u.is_dog_walker = true
      u.business_name = "Beau's Test Block Service"
      u.instagram_handle = "beauscoopers"
      u.neighborhoods = [ "Park Slope", "Prospect Heights", "Carroll Gardens" ]
      u.registered_from_app = "scoopers"
      u.uses_scoopers = true
    end

    # Make sure fields are set (in case user already existed)
    dog_walker.update!(
      is_dog_walker: true,
      business_name: "Beau's Test Block Service",
      instagram_handle: "beauscoopers",
      neighborhoods: [ "Park Slope", "Prospect Heights", "Carroll Gardens" ]
    )

    puts "✅ TEST Dog Walker: #{dog_walker.username} (#{dog_walker.email_address}) - ID: #{dog_walker.id}"
    puts "   Password: password123"

    # STEP 2: Create TEST sponsor users (people posting sponsorships)
    sponsors = []

    # Sponsor 1: Test Coffee shop
    sponsor1 = User.find_or_create_by!(email_address: "sponsor1@test.com") do |u|
      u.username = "testcafe"
      u.name = "Test Coffee Shop"
      u.password = "password123"
      u.is_scooper = false
      u.registered_from_app = "scoopers"
      u.uses_scoopers = true
    end
    sponsors << sponsor1
    puts "✅ TEST Sponsor 1: #{sponsor1.name} (#{sponsor1.email_address}) - ID: #{sponsor1.id}"
    puts "   Password: password123"

    # Sponsor 2: Test Resident
    sponsor2 = User.find_or_create_by!(email_address: "sponsor2@test.com") do |u|
      u.username = "testresident"
      u.name = "Test Resident"
      u.password = "password123"
      u.is_scooper = false
      u.registered_from_app = "scoopers"
      u.uses_scoopers = true
    end
    sponsors << sponsor2
    puts "✅ TEST Sponsor 2: #{sponsor2.name} (#{sponsor2.email_address}) - ID: #{sponsor2.id}"
    puts "   Password: password123"

    puts "\n" + "="*60
    puts "CREATING TEST SPONSORSHIPS"
    puts "="*60

    # STEP 3: Delete ONLY test sponsorships (not production data!)
    test_user_ids = [ dog_walker.id, sponsor1.id, sponsor2.id ]
    old_test_sponsorships = Sponsorship.where(sponsor_id: test_user_ids)
                                       .or(Sponsorship.where(scooper_id: test_user_ids))
    old_count = old_test_sponsorships.count
    old_test_sponsorships.destroy_all
    puts "🗑️  Deleted #{old_count} old TEST sponsorships (production data safe!)"

    # Central location: Park Slope (near user's typical location)
    center_lat = 40.6728
    center_lng = -73.9765

    # STEP 4: Create OPEN test sponsorships (waiting for beauscooper to claim)
    open_sponsorships_data = [
      {
        sponsor: sponsor1,
        latitude: center_lat,
        longitude: center_lng,
        neighborhood: "Park Slope Test Block 1",
        segments: [ "NW", "NE", "SW", "SE" ],
        schedule: "weekly",
        budget: 72.00,
        display: "business",
        display_name: "Test Coffee Shop"
      },
      {
        sponsor: sponsor2,
        latitude: center_lat + 0.005, # ~0.3 miles north
        longitude: center_lng - 0.005,
        neighborhood: "Park Slope Test Block 2",
        segments: [ "NW", "NE" ],
        schedule: "biweekly",
        budget: 48.00,
        display: "first_name",
        display_name: nil
      },
      {
        sponsor: sponsor1,
        latitude: center_lat - 0.005, # ~0.3 miles south
        longitude: center_lng + 0.005,
        neighborhood: "Park Slope Test Block 3",
        segments: [ "SW", "SE" ],
        schedule: "weekly",
        budget: 56.00,
        display: "business",
        display_name: "Test Coffee Shop"
      }
    ]

    open_count = 0
    open_sponsorships_data.each_with_index do |data, index|
      lat_rounded = data[:latitude].round(4)
      lng_rounded = data[:longitude].round(4)
      block_id = "BK-#{lat_rounded}-#{lng_rounded}"

      puts "\n📅 Creating OPEN sponsorship #{index + 1}..."
      puts "   Sponsor: #{data[:sponsor].name}"
      puts "   Location: #{data[:neighborhood]} [#{lat_rounded}, #{lng_rounded}]"
      puts "   Budget: $#{data[:budget]}/month (#{data[:schedule]})"

      begin
        Sponsorship.create!(
          sponsor_id: data[:sponsor].id,
          scooper_id: nil, # OPEN - waiting for YOU to claim
          latitude: data[:latitude],
          longitude: data[:longitude],
          block_id: block_id,
          segments_selected: data[:segments],
          schedule: data[:schedule],
          monthly_budget: data[:budget],
          display_preference: data[:display],
          display_name: data[:display_name],
          status: "open",
          current_monthly_cost: data[:budget],
          total_pickups: 0,
          pickups_this_month: 0,
          contributor_count: 0
        )
        puts "   ✅ Created - Available for you to claim!"
        open_count += 1
      rescue => e
        puts "   ❌ Failed: #{e.message}"
      end
    end

    # STEP 5: Create ACTIVE test sponsorships (beauscooper already maintaining)
    active_sponsorships_data = [
      {
        sponsor: sponsor2,
        latitude: center_lat + 0.003,
        longitude: center_lng - 0.003,
        neighborhood: "Park Slope Test Active 1",
        segments: [ "NW", "NE", "SW", "SE" ],
        schedule: "weekly",
        budget: 64.00,
        display: "first_name",
        clean_since: 2.months.ago,
        sweeps_count: 8,
        pickups_total: 67
      },
      {
        sponsor: sponsor1,
        latitude: center_lat - 0.003,
        longitude: center_lng + 0.003,
        neighborhood: "Park Slope Test Active 2",
        segments: [ "NW", "NE" ],
        schedule: "biweekly",
        budget: 52.00,
        display: "business",
        display_name: "Test Coffee Shop",
        clean_since: 1.month.ago,
        sweeps_count: 4,
        pickups_total: 34
      }
    ]

    active_count = 0
    active_sponsorships_data.each_with_index do |data, index|
      lat_rounded = data[:latitude].round(4)
      lng_rounded = data[:longitude].round(4)
      block_id = "BK-#{lat_rounded}-#{lng_rounded}"

      puts "\n🟢 Creating ACTIVE sponsorship #{index + 1}..."
      puts "   Sponsor: #{data[:sponsor].name}"
      puts "   Dog Walker: #{dog_walker.name} (YOU)"
      puts "   Location: #{data[:neighborhood]}"
      puts "   Clean since: #{data[:clean_since].strftime('%B %Y')}"

      begin
        sponsorship = Sponsorship.create!(
          sponsor_id: data[:sponsor].id,
          scooper_id: dog_walker.id, # YOU are maintaining this
          latitude: data[:latitude],
          longitude: data[:longitude],
          block_id: block_id,
          segments_selected: data[:segments],
          schedule: data[:schedule],
          monthly_budget: data[:budget],
          display_preference: data[:display],
          display_name: data[:display_name],
          status: "active",
          claimed_at: data[:clean_since] + 1.day,
          started_at: data[:clean_since] + 1.day,
          current_monthly_cost: data[:budget],
          total_pickups: data[:pickups_total],
          pickups_this_month: [ data[:pickups_total] / 3, 10 ].max,
          contributor_count: 0
        )

        puts "   ✅ Created active sponsorship"

        # Create sweep history
        puts "   📋 Creating #{data[:sweeps_count]} sweeps..."
        data[:sweeps_count].times do |sweep_index|
          days_ago = (data[:sweeps_count] - sweep_index) * (data[:schedule] == "weekly" ? 7 : 14)
          completed_date = days_ago.days.ago
          pickups = rand(6..12)

          Sweep.create!(
            sponsorship_id: sponsorship.id,
            scooper_id: dog_walker.id,
            arrival_latitude: data[:latitude] + rand(-0.0003..0.0003),
            arrival_longitude: data[:longitude] + rand(-0.0003..0.0003),
            arrived_at: completed_date - 3.minutes,
            pickup_count: pickups,
            notes: "Regular #{data[:schedule]} sweep - block looking great!",
            litter_flagged: sweep_index == 1,
            status: "completed",
            completed_at: completed_date,
            payout_amount: (data[:budget] / (data[:schedule] == "weekly" ? 4 : 2)) * 0.82,
            gps_verified: true
          )
        end

        puts "   ✅ Created #{data[:sweeps_count]} sweeps"
        active_count += 1
      rescue => e
        puts "   ❌ Failed: #{e.message}"
        puts "   #{e.backtrace.first}"
      end
    end

    # STEP 6: Summary
    puts "\n" + "="*60
    puts "🎉 TEST DATA CREATED SUCCESSFULLY!"
    puts "="*60

    puts "\n📊 Summary:"
    puts "  TEST Dog Walker: #{dog_walker.name} (ID: #{dog_walker.id})"
    puts "  TEST Sponsors created: #{sponsors.length}"
    puts "  Open sponsorships: #{open_count} (available to claim)"
    puts "  Active sponsorships: #{active_count} (beauscooper maintaining)"
    puts "\n📍 All locations centered near: [#{center_lat}, #{center_lng}]"
    puts "   (Park Slope - easy to find on map)"

    puts "\n🗺️  Map Display:"
    puts "  📅 #{open_count} blue calendar pins = Open (claim as beauscooper)"
    puts "  🟢 #{active_count} green pins = Active (beauscooper maintaining)"

    puts "\n👤 TEST USER CREDENTIALS (use these for testing):"
    puts "  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    puts "  🐕 DOG WALKER (log in with this user):"
    puts "     Email: beau@scoopersnyc.com"
    puts "     Username: beauscooper"
    puts "     Password: password123"
    puts "  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    puts "  📋 Sponsor 1: sponsor1@test.com / password123"
    puts "  📋 Sponsor 2: sponsor2@test.com / password123"

    puts "\n⚠️  PRODUCTION DATA SAFE:"
    puts "  ✅ beaulazear account untouched"
    puts "  ✅ Live sponsorships preserved"
    puts "  ✅ Only test users created/modified"

    puts "\n" + "="*60
    puts "✅ Ready to test! Log in as beauscooper in mobile app."
    puts "="*60
  end
end
