namespace :test_data do
  desc "Populate 25 test cleanup jobs across NYC"
  task populate_jobs: :environment do
    puts "🧹 Populating test cleanup jobs..."

    # Find first user or create a test user
    user = User.first
    unless user
      puts "❌ No users found. Please create a user first."
      exit 1
    end

    puts "📍 Using poster: #{user.username} (#{user.name})"

    # NYC neighborhoods with coordinates
    locations = [
      { name: "Times Square", lat: 40.7580, lng: -73.9855, price: 15.00 },
      { name: "Central Park South", lat: 40.7678, lng: -73.9812, price: 20.00 },
      { name: "West Village", lat: 40.7358, lng: -74.0036, price: 18.00 },
      { name: "East Village", lat: 40.7264, lng: -73.9818, price: 16.00 },
      { name: "SoHo", lat: 40.7233, lng: -74.0030, price: 22.00 },
      { name: "Chelsea", lat: 40.7465, lng: -74.0014, price: 17.00 },
      { name: "Tribeca", lat: 40.7163, lng: -74.0086, price: 25.00 },
      { name: "Upper West Side", lat: 40.7870, lng: -73.9754, price: 19.00 },
      { name: "Upper East Side", lat: 40.7736, lng: -73.9566, price: 21.00 },
      { name: "Gramercy", lat: 40.7373, lng: -73.9851, price: 16.00 },
      { name: "Flatiron", lat: 40.7411, lng: -73.9897, price: 18.00 },
      { name: "Murray Hill", lat: 40.7487, lng: -73.9755, price: 15.00 },
      { name: "Kips Bay", lat: 40.7423, lng: -73.9762, price: 14.00 },
      { name: "Hell's Kitchen", lat: 40.7638, lng: -73.9918, price: 17.00 },
      { name: "Midtown East", lat: 40.7549, lng: -73.9677, price: 20.00 },
      { name: "Theater District", lat: 40.7590, lng: -73.9845, price: 16.00 },
      { name: "Columbus Circle", lat: 40.7681, lng: -73.9819, price: 19.00 },
      { name: "Lincoln Square", lat: 40.7736, lng: -73.9850, price: 18.00 },
      { name: "Battery Park City", lat: 40.7115, lng: -74.0153, price: 23.00 },
      { name: "Financial District", lat: 40.7074, lng: -74.0113, price: 24.00 },
      { name: "NoHo", lat: 40.7270, lng: -73.9944, price: 17.00 },
      { name: "Little Italy", lat: 40.7195, lng: -73.9976, price: 16.00 },
      { name: "Chinatown", lat: 40.7158, lng: -73.9970, price: 15.00 },
      { name: "Lower East Side", lat: 40.7153, lng: -73.9874, price: 14.00 },
      { name: "Washington Heights", lat: 40.8513, lng: -73.9366, price: 12.00 }
    ]

    # Clear existing test jobs
    deleted_count = CleanupJob.where(note: "Test cleanup job - auto-generated").delete_all
    puts "🗑️  Deleted #{deleted_count} existing test jobs"

    # Create 25 jobs
    jobs_created = 0
    locations.each do |location|
      job = CleanupJob.create!(
        poster: user,
        latitude: location[:lat],
        longitude: location[:lng],
        address: "#{location[:name]}, New York, NY",
        price: location[:price],
        note: "Test cleanup job - auto-generated",
        status: "open",
        job_expires_at: 24.hours.from_now
      )
      jobs_created += 1
      puts "  ✅ Created job ##{jobs_created}: #{location[:name]} - $#{location[:price]}"
    end

    puts "\n🎉 Successfully created #{jobs_created} test cleanup jobs!"
    puts "📊 Total open jobs: #{CleanupJob.open.count}"
  end

  desc "Clear all test cleanup jobs"
  task clear_test_jobs: :environment do
    puts "🗑️  Clearing test cleanup jobs..."
    deleted_count = CleanupJob.where(note: "Test cleanup job - auto-generated").delete_all
    puts "✅ Deleted #{deleted_count} test jobs"
  end
end
