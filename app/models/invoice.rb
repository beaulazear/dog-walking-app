class Invoice < ApplicationRecord
  belongs_to :appointment
  belongs_to :pet

  validates :date_completed, presence: true
  validates :compensation, presence: true
end
