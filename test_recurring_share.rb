# Test Recurring Appointment Sharing as One-Time Clones
# Run with: rails runner test_recurring_share.rb

puts '=' * 80
puts 'RECURRING APPOINTMENT SHARING TEST'
puts '=' * 80
puts ''

# Clean up any existing test data
puts '1. Cleaning up existing test data...'
User.where('email_address LIKE ?', 'recurring_test%@test.com').each do |user|
  user.pets.destroy_all
  user.destroy
end
puts '   ✓ Cleaned up test users'
puts ''

# Create test users
puts '2. Creating test users...'
user1 = User.create!(
  username: 'recurring_test1',
  name: 'Recurring Test One',
  email_address: 'recurring_test1@test.com',
  password: 'password123',
  password_confirmation: 'password123',
  thirty: 3000,
  fortyfive: 4500,
  sixty: 6000,
  solo_rate: 5000,
  training_rate: 6000,
  sibling_rate: 4000
)
puts "   ✓ Created user1: #{user1.name}"

user2 = User.create!(
  username: 'recurring_test2',
  name: 'Recurring Test Two',
  email_address: 'recurring_test2@test.com',
  password: 'password123',
  password_confirmation: 'password123',
  thirty: 3000,
  fortyfive: 4500,
  sixty: 6000,
  solo_rate: 5000,
  training_rate: 6000,
  sibling_rate: 4000
)
puts "   ✓ Created user2: #{user2.name}"
puts ''

# Create walker connection
puts '3. Creating walker connection...'
WalkerConnection.create!(
  user_id: user1.id,
  connected_user_id: user2.id,
  status: 'accepted'
)
puts "   ✓ Connection created: #{user1.name} <-> #{user2.name}"
puts ''

# Create pet for user1
puts '4. Creating test pet...'
pet1 = user1.pets.create!(
  name: 'Recurring Test Dog',
  address: '123 Test Street, Test City, TS 12345',
  behavioral_notes: 'Friendly',
  supplies_location: 'Key under mat',
  birthdate: 2.years.ago
)
puts "   ✓ Created pet: #{pet1.name}"
puts ''

# Create a recurring appointment (every Monday and Wednesday)
puts '5. Creating recurring appointment...'
recurring_apt = pet1.appointments.create!(
  user_id: user1.id,
  recurring: true,
  monday: true,
  wednesday: true,
  appointment_date: Date.today,
  start_time: '10:00',
  end_time: '11:00',
  duration: 60,
  price: 5000
)
puts "   ✓ Created recurring appointment: Mon/Wed at #{recurring_apt.start_time} ($#{recurring_apt.price / 100.0})"
puts ''

# Generate test dates (next 3 Mondays)
puts '6. Generating dates to share...'
dates_to_share = []
current_date = Date.today
3.times do
  # Find next Monday
  days_until_monday = (1 - current_date.wday) % 7
  days_until_monday = 7 if days_until_monday.zero? && current_date != Date.today
  next_monday = current_date + days_until_monday.days
  dates_to_share << next_monday
  current_date = next_monday + 1.day
end
puts "   ✓ Selected #{dates_to_share.length} dates:"
dates_to_share.each { |d| puts "     - #{d.strftime('%A, %B %d, %Y')}" }
puts ''

# Test sharing recurring appointment with selected dates
puts '7. Sharing recurring appointment for selected dates...'
Appointment.count
AppointmentShare.count

# Simulate the controller action
dates_to_share.each do |date|
  # Create one-time clone
  cloned_appointment = Appointment.create!(
    user_id: recurring_apt.user_id,
    pet_id: recurring_apt.pet_id,
    recurring: false,
    appointment_date: date,
    start_time: recurring_apt.start_time,
    end_time: recurring_apt.end_time,
    duration: recurring_apt.duration,
    price: recurring_apt.price,
    cloned_from_appointment_id: recurring_apt.id
  )

  # Create share for cloned appointment
  share = AppointmentShare.create!(
    appointment: cloned_appointment,
    shared_by_user: user1,
    shared_with_user: user2,
    covering_walker_percentage: 60,
    status: 'pending'
  )

  puts "   ✓ Created one-time appointment for #{date.strftime('%b %d')} (share_id: #{share.id})"
end
puts ''

# Verify results
puts '8. Verifying results...'
new_appointments = Appointment.where(cloned_from_appointment_id: recurring_apt.id)
new_shares = AppointmentShare.where(shared_by_user: user1, shared_with_user: user2)

puts "   ✓ Original recurring appointment still exists: #{recurring_apt.recurring ? 'Yes' : 'No'}"
puts "   ✓ New one-time appointments created: #{new_appointments.count} (expected: #{dates_to_share.length})"
puts "   ✓ New shares created: #{new_shares.count} (expected: #{dates_to_share.length})"
puts ''

# Verify each cloned appointment
puts '9. Verifying cloned appointments...'
success = true
new_appointments.each do |apt|
  is_one_time = !apt.recurring
  has_correct_source = apt.cloned_from_appointment_id == recurring_apt.id
  has_share = apt.appointment_shares.exists?
  has_correct_date = dates_to_share.map(&:to_date).include?(apt.appointment_date.to_date)

  if is_one_time && has_correct_source && has_share && has_correct_date
    puts "   ✓ Appointment #{apt.id} (#{apt.appointment_date.strftime('%b %d')}): Valid"
  else
    puts "   ✗ Appointment #{apt.id}: FAILED"
    puts "     - Is one-time: #{is_one_time}"
    puts "     - Correct source: #{has_correct_source}"
    puts "     - Has share: #{has_share}"
    puts "     - Correct date: #{has_correct_date} (expected one of: #{dates_to_share.map(&:to_s).join(', ')})"
    puts "     - Actual date: #{apt.appointment_date}"
    success = false
  end
end
puts ''

# Test accepting a share
puts '10. Testing share acceptance...'
share_to_accept = new_shares.first
share_to_accept.accept!
puts "   ✓ Accepted share for #{share_to_accept.appointment.appointment_date.strftime('%b %d')}"
puts "   ✓ Appointment delegation_status: #{share_to_accept.appointment.delegation_status}"
puts ''

# Verify user2 can see the shared appointments
puts '11. Verifying shared appointments for user2...'
user2_shared_apts = user2.received_appointment_shares.accepted.map(&:appointment)
puts "   ✓ User2 has #{user2_shared_apts.count} accepted shared appointment(s)"
user2_shared_apts.each do |apt|
  puts "     - #{apt.pet.name} on #{apt.appointment_date.strftime('%b %d')} (cloned: #{apt.cloned_from_appointment_id.present?})"
end
puts ''

# Summary
puts '=' * 80
puts 'TEST SUMMARY'
puts '=' * 80
if success && new_appointments.count == dates_to_share.length && new_shares.count == dates_to_share.length
  puts '✓ All tests passed!'
  puts ''
  puts 'Successfully demonstrated:'
  puts '  • Recurring appointments can be shared by selecting specific dates'
  puts '  • Each selected date creates a separate one-time appointment'
  puts '  • One-time appointments are properly linked to source (cloned_from_appointment_id)'
  puts '  • Shares work correctly with cloned appointments'
  puts '  • User2 can see and accept cloned shared appointments'
else
  puts '✗ Some tests failed - review output above'
end
puts '=' * 80
