class Appointment < ApplicationRecord
  belongs_to :user
  belongs_to :pet
  has_many :invoices

  # validates that at least one is true, recurring or appointment date, but both can't be true... still need to figure out how to do this.

  # write custom validation, checks for any true.. mon-sun, 

  validates :appointment_date, presence: true
  # validates :recurring, presence: true
  validates :start_time, presence: true
  validates :end_time, presence: true
  validates :duration, presence: true
end
