namespace :cleanup do
  desc 'Remove cancellations for dates that have already passed'
  task cancellations: :environment do
    # Find cancellations where the date is in the past
    old_cancellations = Cancellation.where('date < ?', Date.today)
    count = old_cancellations.count

    puts "Found #{count} old cancellation(s) to remove..."

    if count.zero?
      puts 'No cleanup needed - all cancellations are for future dates.'
    else
      deleted = old_cancellations.delete_all

      puts '=' * 60
      puts 'Cleanup Complete!'
      puts '=' * 60
      puts "✓ Removed #{deleted} old cancellation(s)"
      puts "Remaining cancellations: #{Cancellation.count}"
      puts '=' * 60
    end
  end

  desc 'Show cancellation statistics'
  task stats: :environment do
    total = Cancellation.count
    past = Cancellation.where('date < ?', Date.today).count
    future = Cancellation.where('date >= ?', Date.today).count

    puts '=' * 60
    puts 'Cancellation Statistics'
    puts '=' * 60
    puts "Total cancellations: #{total}"
    puts "Past dates (can be cleaned): #{past}"
    puts "Future dates (active): #{future}"
    puts '=' * 60

    if past.positive?
      puts "\nOldest cancellations:"
      Cancellation.where('date < ?', Date.today)
                  .order(:date)
                  .limit(5)
                  .each do |c|
        puts "  - #{c.date.strftime('%b %d, %Y')} (Appointment ##{c.appointment_id})"
      end
      puts "  ... and #{past - 5} more" if past > 5
    end
  end
end
