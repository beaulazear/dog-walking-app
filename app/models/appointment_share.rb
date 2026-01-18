class AppointmentShare < ApplicationRecord
  # Associations
  belongs_to :appointment
  belongs_to :shared_by_user, class_name: "User"
  belongs_to :shared_with_user, class_name: "User"
  has_many :share_dates, dependent: :destroy
  has_many :walker_earnings, dependent: :destroy

  # Validations
  validates :status, presence: true, inclusion: { in: %w[pending accepted declined] }
  validates :shared_with_user_id,
            uniqueness: { scope: :appointment_id, message: "Appointment already shared with this user" }
  validates :covering_walker_percentage, presence: true,
                                         numericality: { only_integer: true, greater_than_or_equal_to: 0, less_than_or_equal_to: 100 }
  validate :users_must_be_connected
  validate :cannot_share_with_self
  validate :no_overlapping_share_dates

  # Scopes
  scope :pending, -> { where(status: "pending") }
  scope :accepted, -> { where(status: "accepted") }
  scope :declined, -> { where(status: "declined") }
  scope :for_user, ->(user_id) { where(shared_with_user_id: user_id) }
  scope :by_user, ->(user_id) { where(shared_by_user_id: user_id) }

  # Callbacks
  after_update :update_appointment_delegation_status, if: :saved_change_to_status?

  # Instance methods
  def accept!
    transaction do
      update!(status: "accepted")
      appointment.update!(delegation_status: "shared")
    end
  end

  def decline!
    update(status: "declined")
  end

  # Check if this share covers a specific date
  # For one-time appointments, all dates are covered
  # For recurring appointments, only specific share_dates are covered
  def covers_date?(date)
    return true unless appointment.recurring # One-time appointments are fully shared

    share_dates.exists?(date: date)
  end

  # Calculate the percentage for the original walker (inverse of covering walker)
  def original_walker_percentage
    100 - covering_walker_percentage
  end

  # Calculate split amounts for a given total price
  # Covering walker always gets rounded amount, original walker gets remainder
  def calculate_split(total_price)
    covering_amount = (total_price * covering_walker_percentage / 100.0).round
    original_amount = total_price - covering_amount
    { covering: covering_amount, original: original_amount }
  end

  private

  def users_must_be_connected
    return if shared_by_user_id.blank? || shared_with_user_id.blank?

    connection_exists = WalkerConnection.accepted.where(
      "(user_id = ? AND connected_user_id = ?) OR (user_id = ? AND connected_user_id = ?)",
      shared_by_user_id, shared_with_user_id, shared_with_user_id, shared_by_user_id
    ).exists?

    return if connection_exists

    errors.add(:base, "You must be connected with this user to share appointments")
  end

  def cannot_share_with_self
    return unless shared_by_user_id == shared_with_user_id

    errors.add(:shared_with_user_id, "Cannot share appointment with yourself")
  end

  def update_appointment_delegation_status
    if status == "accepted"
      appointment.update(delegation_status: "shared")
    elsif status == "declined" && !appointment.appointment_shares.accepted.exists?
      # Reset to 'none' if all shares are declined/pending
      appointment.update(delegation_status: "none")
    end
  end

  def no_overlapping_share_dates
    return unless appointment && shared_with_user_id

    # For one-time appointments, check if there's already an accepted share
    return if appointment.recurring

    existing_share = appointment.appointment_shares
                                .accepted
                                .where.not(id: id)
                                .exists?

    return unless existing_share

    errors.add(:base, "This appointment is already shared with someone else")

    # NOTE: Recurring appointments are blocked by only_one_time_appointments validation,
    # so we don't need to check overlapping dates for recurring appointments
  end
end
