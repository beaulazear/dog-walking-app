require 'rails_helper'

RSpec.describe AdditionalIncome, type: :model do
  describe 'associations' do
    it 'belongs to pet' do
      expect(AdditionalIncome.reflect_on_association(:pet).macro).to eq(:belongs_to)
    end
  end

  describe 'validations' do
    let(:user) { create_user }
    let(:pet) { create_pet(user) }
    let(:valid_attributes) do
      {
        pet: pet,
        description: 'Extra grooming service',
        date_added: Date.current,
        compensation: 25
      }
    end

    it 'is valid with valid attributes' do
      additional_income = AdditionalIncome.new(valid_attributes)
      expect(additional_income).to be_valid
    end

    it 'validates compensation is an integer' do
      additional_income = AdditionalIncome.new(valid_attributes.merge(compensation: 'not_a_number'))
      expect(additional_income).to_not be_valid
      expect(additional_income.errors[:compensation]).to include('is not a number')
    end

    it 'validates compensation is numeric' do
      additional_income = AdditionalIncome.new(valid_attributes.merge(compensation: 25.50))
      expect(additional_income).to_not be_valid
      expect(additional_income.errors[:compensation]).to include('must be an integer')
    end

    it 'allows zero compensation' do
      additional_income = AdditionalIncome.new(valid_attributes.merge(compensation: 0))
      expect(additional_income).to be_valid
    end

    it 'allows negative compensation' do
      additional_income = AdditionalIncome.new(valid_attributes.merge(compensation: -10))
      expect(additional_income).to be_valid
    end
  end

  describe 'relationship with pet' do
    let(:user) { create_user }
    let(:pet) { create_pet(user) }
    let(:additional_income) { create_additional_income(pet) }

    it 'belongs to the correct pet' do
      expect(additional_income.pet).to eq(pet)
    end

    it 'can access user through pet association' do
      expect(additional_income.pet.user).to eq(user)
    end
  end

  describe 'additional income creation' do
    let(:pet) { create_pet }

    it 'can be created with custom description' do
      income = create_additional_income(pet, description: 'Pet sitting overnight')
      expect(income.description).to eq('Pet sitting overnight')
    end

    it 'can be created with custom compensation' do
      income = create_additional_income(pet, compensation: 50)
      expect(income.compensation).to eq(50)
    end

    it 'can be created with custom date' do
      custom_date = Date.current - 5.days
      income = create_additional_income(pet, date_added: custom_date)
      expect(income.date_added).to eq(custom_date)
    end
  end

  describe 'multiple additional incomes for same pet' do
    let(:pet) { create_pet }

    it 'allows multiple additional incomes for the same pet' do
      income1 = create_additional_income(pet, description: 'Service 1')
      income2 = create_additional_income(pet, description: 'Service 2')

      expect(pet.additional_incomes).to include(income1, income2)
      expect(pet.additional_incomes.count).to eq(2)
    end
  end
end