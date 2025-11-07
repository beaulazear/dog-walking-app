class AppointmentShare < ApplicationRecord
  # Associations
  belongs_to :appointment
  belongs_to :shared_by_user, class_name: 'User'
  belongs_to :shared_with_user, class_name: 'User'

  # Validations
  validates :status, presence: true, inclusion: { in: %w[pending accepted declined] }
  validates :shared_with_user_id,
            uniqueness: { scope: :appointment_id, message: 'Appointment already shared with this user' }
  validate :users_must_be_connected
  validate :cannot_share_with_self

  # Scopes
  scope :pending, -> { where(status: 'pending') }
  scope :accepted, -> { where(status: 'accepted') }
  scope :declined, -> { where(status: 'declined') }
  scope :for_user, ->(user_id) { where(shared_with_user_id: user_id) }
  scope :by_user, ->(user_id) { where(shared_by_user_id: user_id) }

  # Callbacks
  after_update :update_appointment_delegation_status, if: :saved_change_to_status?

  # Instance methods
  def accept!
    transaction do
      update!(status: 'accepted')
      appointment.update!(delegation_status: 'delegated')
    end
  end

  def decline!
    update(status: 'declined')
  end

  private

  def users_must_be_connected
    return if shared_by_user_id.blank? || shared_with_user_id.blank?

    connection_exists = WalkerConnection.accepted.where(
      '(user_id = ? AND connected_user_id = ?) OR (user_id = ? AND connected_user_id = ?)',
      shared_by_user_id, shared_with_user_id, shared_with_user_id, shared_by_user_id
    ).exists?

    return if connection_exists

    errors.add(:base, 'You must be connected with this user to share appointments')
  end

  def cannot_share_with_self
    return unless shared_by_user_id == shared_with_user_id

    errors.add(:shared_with_user_id, 'Cannot share appointment with yourself')
  end

  def update_appointment_delegation_status
    if status == 'accepted'
      appointment.update(delegation_status: 'delegated')
    elsif status == 'declined' && !appointment.appointment_shares.accepted.exists?
      # Reset to 'none' if all shares are declined/pending
      appointment.update(delegation_status: 'none')
    end
  end
end
