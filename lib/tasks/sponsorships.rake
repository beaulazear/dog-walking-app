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
