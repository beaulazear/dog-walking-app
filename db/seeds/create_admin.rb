# Create super admin user: beaulazear
# Run with: rails runner db/seeds/create_admin.rb

puts "Creating super admin user: beaulazear..."

user = User.find_or_initialize_by(username: "beaulazear")

user.assign_attributes(
  name: "Beau Lazear",
  email_address: "beau@scoopersnyc.com",
  password: "scoopers2026", # CHANGE THIS AFTER FIRST LOGIN
  admin: true,
  is_dog_walker: true,
  thirty: 30,
  fortyfive: 45,
  sixty: 60,
  solo_rate: 30,
  training_rate: 50,
  sibling_rate: 15
)

if user.new_record?
  user.save!
  puts "✅ Super admin user created successfully!"
  puts "Username: beaulazear"
  puts "Email: beau@scoopersnyc.com"
  puts "Password: scoopers2026"
  puts ""
  puts "⚠️  IMPORTANT: Change this password after your first login!"
else
  user.update!(admin: true) # Ensure admin is true even if user exists
  puts "✅ User 'beaulazear' already exists. Admin status updated to true."
end

puts ""
puts "Admin panel endpoints available:"
puts "  GET /admin/dashboard - Overview stats"
puts "  GET /admin/users - All users"
puts "  GET /admin/sponsorships - All sponsorships"
puts "  GET /admin/cleanup_jobs - All cleanup jobs"
puts "  GET /admin/sweeps - All maintenance sweeps"
puts "  GET /admin/contributions - All neighbor contributions"
puts "  GET /admin/waitlist - All waitlist signups"
puts "  GET /admin/reviews - All job reviews"
puts "  GET /admin/sponsorship_ratings - All sponsorship ratings"
