class Appointment < ApplicationRecord
  belongs_to :user
  belongs_to :pet
  has_many :invoices
  has_many :cancellations

  validates :appointment_date, presence: true
  validates :start_time, presence: true
  validates :end_time, presence: true
  validates :duration, presence: true

  private
end
