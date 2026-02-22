namespace :test_data do
  desc "Create test sponsorships with various states across Brooklyn"
  task create_sponsorships: :environment do
    puts "🏘️  Creating test sponsorships across Brooklyn neighborhoods..."

    # Find or create test sponsor
    sponsor = User.find_by(email_address: "beau09946@gmail.com")
    unless sponsor
      puts "❌ Sponsor user not found. Creating test sponsor..."
      sponsor = User.create!(
        email_address: "beau09946@gmail.com",
        username: "test_sponsor",
        name: "Beau Lazear",
        password: "password123",
        password_confirmation: "password123",
        is_poster: true,
        thirty: 0, fortyfive: 0, sixty: 0,
        solo_rate: 0, training_rate: 0, sibling_rate: 0
      )
      puts "✅ Created sponsor: #{sponsor.email_address}"
    end

    # Update sponsor to be a poster
    sponsor.update!(is_poster: true) unless sponsor.is_poster

    # Find or create test dog walkers
    scoopers = []
    [
      { email: "walker1@test.com", name: "Sarah Chen", instagram: "@sarahwalksnyc", business: "Sarah's Scoop Squad" },
      { email: "walker2@test.com", name: "Mike Rodriguez", instagram: "@mikesthepickup", business: "Mike's Clean Streets" },
      { email: "walker3@test.com", name: "Lisa Park", instagram: "@lisascleanbk", business: nil }
    ].each do |walker_data|
      walker = User.find_by(email_address: walker_data[:email])
      unless walker
        walker = User.create!(
          email_address: walker_data[:email],
          username: walker_data[:email].split("@").first,
          name: walker_data[:name],
          password: "password123",
          password_confirmation: "password123",
          is_dog_walker: true,
          instagram_handle: walker_data[:instagram],
          business_name: walker_data[:business],
          neighborhoods: ["Park Slope", "Prospect Heights", "Windsor Terrace"],
          overall_rating: rand(4.5..5.0).round(2),
          total_pickups: rand(50..200),
          thirty: 0, fortyfive: 0, sixty: 0,
          solo_rate: 0, training_rate: 0, sibling_rate: 0
        )
        puts "  ✅ Created dog walker: #{walker.name}"
      else
        walker.update!(is_dog_walker: true) unless walker.is_dog_walker
      end
      scoopers << walker
    end

    # Brooklyn neighborhoods with coordinates
    locations = [
      # Park Slope
      { name: "Park Slope - 7th Ave & 9th St", lat: 40.6710, lng: -73.9778, schedule: "weekly", budget: 48.00, status: :open },
      { name: "Park Slope - 5th Ave & Carroll St", lat: 40.6732, lng: -73.9812, schedule: "weekly", budget: 48.00, status: :claimed },
      { name: "Park Slope - Prospect Park West", lat: 40.6625, lng: -73.9799, schedule: "biweekly", budget: 24.00, status: :active },

      # Prospect Heights
      { name: "Prospect Heights - Vanderbilt Ave", lat: 40.6778, lng: -73.9682, schedule: "weekly", budget: 48.00, status: :active },
      { name: "Prospect Heights - Washington Ave", lat: 40.6756, lng: -73.9665, schedule: "weekly", budget: 60.00, status: :active },

      # Windsor Terrace
      { name: "Windsor Terrace - Prospect Ave", lat: 40.6543, lng: -73.9782, schedule: "biweekly", budget: 30.00, status: :open },

      # Carroll Gardens
      { name: "Carroll Gardens - Court St", lat: 40.6782, lng: -73.9991, schedule: "weekly", budget: 48.00, status: :paused },

      # Cobble Hill
      { name: "Cobble Hill - Clinton St", lat: 40.6862, lng: -73.9960, schedule: "weekly", budget: 48.00, status: :active },

      # Brooklyn Heights
      { name: "Brooklyn Heights - Montague St", lat: 40.6958, lng: -73.9936, schedule: "weekly", budget: 72.00, status: :active },

      # Williamsburg
      { name: "Williamsburg - Bedford Ave", lat: 40.7081, lng: -73.9571, schedule: "weekly", budget: 48.00, status: :open }
    ]

    # Clear existing test sponsorships
    deleted = Sponsorship.where("block_id LIKE ?", "BK-%").delete_all
    puts "🗑️  Deleted #{deleted} existing test sponsorships\n"

    created_count = 0
    locations.each_with_index do |location, index|
      # Generate block_id
      block_id = "BK-#{location[:lat].round(4)}-#{location[:lng].round(4)}"

      sponsorship_params = {
        sponsor: sponsor,
        latitude: location[:lat],
        longitude: location[:lng],
        block_id: block_id,
        segments_selected: ["NW", "NE", "SW", "SE"],
        schedule: location[:schedule],
        monthly_budget: location[:budget],
        display_preference: index.even? ? "anonymous" : "first_name",
        display_name: index.even? ? nil : "Beau L.",
        status: "open"
      }

      sponsorship = Sponsorship.create!(sponsorship_params)

      # Update status based on location config
      case location[:status]
      when :claimed
        scooper = scoopers.sample
        sponsorship.claim!(scooper)
        puts "  ✅ #{location[:name]} - #{location[:schedule]} ($#{location[:budget]}/mo) - CLAIMED by #{scooper.name}"

      when :active
        scooper = scoopers.sample
        sponsorship.claim!(scooper)
        sponsorship.update!(
          status: "active",
          started_at: rand(1..30).days.ago
        )

        # Create some completed sweeps
        sweep_count = rand(2..8)
        sweep_count.times do |i|
          Sweep.create!(
            sponsorship: sponsorship,
            scooper: scooper,
            scheduled_date: (sweep_count - i).weeks.ago.to_date,
            completed_at: (sweep_count - i).weeks.ago + rand(0..2).hours,
            arrival_latitude: location[:lat] + rand(-0.0005..0.0005),
            arrival_longitude: location[:lng] + rand(-0.0005..0.0005),
            gps_verified: true,
            pickup_count: rand(3..12),
            payout_amount: (location[:budget] / (location[:schedule] == "weekly" ? 4 : 2) * 0.82).round(2),
            status: "completed"
          )
        end

        # Update sponsorship stats
        sponsorship.update!(
          total_pickups: sweep_count * rand(3..12),
          pickups_this_month: rand(0..sweep_count)
        )

        # Maybe add a contribution from a neighbor
        if rand < 0.3  # 30% chance
          Contribution.create!(
            sponsorship: sponsorship,
            contributor_email: "neighbor#{rand(100)}@example.com",
            contributor_name: "Neighbor #{rand(100)}",
            monthly_amount: [5, 10, 15, 20].sample,
            status: "active",
            stripe_subscription_id: "sub_test_#{SecureRandom.hex(8)}"
          )
        end

        # Maybe add a rating
        if rand < 0.4 && sponsorship.sweeps.any?  # 40% chance
          SponsorshipRating.create!(
            sponsorship: sponsorship,
            month: 1.month.ago.beginning_of_month.to_date,
            quality_rating: rand(4..5),
            thoroughness_rating: rand(4..5),
            timeliness_rating: rand(3..5),
            communication_rating: rand(4..5),
            notes: ["Great job!", "Very thorough", "Always on time", nil].sample
          )
        end

        puts "  ✅ #{location[:name]} - #{location[:schedule]} ($#{location[:budget]}/mo) - ACTIVE with #{sweep_count} sweeps by #{scooper.name}"

      when :paused
        scooper = scoopers.sample
        sponsorship.claim!(scooper)
        sponsorship.update!(status: "active", started_at: 20.days.ago)
        sponsorship.pause!
        puts "  ✅ #{location[:name]} - #{location[:schedule]} ($#{location[:budget]}/mo) - PAUSED"

      else  # open
        puts "  ✅ #{location[:name]} - #{location[:schedule]} ($#{location[:budget]}/mo) - OPEN"
      end

      created_count += 1
    end

    puts "\n🎉 Successfully created #{created_count} test sponsorships!"
    puts "\n📊 Status Breakdown:"
    puts "   🟢 Open: #{Sponsorship.open.count}"
    puts "   🟡 Claimed: #{Sponsorship.claimed.count}"
    puts "   ✅ Active: #{Sponsorship.active.count}"
    puts "   ⏸️  Paused: #{Sponsorship.paused.count}"
    puts "\n📅 Schedule Breakdown:"
    puts "   📆 Weekly: #{Sponsorship.where(schedule: 'weekly').count}"
    puts "   📆 Biweekly: #{Sponsorship.where(schedule: 'biweekly').count}"
    puts "\n🧹 Total sweeps completed: #{Sweep.count}"
    puts "💰 Total contributions: #{Contribution.active.count}"
    puts "⭐ Total ratings: #{SponsorshipRating.count}"
  end

  desc "Clear all test sponsorships"
  task clear_sponsorships: :environment do
    puts "🗑️  Clearing test sponsorships..."

    # Delete related records first
    Sweep.joins(:sponsorship).where("sponsorships.block_id LIKE ?", "BK-%").delete_all
    Contribution.joins(:sponsorship).where("sponsorships.block_id LIKE ?", "BK-%").delete_all
    SponsorshipRating.joins(:sponsorship).where("sponsorships.block_id LIKE ?", "BK-%").delete_all

    deleted_count = Sponsorship.where("block_id LIKE ?", "BK-%").delete_all
    puts "✅ Deleted #{deleted_count} test sponsorships and related data"
  end
