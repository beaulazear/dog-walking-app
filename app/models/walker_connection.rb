class WalkerConnection < ApplicationRecord
  # Associations
  belongs_to :user
  belongs_to :connected_user, class_name: "User"

  # Validations
  validates :status, presence: true, inclusion: { in: %w[pending accepted declined blocked] }
  validates :connected_user_id, uniqueness: { scope: :user_id, message: "Connection already exists" }
  validate :cannot_connect_to_self

  # Scopes
  scope :pending, -> { where(status: "pending") }
  scope :accepted, -> { where(status: "accepted") }
  scope :declined, -> { where(status: "declined") }
  scope :blocked, -> { where(status: "blocked") }
  scope :for_user, ->(user_id) { where(user_id: user_id).or(where(connected_user_id: user_id)) }

  # Instance methods
  def accept!
    update(status: "accepted")
  end

  def decline!
    update(status: "declined")
  end

  def block!
    update(status: "blocked")
  end

  def other_user(current_user)
    user_id == current_user.id ? connected_user : user
  end

  def initiated_by?(current_user)
    user_id == current_user.id
  end

  private

  def cannot_connect_to_self
    return unless user_id == connected_user_id

    errors.add(:connected_user_id, "Cannot connect to yourself")
  end
end
