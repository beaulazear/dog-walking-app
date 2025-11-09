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

puts 'Seeding pets...'
pet_data = [
  { name: 'Sage', sex: 'Male', birthdate: '2020-02-04', spayed_neutered: true,
    behavioral_notes: 'Usually a good boy... can nip if you scratch the wrong spot. Usually around his butt',
    supplies_location: 'Wet food is in the cabinet to the right of the stove, dry food on the bar cart, two litter boxes downstairs and one upstairs',
    allergies: 'None that we are aware of', address: '827 Monroe St' },

  { name: 'Moose Zelenetz', sex: 'Male', birthdate: '2020-02-04', spayed_neutered: true,
    behavioral_notes: 'Leash reactivity towards other dogs and sometimes people. Be extra careful and do not put your guard down. He has often times lunged at people or other dogs.',
    supplies_location: 'Leash in closet as you walk in, treats in jar on kitchen counter.',
    allergies: 'Chicken', address: '262 Bond St' },

  { name: 'Luna', sex: 'Female', birthdate: '2019-07-12', spayed_neutered: true,
    behavioral_notes: 'Super friendly but scared of loud noises.',
    supplies_location: 'Treats in pantry, leash by front door.',
    allergies: 'None', address: '432 Park Ave' },

  { name: 'Charlie', sex: 'Male', birthdate: '2021-11-08', spayed_neutered: false,
    behavioral_notes: 'Excitable and jumps on people. Needs firm commands.',
    supplies_location: 'Leash in hallway closet, food in kitchen cabinet.',
    allergies: 'Beef', address: '100 Main St' },

  # Brooklyn pets with real NYC addresses
  { name: 'Artu', sex: 'Male', birthdate: '2024-11-09', spayed_neutered: true,
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

  { name: 'Henry C', sex: 'Male', birthdate: '2023-11-09', spayed_neutered: true,
    behavioral_notes: 'Young and playful. Good with other dogs.',
    supplies_location: 'Supplies in hallway closet.',
    allergies: 'None', address: '118 1st Pl, Brooklyn, NY' },

  { name: 'Hera', sex: 'Female', birthdate: '2021-11-09', spayed_neutered: true,
    behavioral_notes: 'Well-behaved, knows basic commands.',
    supplies_location: 'Leash by door, food in kitchen.',
    allergies: 'None', address: '450 Clinton St, Brooklyn, NY' }
]

pets = pet_data.map { |pet_attrs| Pet.create!(pet_attrs.merge(user_id: user.id)) }

puts 'Seeding appointments...'
appointments = []
pets.each do |pet|
  3.times do
    # Generate start time first
    start = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'].sample
    duration = [30, 45, 60].sample

    # Calculate end time based on start + duration
    start_hour, start_min = start.split(':').map(&:to_i)
    end_mins = start_hour * 60 + start_min + duration
    end_hour = end_mins / 60
    end_min = end_mins % 60
    end_time = format('%02d:%02d', end_hour, end_min)

    appointment = Appointment.create!(
      pet_id: pet.id,
      user_id: user.id,
      appointment_date: Faker::Date.forward(days: rand(1..60)), # Random date in the next 60 days
      start_time: start,
      end_time: end_time,
      recurring: [true, false].sample,
      monday: [true, false].sample,
      tuesday: [true, false].sample,
      wednesday: [true, false].sample,
      thursday: [true, false].sample,
      friday: [true, false].sample,
      saturday: [true, false].sample,
      sunday: [true, false].sample,
      duration: duration,
      completed: [true, false].sample,
      canceled: false
    )
    appointments << appointment
  end
end

puts 'Seeding invoices for 2024...'
appointments.each do |appointment|
  rand(3..7).times do
    Invoice.create!(
      appointment_id: appointment.id,
      pet_id: appointment.pet_id,
      date_completed: Faker::Date.between(from: '2024-01-01', to: Date.today),
      paid: [true, false].sample,
      pending: [true, false].sample,
      compensation: rand(20..50),
      title: 'Dog Walking Service',
      cancelled: false
    )
  end
end

puts 'Seeding default books...'
load Rails.root.join('db', 'seeds', 'books_seed.rb')

puts 'Seeding completed!'