end

namespace :sponsorships do
  desc "Reset monthly pickup counters for all active sponsorships (run on 1st of each month)"
  task reset_monthly_stats: :environment do
    puts "Resetting monthly pickup counters..."

    # Reset sponsorships
    reset_count = Sponsorship.active.update_all(pickups_this_month: 0)
    puts "  ✓ Reset #{reset_count} active sponsorships"

    # Reset blocks
    block_count = Block.update_all(this_week_pickups: 0, current_month_pickups: 0)
    puts "  ✓ Reset #{block_count} blocks"

    puts "Monthly stats reset complete!"
  end

  desc "Send monthly rating reminders to sponsors (run on 1st of each month)"
  task send_rating_reminders: :environment do
    puts "Sending monthly rating reminders..."

    # Find all active sponsorships that haven't been rated for last month
    last_month = 1.month.ago.beginning_of_month.to_date

    Sponsorship.active.find_each do |sponsorship|
      # Check if sponsor already rated last month
      already_rated = sponsorship.sponsorship_ratings.exists?(month: last_month)

      unless already_rated
        # TODO: Send push notification to sponsor
        puts "  → Would send reminder to sponsor ##{sponsorship.sponsor_id} for sponsorship ##{sponsorship.id}"
        # PushNotificationService.send_rating_reminder(sponsorship)
      end
    end

    puts "Rating reminders sent!"
  end

  desc "Calculate and update overall ratings for all scoopers"
  task update_scooper_ratings: :environment do
    puts "Updating scooper overall ratings..."

    User.where(is_scooper: true).find_each do |scooper|
      old_rating = scooper.overall_rating
      scooper.update_overall_rating!
      new_rating = scooper.overall_rating

      if old_rating != new_rating
        puts "  ✓ Scooper ##{scooper.id} (#{scooper.name}): #{old_rating} → #{new_rating}"
      end
    end

    puts "Scooper ratings updated!"
  end
end
