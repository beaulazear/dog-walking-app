class Invoice < ApplicationRecord
  belongs_to :appointment
  belongs_to :pet

  validates :date_completed, presence: true
  validates :compensation, presence: true, numericality: { greater_than: 0 }
  validates :title, presence: true
end
