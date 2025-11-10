require 'faker'

puts 'Seeding testing user...'
user = User.create!(
  username: 'testing',
  password: 'flatiron',
  password_confirmation: 'flatiron',
  name: 'Test Account',
  email_address: 'testing@gmail.com',
  thirty: 22,
  fortyfive: 28,
  sixty: 33,
  solo_rate: 5,
  training_rate: 10,
  sibling_rate: 8
)

puts 'Seeding pets with real Brooklyn addresses...'
pet_data = [
  # Real Brooklyn addresses from user's data - spread across Carroll Gardens/Park Slope
  { name: 'Moose', sex: 'Male', birthdate: '2023-11-09', spayed_neutered: true,
    behavioral_notes: 'Young and energetic. Loves treats and playtime.',
    supplies_location: 'Leash in closet, treats on counter.',
    allergies: 'None', address: '262 Bond St, Brooklyn, NY' },

  { name: 'Polly Pocket', sex: 'Female', birthdate: '2023-11-09', spayed_neutered: true,
    behavioral_notes: 'Small and friendly. Easy walker.',
    supplies_location: 'Leash by door, harness in closet.',
    allergies: 'None', address: '317 President St, Brooklyn, NY' },

  { name: 'Ralph', sex: 'Male', birthdate: '2018-11-09', spayed_neutered: true,
    behavioral_notes: 'Older dog, calm on walks. Knows commands well.',
    supplies_location: 'Leash hanging in hallway.',
    allergies: 'None', address: '388 Warren St, Brooklyn, NY' },

  { name: 'Reggie', sex: 'Male', birthdate: '2023-11-09', spayed_neutered: true,
    behavioral_notes: 'Playful puppy, pulls on leash sometimes.',
    supplies_location: 'Leash and collar by front door.',
    allergies: 'None', address: '355 President St, Brooklyn, NY' },

  { name: 'Reyka', sex: 'Female', birthdate: '2019-11-09', spayed_neutered: true,
    behavioral_notes: 'Well-behaved, good with other dogs.',
    supplies_location: 'Supplies in mudroom closet.',
    allergies: 'Chicken', address: '64 2nd Pl, Brooklyn, NY' },

  { name: 'Ru', sex: 'Male', birthdate: '2023-11-09', spayed_neutered: true,
    behavioral_notes: 'Young and energetic. Loves to run.',
    supplies_location: 'Leash in entryway, treats in kitchen.',
    allergies: 'None', address: '89 1st Pl, Brooklyn, NY' },

  { name: 'Shea', sex: 'Female', birthdate: '2024-05-09', spayed_neutered: false,
    behavioral_notes: 'Very young puppy, still learning leash manners.',
    supplies_location: 'Puppy supplies in living room basket.',
    allergies: 'None', address: '267 Carroll St, Brooklyn, NY' },

  { name: 'Sigmund', sex: 'Male', birthdate: '2023-11-09', spayed_neutered: true,
    behavioral_notes: 'Friendly and curious. Loves sniffing everything.',
    supplies_location: 'Leash in closet, treats in kitchen cabinet.',
    allergies: 'None', address: '64 2nd Pl, Brooklyn, NY' },

  { name: 'Sunny', sex: 'Female', birthdate: '2022-11-09', spayed_neutered: true,
    behavioral_notes: 'Happy and friendly. Great on leash.',
    supplies_location: 'Leash by door, extra supplies in closet.',
    allergies: 'None', address: '47 2nd Pl, Brooklyn, NY' },

  { name: 'Artu', sex: 'Male', birthdate: '2024-01-09', spayed_neutered: true,
    behavioral_notes: 'Young and energetic puppy. Loves to play.',
    supplies_location: 'Leash and treats in closet by door.',
    allergies: 'None', address: '450 Clinton St, Brooklyn, NY' },

  { name: 'Chloe', sex: 'Female', birthdate: '2016-11-09', spayed_neutered: true,
    behavioral_notes: 'Senior dog, very calm. Takes it slow on walks.',
    supplies_location: 'Medications in kitchen, leash by front door.',
    allergies: 'Grain', address: '206 Carroll St, Brooklyn, NY' },

  { name: 'Eliza', sex: 'Female', birthdate: '2018-11-09', spayed_neutered: true,
    behavioral_notes: 'Friendly with other dogs, loves belly rubs.',
    supplies_location: 'Leash hanging by door, treats in kitchen drawer.',
    allergies: 'None', address: '97 1st Pl, Brooklyn, NY' },

  { name: 'Henry', sex: 'Male', birthdate: '2023-11-09', spayed_neutered: true,
    behavioral_notes: 'Young and playful. Good with other dogs.',
    supplies_location: 'Supplies in hallway closet.',
    allergies: 'None', address: '118 1st Pl, Brooklyn, NY' },

  { name: 'Hera', sex: 'Female', birthdate: '2021-11-09', spayed_neutered: true,
    behavioral_notes: 'Well-behaved, knows basic commands.',
    supplies_location: 'Leash by door, food in kitchen.',
    allergies: 'None', address: '450 Clinton St, Brooklyn, NY' }
]

