require 'rails_helper'

RSpec.describe Cancellation, type: :model do
  describe 'associations' do
    it 'belongs to appointment' do
      expect(Cancellation.reflect_on_association(:appointment).macro).to eq(:belongs_to)
    end
  end

  describe 'validations' do
    let(:user) { create_user }
    let(:pet) { create_pet(user) }
    let(:appointment) { create_appointment(user, pet) }
    let(:valid_attributes) do
      {
        appointment: appointment,
        date: Date.current + 3.days
      }
    end

    it 'is valid with valid attributes' do
      cancellation = Cancellation.new(valid_attributes)
      expect(cancellation).to be_valid
    end

    it 'validates date must be in the future' do
      cancellation = Cancellation.new(valid_attributes.merge(date: Date.current))
      expect(cancellation).to_not be_valid
      expect(cancellation.errors[:date]).to include('must be in the future')
    end

    it 'validates date must be in the future (yesterday should fail)' do
      cancellation = Cancellation.new(valid_attributes.merge(date: Date.yesterday))
      expect(cancellation).to_not be_valid
      expect(cancellation.errors[:date]).to include('must be in the future')
    end

    it 'validates uniqueness of date scoped to appointment_id' do
      create_cancellation(appointment, date: Date.current + 3.days)
      duplicate_cancellation = Cancellation.new(valid_attributes.merge(date: Date.current + 3.days))

      expect(duplicate_cancellation).to_not be_valid
      expect(duplicate_cancellation.errors[:date]).to include('already selected for cancellation')
    end

    it 'allows same date for different appointments' do
      another_appointment = create_appointment(user, pet)
      create_cancellation(appointment, date: Date.current + 3.days)

      another_cancellation = Cancellation.new(
        appointment: another_appointment,
        date: Date.current + 3.days
      )

      expect(another_cancellation).to be_valid
    end
  end

  describe 'future date validation' do
    let(:appointment) { create_appointment }

    it 'allows date that is tomorrow' do
      cancellation = create_cancellation(appointment, date: Date.tomorrow + 1.day)
      expect(cancellation).to be_valid
    end

    it 'allows date that is far in the future' do
      cancellation = create_cancellation(appointment, date: Date.current + 30.days)
      expect(cancellation).to be_valid
    end
  end

  describe 'relationship with appointment' do
    let(:user) { create_user }
    let(:pet) { create_pet(user) }
    let(:appointment) { create_appointment(user, pet) }
    let(:cancellation) { create_cancellation(appointment) }

    it 'belongs to the correct appointment' do
      expect(cancellation.appointment).to eq(appointment)
    end

    it 'can access appointment details through association' do
      expect(cancellation.appointment.user).to eq(user)
      expect(cancellation.appointment.pet).to eq(pet)
    end
  end
end
