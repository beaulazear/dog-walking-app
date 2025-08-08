require 'rails_helper'

RSpec.describe 'Basic Test' do
  it 'can create a user' do
    user = User.create!(
      username: 'testuser',
      password: 'password123',
      password_confirmation: 'password123',
      name: 'Test User',
      email_address: 'test@example.com',
      thirty: 30,
      fourty: 40,
      sixty: 60,
      solo_rate: 35
    )

    expect(user.persisted?).to be true
    expect(user.username).to eq('testuser')
  end
end
