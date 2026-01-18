class ShareDate < ApplicationRecord
  belongs_to :appointment_share

  validates :date, presence: true
  validates :date, uniqueness: { scope: :appointment_share_id }
  validate :date_must_be_future
  validate :date_must_match_appointment_schedule

  private

  def date_must_be_future
    return unless date.present? && date <= Date.today

    errors.add(:date, "must be in the future")
  end

  def date_must_match_appointment_schedule
    return unless date.present? && appointment_share&.appointment

    appointment = appointment_share.appointment
    return unless appointment.recurring

    day_name = date.strftime("%A").downcase
    return if appointment.send(day_name)

    errors.add(:date, "doesn't match appointment schedule")
  end
end