pets = pet_data.map { |pet_attrs| Pet.create!(pet_attrs.merge(user_id: user.id)) }
puts "✅ Created #{pets.length} pets"

puts 'Creating ONE recurring appointment per dog (all days of week)...'

# Simple schedule - each dog gets one consistent time slot
appointment_times = [
  { start: '08:00', duration: 30, walk_type: 'group' },
  { start: '08:45', duration: 30, walk_type: 'group' },
  { start: '09:30', duration: 45, walk_type: 'group' },
  { start: '10:30', duration: 30, walk_type: 'group' },
  { start: '11:00', duration: 45, walk_type: 'group' },
  { start: '12:00', duration: 30, walk_type: 'solo' },
  { start: '13:00', duration: 45, walk_type: 'group' },
  { start: '13:45', duration: 30, walk_type: 'training' },
  { start: '14:30', duration: 30, walk_type: 'group' },
  { start: '15:00', duration: 30, walk_type: 'group' },
  { start: '15:45', duration: 45, walk_type: 'group' },
  { start: '16:30', duration: 30, walk_type: 'group' },
  { start: '17:00', duration: 30, walk_type: 'group' },
  { start: '17:30', duration: 30, walk_type: 'group' }
]

appointments = []
pets.each_with_index do |pet, index|
  # Assign a time slot to each pet (cycling through if more pets than slots)
  time_slot = appointment_times[index % appointment_times.length]

  # Calculate end time
  start_hour, start_min = time_slot[:start].split(':').map(&:to_i)
  end_mins = start_hour * 60 + start_min + time_slot[:duration]
  end_hour = end_mins / 60
  end_min = end_mins % 60
  end_time = format('%02d:%02d', end_hour, end_min)

  # Create ONE recurring appointment for ALL days of the week
  appointment = Appointment.create!(
    pet_id: pet.id,
    user_id: user.id,
    appointment_date: Date.today, # Not used for recurring
    start_time: time_slot[:start],
    end_time: end_time,
    recurring: true,  # Recurring appointment
    monday: true,     # All days enabled
    tuesday: true,
    wednesday: true,
    thursday: true,
    friday: true,
    saturday: true,
    sunday: true,
    duration: time_slot[:duration],
    walk_type: time_slot[:walk_type],
    completed: false,
    canceled: false
  )
  appointments << appointment
end

puts "✅ Created #{appointments.length} recurring appointments (1 per dog, every day)"

puts 'Creating a few historical invoices...'
# Create some past completed walks
appointments.first(5).each do |appointment|
  2.times do
    Invoice.create!(
      appointment_id: appointment.id,
      pet_id: appointment.pet_id,
      date_completed: Faker::Date.between(from: 7.days.ago, to: 1.day.ago),
      paid: [true, false].sample,
      pending: false,
      compensation: if appointment.duration === 30
                      22
                    else
                      (appointment.duration === 45 ? 28 : 33)
                    end,
      title: "#{appointment.duration} min #{appointment.walk_type} walk",
      cancelled: false
    )
  end
end

puts 'Seeding default books...'
load Rails.root.join('db', 'seeds', 'books_seed.rb')

puts ''
puts '🎉 Seeding completed!'
puts '=' * 50
puts '📊 Summary:'
puts '  👤 User: testing / flatiron'
puts "  🐕 Pets: #{pets.length} (real Brooklyn addresses)"
puts "  📅 Appointments: #{appointments.length} (1 per dog, recurring every day)"
puts '  📍 All addresses are in Carroll Gardens/Park Slope area'
puts '  🗺️  Perfect for testing route optimization!'
puts '=' * 50
