class AdditionalIncome < ApplicationRecord
  validates :compensation, numericality: { only_integer: true }
  
  belongs_to :pet
end
