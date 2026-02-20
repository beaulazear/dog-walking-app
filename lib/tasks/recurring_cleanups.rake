namespace :recurring_cleanups do
  desc "Generate CleanupJobs from active RecurringCleanup subscriptions"
  task generate_jobs: :environment do
    puts "🔄 Generating recurring cleanup jobs..."

    subscriptions = RecurringCleanup.needs_job_generation
    generated_count = 0
    skipped_count = 0

    subscriptions.each do |subscription|
      begin
        job = subscription.generate_next_job!

        if job.persisted?
          generated_count += 1
          puts "  ✅ Generated job for #{subscription.address} (#{subscription.frequency})"
        else
          skipped_count += 1
          puts "  ⏭️  Skipped #{subscription.address} - #{job.errors.full_messages.join(', ')}"
        end
      rescue StandardError => e
        skipped_count += 1
        puts "  ❌ Error generating job for subscription ##{subscription.id}: #{e.message}"
        Rails.logger.error("Recurring cleanup job generation failed: #{e.message}")
        Rails.logger.error(e.backtrace.first(5).join("\n"))
      end
    end

    puts "\n📊 Summary:"
    puts "   Generated: #{generated_count} jobs"
    puts "   Skipped: #{skipped_count} jobs"
    puts "   Total active subscriptions checked: #{subscriptions.count}"
    puts "\n✅ Done!"
  end

  desc "Show upcoming recurring cleanup job schedule"
  task schedule: :environment do
    puts "📅 Recurring Cleanup Schedule\n\n"

    RecurringCleanup.active.order(:next_job_date).each do |subscription|
      days_until = (subscription.next_job_date - Date.current).to_i
      status_emoji = days_until <= 0 ? "🔴" : (days_until <= 3 ? "🟡" : "🟢")

      puts "#{status_emoji} #{subscription.address}"
      puts "   Frequency: #{subscription.frequency}"
      puts "   Next job: #{subscription.next_job_date} (#{days_until} days)"
      puts "   Scooper: #{subscription.scooper&.name || 'Unassigned'}"
      puts "   Price: $#{subscription.price}"
      puts ""
    end

    puts "\n📊 Summary:"
    puts "   Total active subscriptions: #{RecurringCleanup.active.count}"
    puts "   Jobs due today or overdue: #{RecurringCleanup.needs_job_generation.count}"
  end

  desc "List all active recurring cleanups"
  task list: :environment do
    puts "📋 Active Recurring Cleanups\n\n"

    RecurringCleanup.active.includes(:poster, :scooper).each do |sub|
      puts "ID: #{sub.id}"
      puts "Address: #{sub.address}"
      puts "Poster: #{sub.poster.name} (#{sub.poster.email_address})"
      puts "Scooper: #{sub.scooper&.name || 'Unassigned'}"
      puts "Frequency: #{sub.frequency}"
      puts "Price: $#{sub.price}/month"
      puts "Next job: #{sub.next_job_date}"
      puts "Status: #{sub.status}"
      puts "Created: #{sub.created_at.strftime('%Y-%m-%d')}"
      puts "─" * 50
      puts ""
    end

    puts "\n📊 Total: #{RecurringCleanup.active.count} active subscriptions"
  end

  desc "Cancel all recurring cleanups (DANGER - USE WITH CAUTION)"
  task cancel_all: :environment do
    puts "⚠️  WARNING: This will cancel ALL active recurring cleanups!"
    puts "Are you sure? (yes/no)"

    if STDIN.gets.chomp.downcase == "yes"
      count = 0

      RecurringCleanup.active.each do |sub|
        begin
          sub.cancel!
          count += 1
          puts "  ✅ Cancelled subscription ##{sub.id} (#{sub.address})"
        rescue StandardError => e
          puts "  ❌ Failed to cancel subscription ##{sub.id}: #{e.message}"
        end
      end

      puts "\n✅ Cancelled #{count} subscriptions"
    else
      puts "❌ Cancelled operation"
    end
  end
end
