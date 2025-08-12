class Appointment < ApplicationRecord
  belongs_to :user
  belongs_to :pet
  has_many :invoices
  has_many :cancellations

  validates :appointment_date, presence: true
  validates :start_time, presence: true
  validates :end_time, presence: true
  validates :duration, presence: true, numericality: { greater_than: 0 }

  validate :end_time_after_start_time

  private

  def end_time_after_start_time
    return unless start_time.present? && end_time.present?

    return unless end_time <= start_time

    errors.add(:end_time, 'must be after start time')
  end
end
