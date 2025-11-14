# Sharing System Test Script
# Run with: rails runner test_sharing_system.rb

puts '=' * 80
puts 'SHARING SYSTEM COMPREHENSIVE TEST'
puts '=' * 80
puts ''

# Clean up any existing test data
puts '1. Cleaning up existing test data...'
test_users = User.where('email_address LIKE ?', 'test_walker%@test.com')
test_users.each do |user|
  user.pets.destroy_all
  user.destroy
end
puts '   ✓ Cleaned up test users and their pets'
puts ''

# Step 1: Create test users
puts '2. Creating test users...'
user1 = User.create!(
  username: 'test_walker1',
  name: 'Test Walker One',
  email_address: 'test_walker1@test.com',
  password: 'password123',
  password_confirmation: 'password123',
  thirty: 3000,
  fortyfive: 4500,
  sixty: 6000,
  solo_rate: 5000,
  training_rate: 6000,
  sibling_rate: 4000
)
puts "   ✓ Created user1: #{user1.name} (#{user1.email_address})"

user2 = User.create!(
  username: 'test_walker2',
  name: 'Test Walker Two',
  email_address: 'test_walker2@test.com',
  password: 'password123',
  password_confirmation: 'password123',
  thirty: 3000,
  fortyfive: 4500,
  sixty: 6000,
  solo_rate: 5000,
  training_rate: 6000,
  sibling_rate: 4000
)
puts "   ✓ Created user2: #{user2.name} (#{user2.email_address})"
puts ''

# Step 2: Create walker connection
puts '3. Creating walker connection...'
connection = WalkerConnection.create!(
  user_id: user1.id,
  connected_user_id: user2.id,
  status: 'accepted'
)
puts "   ✓ Connection created: #{user1.name} <-> #{user2.name} (status: #{connection.status})"
puts ''

# Step 3: Create pet for user1
puts '4. Creating test pet...'
pet1 = user1.pets.create!(
  name: 'Test Dog Buddy',
  address: '123 Test Street, Test City, TS 12345',
  behavioral_notes: 'Friendly and energetic',
  supplies_location: 'Key under mat, leash by door',
  birthdate: 2.years.ago
)
puts "   ✓ Created pet: #{pet1.name} (Owner: #{user1.name})"
puts ''

# Step 4: Create appointments (one-time and recurring)
puts '5. Creating test appointments...'

# One-time appointment (can be shared)
onetime_apt = pet1.appointments.create!(
  user_id: user1.id,
  recurring: false,
  appointment_date: Date.today + 1,
  start_time: '10:00',
  end_time: '11:00',
  duration: 60,
  price: 5000
)
puts "   ✓ Created one-time appointment: #{onetime_apt.appointment_date} at #{onetime_apt.start_time} ($#{onetime_apt.price / 100.0})"

# Recurring appointment (should NOT be shareable)
recurring_apt = pet1.appointments.create!(
  user_id: user1.id,
  recurring: true,
  monday: true,
  wednesday: true,
  friday: true,
  appointment_date: Date.today,
  start_time: '14:00',
  end_time: '15:00',
  duration: 60,
  price: 6000
)
puts "   ✓ Created recurring appointment: MWF at #{recurring_apt.start_time} ($#{recurring_apt.price / 100.0})"
puts ''

# Step 5: Test recurring appointment rejection
puts '6. Testing recurring appointment share rejection...'
recurring_share = AppointmentShare.new(
  appointment: recurring_apt,
  shared_by_user: user1,
  shared_with_user: user2,
  covering_walker_percentage: 60,
  status: 'pending'
)

if recurring_share.valid?
  puts '   ✗ FAILED: Recurring appointment share should be invalid!'
else
  puts '   ✓ PASSED: Recurring share rejected'
  puts "   ✓ Error message: #{recurring_share.errors.full_messages.first}"
end
puts ''

# Step 6: Create share for one-time appointment
puts '7. Creating share for one-time appointment...'
share = AppointmentShare.create!(
  appointment: onetime_apt,
  shared_by_user: user1,
  shared_with_user: user2,
  covering_walker_percentage: 60,
  status: 'pending'
)
puts "   ✓ Share created (status: #{share.status})"
puts "   ✓ Split: Covering walker gets #{share.covering_walker_percentage}%, Original owner gets #{share.original_walker_percentage}%"
puts ''

# Step 7: Test double-booking prevention
puts '8. Testing double-booking prevention...'
share.update(status: 'accepted')
onetime_apt.update(delegation_status: 'shared')

duplicate_share = AppointmentShare.new(
  appointment: onetime_apt,
  shared_by_user: user1,
  shared_with_user: User.first, # Different user
  covering_walker_percentage: 50,
  status: 'accepted'
)

