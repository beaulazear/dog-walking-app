puts "seeding testing user"
User.create(
  username: "testing",
  password: "flatiron",
  password_confirmation: "flatiron",
  name: "Test Account",
  email_address: "testing@gmail.com",
  pets: [],
  thirty: 22,
  fourty: 28,
  sixty: 33,
  solo_rate: 5
)

puts "seeding testing pets"
Pet.create(
  user_id: 1,
  name: "Sage",
  spayed_neutered: true,
  birthdate: "2020-02-04T05:00:00.000Z",
  behavorial_notes: "Usually a good boy... can nip if you scratch the wrong spot. Usually around his butt",
  supplies_location: "Wet food is in the cabinet to the right of the stove, dry food on the bar cart, two litter boxes down stairs and one upstairs",
  allergies: "none that we are aware of",
  sex: "Male",
  address: "827 Monroe St"
)

Pet.create(
  user_id: 1,
  name: "Moose Zelenetz",
  spayed_neutered: true,
  birthdate: "2020-02-04T05:00:00.000Z",
  behavorial_notes: "Leash reactivity towards other dogs and sometimes people, be extra careful and do not put your guard down. He has often times lunged at people or other dogs.",
  supplies_location: "Leash in closet as you walk in, treats in jar on kitchen counter.",
  allergies: "Chicken",
  sex: "Male",
  address: "262 Bond St"
)

puts "seeding test appointment"
Appointment.create(
  pet_id: 1,
  user_id: 1,
  appointment_date: "2000-01-01T17:00:00.000Z",
  start_time: "2000-01-01T17:00:00.000Z",
  end_time: "2000-01-01T19:00:00.000Z",
  recurring: true,
  tuesday: true,
  thursday: true,
  duration: 60
)

puts "seeding test invoices for 2024"
# Create a large number of invoices for 2024
(1..100).each do |i|
  Invoice.create(
    appointment_id: 1,
    pet_id: 1,
    date_completed: "2024-#{rand(1..12).to_s.rjust(2, '0')}-#{rand(1..28).to_s.rjust(2, '0')}T17:00:00.000Z",
    paid: [true, false].sample,
    compensation: rand(20..50)
  )
end

puts "seeding completed"
