module RequestHelpers
  def json_response
    JSON.parse(response.body)
  end

  def create_and_login_user(attributes = {})
    user_attrs = {
      username: "testuser#{rand(1000)}",
      name: 'Test User',
      email_address: "test#{rand(1000)}@example.com",
      password: 'password123',
      password_confirmation: 'password123',
      thirty: 30,
      fourty: 40,
      sixty: 60,
      solo_rate: 35
    }.merge(attributes)

    user = User.create!(user_attrs)
    login_user(user)
    user
  end

  def login_user(user)
    post '/login', params: {
      username: user.username,
      password: 'password123'
    }
    user
  end

  def create_test_pet(user, attributes = {})
    Pet.create!({
      user: user,
      name: 'Buddy',
      birthdate: Date.current - 2.years,
      sex: 'male',
      spayed_neutered: true,
      address: '123 Test Street, Test City, TC 12345',
      behavorial_notes: 'Friendly and energetic dog',
      supplies_location: 'Garage on left side',
      allergies: 'None'
    }.merge(attributes))
  end

  def create_test_appointment(user, pet, attributes = {})
    Appointment.create!({
      user: user,
      pet: pet,
      appointment_date: Date.current + 1.day,
      start_time: '09:00',
      end_time: '10:00',
      duration: 60,
      price: 30,
      recurring: false,
      solo: false,
      completed: false,
      canceled: false,
      monday: false,
      tuesday: false,
      wednesday: false,
      thursday: false,
      friday: false,
      saturday: false,
      sunday: false
    }.merge(attributes))
  end
end

RSpec.configure do |config|
  config.include RequestHelpers, type: :request
end
