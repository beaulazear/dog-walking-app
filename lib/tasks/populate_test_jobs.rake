namespace :test_data do
  desc "Populate 25 test cleanup jobs across NYC with full MVP details"
  task populate_jobs: :environment do
    puts "🧹 Populating test cleanup jobs with MVP details..."

    # Find first user or create a test user
    user = User.first
    unless user
      puts "❌ No users found. Please create a user first."
      exit 1
    end

    puts "📍 Using poster: #{user.username} (#{user.name})"

    # NYC neighborhoods with coordinates and detailed job specs
    locations = [
      { name: "Times Square", lat: 40.7580, lng: -73.9855, price: 15.00, type: "poop", poop: "4-8", segments: [ "north", "east" ] },
      { name: "Central Park South", lat: 40.7678, lng: -73.9812, price: 20.00, type: "poop", poop: "9+", segments: [ "north", "south", "east", "west" ] },
      { name: "West Village", lat: 40.7358, lng: -74.0036, price: 18.00, type: "both", poop: "1-3", litter: "light", segments: [ "south" ] },
      { name: "East Village", lat: 40.7264, lng: -73.9818, price: 16.00, type: "poop", poop: "4-8", segments: [ "east", "west" ] },
      { name: "SoHo", lat: 40.7233, lng: -74.0030, price: 22.00, type: "litter", litter: "moderate", segments: [ "north", "west" ] },
      { name: "Chelsea", lat: 40.7465, lng: -74.0014, price: 17.00, type: "poop", poop: "1-3", segments: [ "south", "west" ] },
      { name: "Tribeca", lat: 40.7163, lng: -74.0086, price: 25.00, type: "both", poop: "9+", litter: "heavy", segments: [ "north", "south" ] },
      { name: "Upper West Side", lat: 40.7870, lng: -73.9754, price: 19.00, type: "poop", poop: "4-8", segments: [ "west" ] },
      { name: "Upper East Side", lat: 40.7736, lng: -73.9566, price: 21.00, type: "poop", poop: "9+", segments: [ "east" ] },
      { name: "Gramercy", lat: 40.7373, lng: -73.9851, price: 16.00, type: "poop", poop: "1-3", segments: [ "north" ] },
      { name: "Flatiron", lat: 40.7411, lng: -73.9897, price: 18.00, type: "litter", litter: "light", segments: [ "north", "east" ] },
      { name: "Murray Hill", lat: 40.7487, lng: -73.9755, price: 15.00, type: "poop", poop: "4-8", segments: [ "south" ] },
      { name: "Kips Bay", lat: 40.7423, lng: -73.9762, price: 14.00, type: "poop", poop: "1-3", segments: [ "east" ] },
      { name: "Hell's Kitchen", lat: 40.7638, lng: -73.9918, price: 17.00, type: "both", poop: "4-8", litter: "moderate", segments: [ "west", "north" ] },
      { name: "Midtown East", lat: 40.7549, lng: -73.9677, price: 20.00, type: "litter", litter: "heavy", segments: [ "east", "south" ] },
      { name: "Theater District", lat: 40.7590, lng: -73.9845, price: 16.00, type: "poop", poop: "1-3", segments: [ "north" ] },
      { name: "Columbus Circle", lat: 40.7681, lng: -73.9819, price: 19.00, type: "poop", poop: "9+", segments: [ "north", "west" ] },
      { name: "Lincoln Square", lat: 40.7736, lng: -73.9850, price: 18.00, type: "both", poop: "4-8", litter: "light", segments: [ "south", "west" ] },
      { name: "Battery Park City", lat: 40.7115, lng: -74.0153, price: 23.00, type: "litter", litter: "moderate", segments: [ "south", "west" ] },
      { name: "Financial District", lat: 40.7074, lng: -74.0113, price: 24.00, type: "both", poop: "9+", litter: "heavy", segments: [ "north", "south", "east" ] },
      { name: "NoHo", lat: 40.7270, lng: -73.9944, price: 17.00, type: "poop", poop: "4-8", segments: [ "north", "east" ] },
      { name: "Little Italy", lat: 40.7195, lng: -73.9976, price: 16.00, type: "litter", litter: "light", segments: [ "south" ] },
      { name: "Chinatown", lat: 40.7158, lng: -73.9970, price: 15.00, type: "poop", poop: "1-3", segments: [ "east", "west" ] },
      { name: "Lower East Side", lat: 40.7153, lng: -73.9874, price: 14.00, type: "poop", poop: "4-8", segments: [ "east" ] },
      { name: "Washington Heights", lat: 40.8513, lng: -73.9366, price: 12.00, type: "both", poop: "1-3", litter: "light", segments: [ "north" ] }
    ]

    # Clear existing test jobs
    deleted_count = CleanupJob.where(note: "Test cleanup job - auto-generated").delete_all
    puts "🗑️  Deleted #{deleted_count} existing test jobs"

    # Create 25 jobs with full MVP details
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
