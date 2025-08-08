class AdditionalIncome < ApplicationRecord
  validates :compensation, numericality: { only_integer: true }
  validates :description, presence: true
  validates :date_added, presence: true

  belongs_to :pet
end
