require 'rails_helper'

RSpec.describe Invoice, type: :model do
  describe 'associations' do
    it 'belongs to appointment' do
      expect(Invoice.reflect_on_association(:appointment).macro).to eq(:belongs_to)
    end

    it 'belongs to pet' do
      expect(Invoice.reflect_on_association(:pet).macro).to eq(:belongs_to)
    end
  end

  describe 'validations' do
    let(:user) { create_user }
    let(:pet) { create_pet(user) }
    let(:appointment) { create_appointment(user, pet) }
    let(:valid_attributes) do
      {
        appointment: appointment,
        pet: pet,
        date_completed: Date.current,
        compensation: 30
      }
    end

    it 'is valid with valid attributes' do
      invoice = Invoice.new(valid_attributes)
      expect(invoice).to be_valid
    end

    it 'validates presence of date_completed' do
      invoice = Invoice.new(valid_attributes.merge(date_completed: nil))
      expect(invoice).to_not be_valid
      expect(invoice.errors[:date_completed]).to include("can't be blank")
    end

    it 'validates presence of compensation' do
      invoice = Invoice.new(valid_attributes.merge(compensation: nil))
      expect(invoice).to_not be_valid
      expect(invoice.errors[:compensation]).to include("can't be blank")
    end
  end

  describe 'default values' do
    let(:invoice) { create_invoice }

    it 'defaults paid to false' do
      expect(invoice.paid).to be false
    end

    it 'defaults pending to false' do
      expect(invoice.pending).to be false
    end

    it 'defaults cancelled to false' do
      expect(invoice.cancelled).to be false
    end
  end

  describe 'invoice states' do
    let(:invoice) { create_invoice }

    it 'can be marked as paid' do
      invoice.update(paid: true)
      expect(invoice.paid).to be true
    end

    it 'can be marked as pending' do
      invoice.update(pending: true)
      expect(invoice.pending).to be true
    end

    it 'can be marked as cancelled' do
      invoice.update(cancelled: true)
      expect(invoice.cancelled).to be true
    end
  end

  describe 'relationships' do
    let(:user) { create_user }
    let(:pet) { create_pet(user) }
    let(:appointment) { create_appointment(user, pet) }
    let(:invoice) { create_invoice(appointment, pet) }

    it 'belongs to the correct appointment and pet' do
      expect(invoice.appointment).to eq(appointment)
      expect(invoice.pet).to eq(pet)
    end

    it 'has access to user through appointment' do
      expect(invoice.appointment.user).to eq(user)
    end
  end

  describe 'invoice creation with custom attributes' do
    it 'can be created with a custom title' do
      invoice = create_invoice(title: 'Custom walk title')
      expect(invoice.title).to eq('Custom walk title')
    end

    it 'can be created with custom compensation' do
      invoice = create_invoice(compensation: 45)
      expect(invoice.compensation).to eq(45)
    end
  end
end
