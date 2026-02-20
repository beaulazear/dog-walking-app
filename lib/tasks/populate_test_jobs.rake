namespace :test_data do
  desc "Populate 32 test cleanup jobs across all NYC boroughs with full MVP details"
  task populate_jobs: :environment do
    puts "🧹 Populating test cleanup jobs across Manhattan, Brooklyn, Bronx, and Queens..."

    # Find user by email_address (beau09946@gmail.com)
    user = User.find_by(email_address: "beau09946@gmail.com")
    unless user
      puts "❌ User with email beau09946@gmail.com not found."
      puts "💡 Creating test user account..."

      user = User.create!(
        email_address: "beau09946@gmail.com",
        username: "test_poster",
        name: "Test Poster",
        password: "password123",
        password_confirmation: "password123",
        is_scooper: false,
        # Legacy dog-walking rate fields (required by validation)
        thirty: 0,
        fortyfive: 0,
        sixty: 0,
        solo_rate: 0,
        training_rate: 0,
        sibling_rate: 0
      )
      puts "✅ Created test user: #{user.email_address}"
    end

    puts "📍 Using poster: #{user.username} (#{user.email_address})"

    # NYC neighborhoods with coordinates and detailed job specs
    # Spread across all boroughs: Manhattan, Brooklyn, Bronx, Queens
    locations = [
      # MANHATTAN (8 locations)
      { name: "Times Square, Manhattan", lat: 40.7580, lng: -73.9855, price: 15.00, type: "poop", poop: "4-8", segments: [ "north", "east" ] },
      { name: "Central Park South, Manhattan", lat: 40.7678, lng: -73.9812, price: 20.00, type: "poop", poop: "9+", segments: [ "north", "south", "east", "west" ] },
      { name: "West Village, Manhattan", lat: 40.7358, lng: -74.0036, price: 18.00, type: "both", poop: "1-3", litter: "light", segments: [ "south" ] },
      { name: "East Village, Manhattan", lat: 40.7264, lng: -73.9818, price: 16.00, type: "poop", poop: "4-8", segments: [ "east", "west" ] },
      { name: "Chelsea, Manhattan", lat: 40.7465, lng: -74.0014, price: 17.00, type: "poop", poop: "1-3", segments: [ "south", "west" ] },
      { name: "Upper West Side, Manhattan", lat: 40.7870, lng: -73.9754, price: 19.00, type: "poop", poop: "4-8", segments: [ "west" ] },
      { name: "Hell's Kitchen, Manhattan", lat: 40.7638, lng: -73.9918, price: 17.00, type: "both", poop: "4-8", litter: "moderate", segments: [ "west", "north" ] },
      { name: "Financial District, Manhattan", lat: 40.7074, lng: -74.0113, price: 24.00, type: "both", poop: "9+", litter: "heavy", segments: [ "north", "south", "east" ] },

      # BROOKLYN (10 locations)
      { name: "Williamsburg, Brooklyn", lat: 40.7081, lng: -73.9571, price: 18.00, type: "litter", litter: "moderate", segments: [ "north", "east" ] },
      { name: "DUMBO, Brooklyn", lat: 40.7033, lng: -73.9888, price: 22.00, type: "both", poop: "1-3", litter: "light", segments: [ "south", "west" ] },
      { name: "Park Slope, Brooklyn", lat: 40.6710, lng: -73.9778, price: 20.00, type: "poop", poop: "9+", segments: [ "north", "south" ] },
      { name: "Brooklyn Heights, Brooklyn", lat: 40.6958, lng: -73.9936, price: 21.00, type: "litter", litter: "light", segments: [ "east" ] },
      { name: "Bushwick, Brooklyn", lat: 40.6942, lng: -73.9222, price: 14.00, type: "both", poop: "4-8", litter: "moderate", segments: [ "north", "west" ] },
      { name: "Greenpoint, Brooklyn", lat: 40.7304, lng: -73.9511, price: 16.00, type: "poop", poop: "4-8", segments: [ "south", "east" ] },
      { name: "Carroll Gardens, Brooklyn", lat: 40.6782, lng: -73.9991, price: 19.00, type: "litter", litter: "light", segments: [ "north" ] },
      { name: "Prospect Heights, Brooklyn", lat: 40.6778, lng: -73.9682, price: 17.00, type: "poop", poop: "1-3", segments: [ "east", "west" ] },
      { name: "Sunset Park, Brooklyn", lat: 40.6433, lng: -74.0092, price: 15.00, type: "both", poop: "4-8", litter: "heavy", segments: [ "south" ] },
      { name: "Bay Ridge, Brooklyn", lat: 40.6260, lng: -74.0259, price: 13.00, type: "poop", poop: "1-3", segments: [ "north", "south" ] },

      # BRONX (6 locations)
      { name: "Fordham, Bronx", lat: 40.8623, lng: -73.8985, price: 12.00, type: "poop", poop: "9+", segments: [ "north", "east" ] },
      { name: "Yankee Stadium Area, Bronx", lat: 40.8296, lng: -73.9262, price: 16.00, type: "both", poop: "4-8", litter: "moderate", segments: [ "south", "west" ] },
      { name: "Riverdale, Bronx", lat: 40.8978, lng: -73.9082, price: 20.00, type: "litter", litter: "light", segments: [ "north" ] },
      { name: "Belmont, Bronx", lat: 40.8554, lng: -73.8876, price: 14.00, type: "poop", poop: "4-8", segments: [ "east", "west" ] },
      { name: "Mott Haven, Bronx", lat: 40.8089, lng: -73.9229, price: 13.00, type: "both", poop: "1-3", litter: "heavy", segments: [ "south" ] },
      { name: "Pelham Bay, Bronx", lat: 40.8536, lng: -73.8270, price: 15.00, type: "poop", poop: "4-8", segments: [ "north", "east" ] },

      # QUEENS (8 locations)
      { name: "Astoria, Queens", lat: 40.7644, lng: -73.9235, price: 17.00, type: "litter", litter: "moderate", segments: [ "north", "south" ] },
      { name: "Long Island City, Queens", lat: 40.7447, lng: -73.9485, price: 19.00, type: "both", poop: "1-3", litter: "light", segments: [ "east", "west" ] },
      { name: "Flushing, Queens", lat: 40.7673, lng: -73.8333, price: 16.00, type: "poop", poop: "9+", segments: [ "north" ] },
      { name: "Jackson Heights, Queens", lat: 40.7557, lng: -73.8831, price: 15.00, type: "both", poop: "4-8", litter: "moderate", segments: [ "south", "east" ] },
      { name: "Sunnyside, Queens", lat: 40.7432, lng: -73.9196, price: 14.00, type: "poop", poop: "4-8", segments: [ "west" ] },
      { name: "Forest Hills, Queens", lat: 40.7185, lng: -73.8448, price: 18.00, type: "litter", litter: "light", segments: [ "north", "east" ] },
      { name: "Ridgewood, Queens", lat: 40.7003, lng: -73.9051, price: 13.00, type: "poop", poop: "1-3", segments: [ "south" ] },
      { name: "Corona, Queens", lat: 40.7446, lng: -73.8619, price: 12.00, type: "both", poop: "4-8", litter: "heavy", segments: [ "north", "west" ] }
    ]

    # Clear existing test jobs
    deleted_count = CleanupJob.where(note: "Test cleanup job - auto-generated").delete_all
    puts "🗑️  Deleted #{deleted_count} existing test jobs"

    # Create 32 jobs with full MVP details across all boroughs
    jobs_created = 0
    locations.each do |location|
      job_params = {
        poster: user,
        latitude: location[:lat],
        longitude: location[:lng],
        address: "#{location[:name]}, New York, NY",
        price: location[:price],
        note: "Test cleanup job - auto-generated",
        status: "open",
        job_expires_at: 24.hours.from_now,
        job_type: location[:type],
        segments_selected: location[:segments]
      }

      # Add itemization based on job type
      if location[:type].in?([ "poop", "both" ])
        job_params[:poop_itemization] = location[:poop]
      end

      if location[:type].in?([ "litter", "both" ])
        job_params[:litter_itemization] = location[:litter]
      end

      job = CleanupJob.create!(job_params)
      jobs_created += 1

      # Build detailed output
      type_display = location[:type] == "both" ? "🐕💩 + 🗑️" : (location[:type] == "poop" ? "🐕💩" : "🗑️")
      details = []
      details << "#{location[:poop]} piles" if location[:poop]
      details << "#{location[:litter]} litter" if location[:litter]
      segments = location[:segments].join(", ")

      puts "  ✅ ##{jobs_created}: #{location[:name]} - $#{location[:price]} #{type_display} (#{details.join(' + ')}) [#{segments}]"
    end

    puts "\n🎉 Successfully created #{jobs_created} test cleanup jobs!"
    puts "\n🏙️  Borough Distribution:"
    puts "   🗽 Manhattan: 8 jobs"
    puts "   🌉 Brooklyn: 10 jobs"
    puts "   ⚾ Bronx: 6 jobs"
    puts "   🏙️  Queens: 8 jobs"
    puts "\n📊 Job Type Breakdown:"
    puts "   🐕💩 Poop only: #{CleanupJob.poop_only.count}"
    puts "   🗑️  Litter only: #{CleanupJob.litter_only.count}"
    puts "   🐕💩 + 🗑️ Both: #{CleanupJob.both_types.count}"
    puts "\n📍 Total open jobs: #{CleanupJob.open.count}"
  end

  desc "Clear all test cleanup jobs"
  task clear_test_jobs: :environment do
    puts "🗑️  Clearing test cleanup jobs..."
    deleted_count = CleanupJob.where(note: "Test cleanup job - auto-generated").delete_all
    puts "✅ Deleted #{deleted_count} test jobs"
  end
end
