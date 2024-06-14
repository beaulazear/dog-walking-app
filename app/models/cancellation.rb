class Cancellation < ApplicationRecord
  belongs_to :appointment

  validate :date_must_be_in_the_future
  validates :date, uniqueness: { scope: :appointment_id, message: "already selected for cancellation" }

  private

  def date_must_be_in_the_future
    if date.present? && date <= Date.tomorrow
      errors.add(:date, "must be in the future")
    end
  end
end
