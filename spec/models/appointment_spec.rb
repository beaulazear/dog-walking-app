require 'rails_helper'

RSpec.describe Appointment, type: :model do
  describe 'associations' do
    it 'belongs to user' do
      expect(Appointment.reflect_on_association(:user).macro).to eq(:belongs_to)
    end

    it 'belongs to pet' do
      expect(Appointment.reflect_on_association(:pet).macro).to eq(:belongs_to)
    end

    it 'has many invoices' do
      expect(Appointment.reflect_on_association(:invoices).macro).to eq(:has_many)
    end

    it 'has many cancellations' do
      expect(Appointment.reflect_on_association(:cancellations).macro).to eq(:has_many)
    end
  end

  describe 'validations' do
    let(:user) { create_user }
    let(:pet) { create_pet(user) }
    let(:valid_attributes) do
      {
        user: user,
        pet: pet,
        appointment_date: Date.current + 1.day,
        start_time: '09:00',
        end_time: '10:00',
        duration: 60
      }
    end

    it 'is valid with valid attributes' do
      appointment = Appointment.new(valid_attributes)
      expect(appointment).to be_valid
    end

    it 'validates presence of appointment_date' do
      appointment = Appointment.new(valid_attributes.merge(appointment_date: nil))
      expect(appointment).to_not be_valid
      expect(appointment.errors[:appointment_date]).to include("can't be blank")
    end

    it 'validates presence of start_time' do
      appointment = Appointment.new(valid_attributes.merge(start_time: nil))
      expect(appointment).to_not be_valid
      expect(appointment.errors[:start_time]).to include("can't be blank")
    end

    it 'validates presence of end_time' do
      appointment = Appointment.new(valid_attributes.merge(end_time: nil))
      expect(appointment).to_not be_valid
      expect(appointment.errors[:end_time]).to include("can't be blank")
    end

    it 'validates presence of duration' do
      appointment = Appointment.new(valid_attributes.merge(duration: nil))
      expect(appointment).to_not be_valid
      expect(appointment.errors[:duration]).to include("can't be blank")
    end
  end

  describe 'boolean attributes default values' do
    let(:appointment) { create_appointment }

    it 'defaults recurring to false' do
      expect(appointment.recurring).to be false
    end

    it 'defaults solo to false' do
      expect(appointment.solo).to be false
    end

    it 'defaults completed to false' do
      expect(appointment.completed).to be false
    end

    it 'defaults canceled to false' do
      expect(appointment.canceled).to be false
    end

    it 'defaults all weekday flags to false' do
      expect(appointment.monday).to be false
      expect(appointment.tuesday).to be false
      expect(appointment.wednesday).to be false
      expect(appointment.thursday).to be false
      expect(appointment.friday).to be false
      expect(appointment.saturday).to be false
      expect(appointment.sunday).to be false
    end
  end

  describe 'recurring appointments' do
    let(:recurring_appointment) do
      create_appointment(recurring: true, monday: true, wednesday: true, friday: true)
    end

    it 'can be created as recurring' do
      expect(recurring_appointment.recurring).to be true
      expect(recurring_appointment.monday).to be true
      expect(recurring_appointment.wednesday).to be true
      expect(recurring_appointment.friday).to be true
    end
  end

  describe 'appointment relationships' do
    let(:user) { create_user }
    let(:pet) { create_pet(user) }
    let(:appointment) { create_appointment(user, pet) }

    it 'belongs to the correct user and pet' do
      expect(appointment.user).to eq(user)
      expect(appointment.pet).to eq(pet)
    end

    it 'can have multiple invoices' do
      invoice1 = create_invoice(appointment, pet)
      invoice2 = create_invoice(appointment, pet, title: 'Second invoice')
      
      expect(appointment.invoices).to include(invoice1, invoice2)
      expect(appointment.invoices.count).to eq(2)
    end

    it 'can have multiple cancellations' do
      cancellation1 = create_cancellation(appointment, date: Date.current + 3.days)
      cancellation2 = create_cancellation(appointment, date: Date.current + 5.days)
      
      expect(appointment.cancellations).to include(cancellation1, cancellation2)
      expect(appointment.cancellations.count).to eq(2)
    end
  end
end
