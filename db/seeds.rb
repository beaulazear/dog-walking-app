# This file should contain all the record creation needed to seed the database with its default values.
# The data can then be loaded with the bin/rails db:seed command (or created alongside the database with db:setup).
#
# Examples:
#
#   movies = Movie.create([{ name: 'Star Wars' }, { name: 'Lord of the Rings' }])
#   Character.create(name: 'Luke', movie: movies.first)

puts "seeding users"
User.create(username: "beaulazear", password: "bark", password_confirmation: "bark", name: "Beau Lazear", email_address: "beaulazear@gmail.com", pets: [])
Pet.create(user_id: 1, name: "Sage", spayed_neutered: true, birthdate: "2020-02-04T00:00:00.000Z", behavorial_notes: "Usually a good boy... can nip if you scratch the wrong spot. Usually around his butt", supplies_location: "Wet food is in the cabinet to the right of the stove, dry food on the bar cart, two litter boxes down stairs and one upstairs", allergies: "none that we are aware of", sex: "male", address: "827 Monroe St")

