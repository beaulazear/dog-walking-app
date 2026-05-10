namespace :appointments do
  desc "Fix recurring flag for appointments based on day-of-week flags"
  task fix_recurring: :environment do
    puts "🔧 Fixing recurring appointment flags..."
    puts "=" * 50

    updated_count = 0
    one_time_count = 0
    already_correct = 0

    Appointment.find_each do |apt|
      # Check if any day-of-week flags are set
      has_days = apt.monday || apt.tuesday || apt.wednesday || apt.thursday ||
                 apt.friday || apt.saturday || apt.sunday

      if has_days && !apt.recurring
        # Should be recurring but isn't marked
        apt.update_column(:recurring, true)
        puts "✓ Marked as RECURRING: #{apt.pet.name} - #{apt.id}"
        updated_count += 1
      elsif !has_days && apt.recurring
        # Shouldn't be recurring but is marked (one-time appointment)
        apt.update_column(:recurring, false)
        puts "✓ Marked as ONE-TIME: #{apt.pet.name} - #{apt.id}"
        one_time_count += 1
      else
        already_correct += 1
      end
    end

    puts "=" * 50
    puts "✅ Complete!"
    puts "   Marked as recurring: #{updated_count}"
    puts "   Marked as one-time: #{one_time_count}"
    puts "   Already correct: #{already_correct}"
    puts "   Total processed: #{Appointment.count}"
  end

  desc "Preview which appointments would be changed (dry run)"
  task preview_recurring_fix: :environment do
    puts "👀 PREVIEW MODE - No changes will be made"
    puts "=" * 50

    to_mark_recurring = []
    to_mark_onetime = []

    Appointment.includes(:pet).find_each do |apt|
      has_days = apt.monday || apt.tuesday || apt.wednesday || apt.thursday ||
                 apt.friday || apt.saturday || apt.sunday

      if has_days && !apt.recurring
        to_mark_recurring << apt
      elsif !has_days && apt.recurring
        to_mark_onetime << apt
      end
    end

    if to_mark_recurring.any?
      puts "\n📅 Would mark as RECURRING (#{to_mark_recurring.count}):"
      to_mark_recurring.first(10).each do |apt|
        days = []
        days << "Mon" if apt.monday
        days << "Tue" if apt.tuesday
        days << "Wed" if apt.wednesday
        days << "Thu" if apt.thursday
        days << "Fri" if apt.friday
        days << "Sat" if apt.saturday
        days << "Sun" if apt.sunday
        puts "   - #{apt.pet.name} (ID: #{apt.id}) - Days: #{days.join(', ')}"
      end
      puts "   ... and #{to_mark_recurring.count - 10} more" if to_mark_recurring.count > 10
    end

    if to_mark_onetime.any?
      puts "\n📆 Would mark as ONE-TIME (#{to_mark_onetime.count}):"
      to_mark_onetime.first(10).each do |apt|
        puts "   - #{apt.pet.name} (ID: #{apt.id}) - Date: #{apt.appointment_date}"
      end
      puts "   ... and #{to_mark_onetime.count - 10} more" if to_mark_onetime.count > 10
    end

    puts "\n" + "=" * 50
    puts "Total changes needed: #{to_mark_recurring.count + to_mark_onetime.count}"
    puts "\nTo apply these changes, run:"
    puts "  rails appointments:fix_recurring"
  end
end