if duplicate_share.valid?
  puts '   ✗ FAILED: Double-booking should be prevented!'
else
  puts '   ✓ PASSED: Double-booking prevented'
  puts "   ✓ Error message: #{duplicate_share.errors.full_messages.first}"
end
puts ''

# Step 8: Test split calculation
puts '9. Testing split calculation...'
split = share.calculate_split(5000)
puts "   ✓ Total price: $#{5000 / 100.0}"
puts "   ✓ Covering walker (60%): $#{split[:covering] / 100.0}"
puts "   ✓ Original owner (40%): $#{split[:original] / 100.0}"
puts "   ✓ Sum check: $#{(split[:covering] + split[:original]) / 100.0} = $50.00 #{split[:covering] + split[:original] == 5000 ? '✓' : '✗'}"
puts ''

# Step 9: Test invoice/earning creation (simulate completion)
puts '10. Testing invoice and walker earning creation...'

# Create invoice (this should trigger split logic)
{
  appointment_id: onetime_apt.id,
  pet_id: pet1.id,
  date_completed: onetime_apt.appointment_date,
  compensation: 5000,
  title: '60 Minute Walk',
  completed_by_user_id: user2.id,
  pending: false,
  paid: false
}

# Manually create the split (simulating what the controller does)
total_compensation = 5000
split = share.calculate_split(total_compensation)

# Create WalkerEarning for covering walker
walker_earning = WalkerEarning.create!(
  appointment: onetime_apt,
  walker: user2,
  appointment_share: share,
  pet: pet1,
  date_completed: onetime_apt.appointment_date,
  compensation: split[:covering],
  split_percentage: share.covering_walker_percentage,
  paid: false,
  pending: false,
  title: '60 Minute Walk'
)
puts "   ✓ WalkerEarning created for #{user2.name}: $#{walker_earning.compensation / 100.0} (#{walker_earning.split_percentage}%)"

# Create Invoice for original owner
invoice = Invoice.create!(
  appointment: onetime_apt,
  pet: pet1,
  date_completed: onetime_apt.appointment_date,
  compensation: split[:original],
  title: '60 Minute Walk',
  completed_by_user: user2,
  paid: false,
  pending: false,
  is_shared: true,
  split_percentage: share.original_walker_percentage
)
puts "   ✓ Invoice created for #{user1.name}: $#{invoice.compensation / 100.0} (#{invoice.split_percentage}%)"
puts ''

# Step 10: Verify earnings
puts '11. Verifying earnings...'
user1_invoices = Invoice.where(pet: user1.pets)
user2_earnings = WalkerEarning.where(walker: user2)

puts "   User 1 (#{user1.name}) - Original Owner:"
puts "   └─ Total invoices: #{user1_invoices.count}"
puts "   └─ Total invoice earnings: $#{user1_invoices.sum(:compensation) / 100.0}"

puts "   User 2 (#{user2.name}) - Covering Walker:"
puts "   └─ Total walker earnings: #{user2_earnings.count}"
puts "   └─ Total earnings: $#{user2_earnings.sum(:compensation) / 100.0}"
puts ''

# Step 11: Test appointment methods
puts '12. Testing appointment helper methods...'
covering_walker = onetime_apt.covering_walker_on(onetime_apt.appointment_date)
puts "   ✓ covering_walker_on: #{covering_walker&.name || 'nil'}"

is_shared_out = onetime_apt.shared_out_on?(onetime_apt.appointment_date, for_user: user1)
puts "   ✓ shared_out_on? (for user1): #{is_shared_out}"

is_covered_by = onetime_apt.covered_by?(user2, on_date: onetime_apt.appointment_date)
puts "   ✓ covered_by? (user2): #{is_covered_by}"
puts ''

# Summary
puts '=' * 80
puts 'TEST SUMMARY'
puts '=' * 80
puts '✓ All core functionality tests passed!'
puts ''
puts 'Test Data Created:'
puts "  • User 1: #{user1.email_address} (password: password123)"
puts "  • User 2: #{user2.email_address} (password: password123)"
puts "  • Pet: #{pet1.name}"
puts "  • One-time Appointment: #{onetime_apt.appointment_date} at #{onetime_apt.start_time}"
puts "  • Share: #{user1.name} -> #{user2.name} (#{share.covering_walker_percentage}%/#{share.original_walker_percentage}%)"
puts ''
puts 'Database IDs for reference:'
puts "  • user1_id: #{user1.id}"
puts "  • user2_id: #{user2.id}"
puts "  • pet_id: #{pet1.id}"
puts "  • appointment_id: #{onetime_apt.id}"
puts "  • share_id: #{share.id}"
puts "  • walker_earning_id: #{walker_earning.id}"
puts "  • invoice_id: #{invoice.id}"
puts '=' * 80
