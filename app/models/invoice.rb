class Invoice < ApplicationRecord
  belongs_to :appointment
  belongs_to :user

  validates :date_completed, presence: true
  validates :date_completed, uniqueness: true
  validates :compensation, presence: true

end
