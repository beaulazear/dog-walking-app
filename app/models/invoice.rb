class Invoice < ApplicationRecord
  belongs_to :appointment
  belongs_to :pet

  validates :date_completed, presence: true
  validates :compensation, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validates :title, presence: true
end
