class Appointment < ApplicationRecord
  belongs_to :user
  belongs_to :pet
  belongs_to :completed_by_user, class_name: "User", optional: true
  belongs_to :walk_group, optional: true
  has_many :invoices, dependent: :nullify
  has_many :cancellations, dependent: :destroy
  has_many :appointment_shares, dependent: :destroy
  has_many :share_dates, through: :appointment_shares

  validates :appointment_date, presence: true
  validates :start_time, presence: true
  validates :end_time, presence: true
  validates :duration, presence: true, numericality: { greater_than: 0 }

  validate :end_time_after_start_time

  # Scopes
  scope :with_accepted_shares, -> { includes(appointment_shares: :share_dates) }

  # Get the covering walker for this appointment on a specific date
  def covering_walker_on(date)
    accepted_share = appointment_shares.accepted.find do |share|
      share.covers_date?(date)
    end
    accepted_share&.shared_with_user
  end

  # Check if appointment is shared out on a specific date
  def shared_out_on?(date, for_user:)
    return false unless user_id == for_user.id

    covering_walker_on(date).present?
  end

  # Check if user is covering this appointment on a specific date
  def covered_by?(user, on_date:)
    accepted_share = appointment_shares.accepted.find do |share|
      share.shared_with_user_id == user.id && share.covers_date?(on_date)
    end
    accepted_share.present?
  end

  private

  def end_time_after_start_time
    return unless start_time.present? && end_time.present?

    return unless end_time <= start_time

    errors.add(:end_time, "must be after start time")
  end
end
