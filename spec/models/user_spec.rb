require 'rails_helper'

RSpec.describe User, type: :model do
  describe 'associations' do
    it 'has many pets' do
      expect(User.reflect_on_association(:pets).macro).to eq(:has_many)
    end

    it 'has many appointments through pets' do
      association = User.reflect_on_association(:appointments)
      expect(association.macro).to eq(:has_many)
      expect(association.options[:through]).to eq(:pets)
    end

    it 'has many invoices through pets' do
      association = User.reflect_on_association(:invoices)
      expect(association.macro).to eq(:has_many)
      expect(association.options[:through]).to eq(:pets)
    end
  end

  describe 'validations' do
    let(:valid_attributes) do
      {
        username: 'testuser',
        password: 'password123',
        password_confirmation: 'password123',
        name: 'Test User',
        email_address: 'test@example.com',
        thirty: 30,
        fortyfive: 45,
        sixty: 60,
        solo_rate: 35
      }
    end

    it 'is valid with valid attributes' do
      user = User.new(valid_attributes)
      expect(user).to be_valid
    end

    it 'validates presence of username' do
      user = User.new(valid_attributes.merge(username: nil))
      expect(user).to_not be_valid
      expect(user.errors[:username]).to include("can't be blank")
    end

    it 'validates uniqueness of username' do
      create_user(username: 'unique_user')
      user = User.new(valid_attributes.merge(username: 'unique_user'))
      expect(user).to_not be_valid
      expect(user.errors[:username]).to include('has already been taken')
    end

    it 'validates presence of name' do
      user = User.new(valid_attributes.merge(name: nil))
      expect(user).to_not be_valid
      expect(user.errors[:name]).to include("can't be blank")
    end

    it 'validates presence of email_address' do
      user = User.new(valid_attributes.merge(email_address: nil))
      expect(user).to_not be_valid
      expect(user.errors[:email_address]).to include("can't be blank")
    end

    it 'validates thirty is an integer' do
      user = User.new(valid_attributes.merge(thirty: 'not_a_number'))
      expect(user).to_not be_valid
      expect(user.errors[:thirty]).to include('is not a number')
    end

    it 'validates fortyfive is an integer' do
      user = User.new(valid_attributes.merge(fortyfive: 'not_a_number'))
      expect(user).to_not be_valid
      expect(user.errors[:fortyfive]).to include('is not a number')
    end

    it 'validates sixty is an integer' do
      user = User.new(valid_attributes.merge(sixty: 'not_a_number'))
      expect(user).to_not be_valid
      expect(user.errors[:sixty]).to include('is not a number')
    end

    it 'validates solo_rate is an integer' do
      user = User.new(valid_attributes.merge(solo_rate: 'not_a_number'))
      expect(user).to_not be_valid
      expect(user.errors[:solo_rate]).to include('is not a number')
    end
  end

  describe 'password authentication' do
    let(:user) { create_user(password: 'secret123', password_confirmation: 'secret123') }

    it 'authenticates with correct password' do
      expect(user.authenticate('secret123')).to eq(user)
    end

    it 'does not authenticate with incorrect password' do
      expect(user.authenticate('wrong_password')).to be_falsy
    end
  end

  describe 'cascading deletions' do
    let(:user) { create_user }
    let!(:pet) { create_pet(user) }
    let!(:appointment) { create_appointment(user, pet) }

    it 'deletes associated pets when user is deleted' do
      expect { user.destroy }.to change { Pet.count }.by(-1)
    end

    it 'deletes associated appointments when user is deleted' do
      expect { user.destroy }.to change { Appointment.count }.by(-1)
    end
  end
end
