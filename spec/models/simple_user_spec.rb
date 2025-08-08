require 'rails_helper'

RSpec.describe 'User Model' do
  it 'creates a user with valid attributes' do
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
    expect(user.name).to eq('Test User')
  end
  
  it 'validates username presence' do
    user = User.new(
      password: 'password123',
      password_confirmation: 'password123',
      name: 'Test User',
      email_address: 'test@example.com',
      thirty: 30,
      fourty: 40,
      sixty: 60,
      solo_rate: 35
    )
    expect(user.valid?).to be false
    expect(user.errors[:username]).to include("can't be blank")
  end
end