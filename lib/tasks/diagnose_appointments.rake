namespace :appointments do
  desc "Diagnose appointment data"
  task diagnose: :environment do
    puts "🔍 APPOINTMENT DIAGNOSIS"
    puts "=" * 60

    total = Appointment.count
    recurring_true = Appointment.where(recurring: true).count
    recurring_false = Appointment.where(recurring: false).count
    recurring_nil = Appointment.where(recurring: nil).count

    puts "\n📊 OVERALL STATS:"
    puts "   Total appointments: #{total}"
    puts "   recurring = true: #{recurring_true}"
    puts "   recurring = false: #{recurring_false}"
    puts "   recurring = nil: #{recurring_nil}"

    # Find appointments marked as recurring
    recurring_with_days = Appointment.where(recurring: true).select do |apt|
      apt.monday || apt.tuesday || apt.wednesday || apt.thursday ||
      apt.friday || apt.saturday || apt.sunday
    end

    recurring_without_days = Appointment.where(recurring: true).reject do |apt|
      apt.monday || apt.tuesday || apt.wednesday || apt.thursday ||
      apt.friday || apt.saturday || apt.sunday
    end

    puts "\n🔄 RECURRING APPOINTMENTS (recurring: true):"
    puts "   With day flags: #{recurring_with_days.count}"
    puts "   WITHOUT day flags: #{recurring_without_days.count} ⚠️"

    if recurring_without_days.any?
      puts "\n⚠️  PROBLEM: Appointments marked as recurring but missing day flags:"
      recurring_without_days.each do |apt|
        puts "   - ID #{apt.id}: #{apt.pet.name} (#{apt.appointment_date})"
        puts "     Duration: #{apt.duration}, Walk type: #{apt.walk_type}"
        puts "     Days: Mon=#{apt.monday} Tue=#{apt.tuesday} Wed=#{apt.wednesday} Thu=#{apt.thursday} Fri=#{apt.friday} Sat=#{apt.saturday} Sun=#{apt.sunday}"
      end
    end

    # Check non-recurring appointments
    non_recurring_with_days = Appointment.where(recurring: [false, nil]).select do |apt|
      apt.monday || apt.tuesday || apt.wednesday || apt.thursday ||
      apt.friday || apt.saturday || apt.sunday
    end

    if non_recurring_with_days.any?
      puts "\n⚠️  PROBLEM: Appointments NOT marked as recurring but HAVE day flags:"
      puts "   Count: #{non_recurring_with_days.count}"
      non_recurring_with_days.first(5).each do |apt|
        days = []
        days << "Mon" if apt.monday
        days << "Tue" if apt.tuesday
        days << "Wed" if apt.wednesday
        days << "Thu" if apt.thursday
        days << "Fri" if apt.friday
        days << "Sat" if apt.saturday
        days << "Sun" if apt.sunday
        puts "   - ID #{apt.id}: #{apt.pet.name} - Days: #{days.join(', ')}"
      end
      puts "   ... and #{non_recurring_with_days.count - 5} more" if non_recurring_with_days.count > 5
    end

    puts "\n" + "=" * 60
    puts "💡 RECOMMENDATION:"
    if non_recurring_with_days.any?
      puts "   ✓ Mark #{non_recurring_with_days.count} appointments WITH day flags as recurring"
    end
    if recurring_without_days.any?
      puts "   ✓ These #{recurring_without_days.count} might be old test data or need day flags set"
      puts "   ✓ Review them manually before changing"
    end
  end
end
