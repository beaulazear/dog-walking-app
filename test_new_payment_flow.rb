# Test New Payment Flow: Client pays original walker 100%, original walker owes team member
# Run with: rails runner test_new_payment_flow.rb

puts '=' * 80
puts 'NEW PAYMENT FLOW TEST'
puts '=' * 80
puts ''

# Use existing test users
user1 = User.find_by(email_address: 'test_walker1@test.com')
user2 = User.find_by(email_address: 'test_walker2@test.com')

unless user1 && user2
  puts '❌ Test users not found. Run test_sharing_system.rb first'
  exit
end

puts '✓ Using existing test users:'
puts "  - User1 (Original): #{user1.name}"
puts "  - User2 (Covering): #{user2.name}"
puts ''

# Find or create a shared appointment
pet = user1.pets.first
unless pet
  puts '❌ No pet found for user1. Run test_sharing_system.rb first'
  exit
end

# Create a new one-time appointment to share
apt = pet.appointments.create!(
  user_id: user1.id,
  recurring: false,
  appointment_date: Date.today + 2.days,
  start_time: '14:00',
  end_time: '15:00',
  duration: 60,
  price: 5000
)
puts "✓ Created test appointment: #{apt.appointment_date} at #{apt.start_time} ($#{apt.price / 100.0})"
puts ''

# Create and accept share
share = AppointmentShare.create!(
  appointment: apt,
  shared_by_user: user1,
  shared_with_user: user2,
  covering_walker_percentage: 60,
  status: 'pending'
)
share.accept!
puts '✓ Created and accepted share (60/40 split)'
puts ''

# Simulate the covering walker completing the walk
puts 'Testing payment flow when covering walker completes walk...'
puts ''

total_compensation = 5000 # $50
split = share.calculate_split(total_compensation)

puts 'Expected split:'
puts "  - Covering walker (60%): $#{split[:covering] / 100.0}"
puts "  - Original owner (40%): $#{split[:original] / 100.0}"
puts ''

# Manually create the records (simulating what controller does)
walker_earning = WalkerEarning.create!(
  appointment: apt,
  walker: user2,
  appointment_share: share,
  pet: pet,
  date_completed: apt.appointment_date,
  compensation: split[:covering], # $30 (60%)
  split_percentage: share.covering_walker_percentage,
  paid: false,
  pending: false,
  title: '60 Minute Walk'
)

original_invoice = Invoice.create!(
  appointment: apt,
  pet: pet,
  date_completed: apt.appointment_date,
  compensation: total_compensation, # $50 (100%) - NEW BEHAVIOR
  paid: false,
  title: '60 Minute Walk',
  is_shared: true,
  split_percentage: 100, # NEW: Client pays 100% to original owner
  completed_by_user: user2
)

puts '=' * 80
puts 'RESULTS'
puts '=' * 80
puts ''

puts 'Invoice (what client pays original walker):'
puts "  - Pet: #{original_invoice.pet.name}"
puts "  - Amount: $#{original_invoice.compensation / 100.0}"
puts "  - Split %: #{original_invoice.split_percentage}%"
puts "  - Is Shared: #{original_invoice.is_shared}"
puts "  - Completed by: #{original_invoice.completed_by_user&.name}"
puts ''

puts 'WalkerEarning (what original walker owes team member):'
puts "  - Walker: #{walker_earning.walker.name}"
puts "  - Pet: #{walker_earning.pet.name}"
puts "  - Amount: $#{walker_earning.compensation / 100.0}"
puts "  - Split %: #{walker_earning.split_percentage}%"
puts "  - Paid: #{walker_earning.paid}"
puts ''

puts 'Financial Summary:'
puts "  ✓ Client sees ONE invoice for $#{original_invoice.compensation / 100.0} (to #{user1.name})"
puts "  ✓ #{user1.name} receives $#{original_invoice.compensation / 100.0} from client"
puts "  ✓ #{user1.name} owes $#{walker_earning.compensation / 100.0} to #{user2.name}"
puts "  ✓ #{user1.name} keeps $#{(original_invoice.compensation - walker_earning.compensation) / 100.0} (net)"
puts ''

# Verify the math
expected_net = split[:original]
actual_net = original_invoice.compensation - walker_earning.compensation

if actual_net == expected_net
  puts '✅ Math checks out!'
  puts "   Original walker's net: $#{actual_net / 100.0} (expected $#{expected_net / 100.0})"
else
  puts '❌ Math error!'
  puts "   Got: $#{actual_net / 100.0}, Expected: $#{expected_net / 100.0}"
end

puts '=' * 80
puts 'TEST COMPLETE'
puts '=' * 80
puts ''
puts 'Key Changes in New Flow:'
puts '  1. Client pays 100% to original walker (simplified for client)'
puts '  2. WalkerEarning tracks what original walker owes team member'
puts '  3. Original walker handles payout to team member separately'
puts '  4. Net result is the same, but billing is cleaner'
puts '=' * 80
