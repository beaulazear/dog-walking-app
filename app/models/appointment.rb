class Appointment < ApplicationRecord
  belongs_to :user
  belongs_to :pet
  belongs_to :completed_by_user, class_name: 'User', optional: true
  belongs_to :walk_group, optional: true
  has_many :invoices, dependent: :nullify
  has_many :cancellations, dependent: :destroy
  has_many :appointment_shares, dependent: :destroy

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
