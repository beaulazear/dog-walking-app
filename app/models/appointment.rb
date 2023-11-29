class Appointment < ApplicationRecord
  belongs_to :user
  belongs_to :pet
  has_many :invoices

  validates :appointment_date, presence: true
  validates :start_time, presence: true
  validates :end_time, presence: true
  validates :duration, presence: true
end
