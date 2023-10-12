class Appointment < ApplicationRecord
  belongs_to :user
  belongs_to :pet

  # validates that at least one is true, recurring or appointment date, but both can't be true... still need to figure out how to do this.

  # validates :appointment_date, presence: true
  # validates :recurring, presence: true
  validates :start_time, presence: true
  validates :end_time, presence: true
  validates :duration, presence: true
end
