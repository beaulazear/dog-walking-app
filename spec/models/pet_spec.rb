require 'rails_helper'

RSpec.describe Pet, type: :model do
  describe 'associations' do
    it 'belongs to user' do
      expect(Pet.reflect_on_association(:user).macro).to eq(:belongs_to)
    end

    it 'has many appointments with dependent destroy' do
      association = Pet.reflect_on_association(:appointments)
      expect(association.macro).to eq(:has_many)
      expect(association.options[:dependent]).to eq(:destroy)
    end

    it 'has many invoices with dependent destroy' do
      association = Pet.reflect_on_association(:invoices)
      expect(association.macro).to eq(:has_many)
      expect(association.options[:dependent]).to eq(:destroy)
    end

    it 'has many additional_incomes with dependent destroy' do
      association = Pet.reflect_on_association(:additional_incomes)
      expect(association.macro).to eq(:has_many)
      expect(association.options[:dependent]).to eq(:destroy)
    end

    it 'has one attached profile_pic' do
      pet = create_pet
      expect(pet.profile_pic).to be_an_instance_of(ActiveStorage::Attached::One)
    end
  end

  describe 'validations' do
    let(:user) { create_user }
    let(:valid_attributes) do
      {
        user: user,
        name: 'Buddy',
        birthdate: Date.current - 2.years,
        sex: 'male',
        spayed_neutered: true,
        address: '123 Test Street',
        behavorial_notes: 'Friendly dog',
        supplies_location: 'Garage',
        allergies: 'None'
      }
    end

    it 'is valid with valid attributes' do
      pet = Pet.new(valid_attributes)
      expect(pet).to be_valid
    end

    it 'validates presence of name' do
      pet = Pet.new(valid_attributes.merge(name: nil))
      expect(pet).to_not be_valid
      expect(pet.errors[:name]).to include("can't be blank")
    end

    it 'validates presence of address' do
      pet = Pet.new(valid_attributes.merge(address: nil))
      expect(pet).to_not be_valid
      expect(pet.errors[:address]).to include("can't be blank")
    end

    it 'validates presence of supplies_location' do
      pet = Pet.new(valid_attributes.merge(supplies_location: nil))
      expect(pet).to_not be_valid
      expect(pet.errors[:supplies_location]).to include("can't be blank")
    end

    it 'validates presence of behavorial_notes' do
      pet = Pet.new(valid_attributes.merge(behavorial_notes: nil))
      expect(pet).to_not be_valid
      expect(pet.errors[:behavorial_notes]).to include("can't be blank")
    end

    it 'validates presence of birthdate' do
      pet = Pet.new(valid_attributes.merge(birthdate: nil))
      expect(pet).to_not be_valid
      expect(pet.errors[:birthdate]).to include("can't be blank")
    end

    it 'validates birthdate is in the past' do
      pet = Pet.new(valid_attributes.merge(birthdate: Date.current + 1.day))
      expect(pet).to_not be_valid
      expect(pet.errors[:birthdate]).to include('Must be in the past')
    end
  end

  describe '#profile_pic_url' do
    let(:pet) { create_pet }

    context 'when profile pic is attached' do
      before do
        # Create a simple test file
        file = Tempfile.new(['test', '.jpg'])
        pet.profile_pic.attach(io: file, filename: 'test.jpg', content_type: 'image/jpeg')
        file.close
      end

      it 'returns the blob URL' do
        expect(pet.profile_pic_url).to be_present
        expect(pet.profile_pic_url).to include('rails/active_storage/blobs')
      end
    end

    context 'when profile pic is not attached' do
      it 'returns nil' do
        expect(pet.profile_pic_url).to be_nil
      end
    end
  end

  describe 'dependent destroy' do
    let(:pet) { create_pet }
    let!(:appointment) { create_appointment(pet.user, pet) }
    let!(:invoice) { create_invoice(appointment, pet) }
    let!(:additional_income) { create_additional_income(pet) }

    it 'destroys associated appointments when pet is deleted' do
      expect { pet.destroy }.to change { Appointment.count }.by(-1)
    end

    it 'destroys associated invoices when pet is deleted' do
      expect { pet.destroy }.to change { Invoice.count }.by(-1)
    end

    it 'destroys associated additional incomes when pet is deleted' do
      expect { pet.destroy }.to change { AdditionalIncome.count }.by(-1)
    end
  end

  describe 'default values' do
    it 'defaults active to true' do
      pet = create_pet
      expect(pet.active).to be true
    end
  end
end
