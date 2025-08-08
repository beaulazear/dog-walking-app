require 'rails_helper'

RSpec.describe User, type: :model do
  it 'creates a user successfully' do
    user = User.create(
      username: 'testuser',
      password: 'password123',
      name: 'Test User',
      email_address: 'test@example.com',
      thirty: 30,
      fourty: 40,
      sixty: 60,
      solo_rate: 35
    )
    expect(user).to be_persisted
  end
end
