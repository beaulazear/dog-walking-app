class BlockedUser < ApplicationRecord
  belongs_to :blocker, class_name: "User"
  belongs_to :blocked, class_name: "User"

  validates :blocker_id, presence: true
  validates :blocked_id, presence: true
  validates :blocker_id, uniqueness: { scope: :blocked_id, message: "has already blocked this user" }
  validate :cannot_block_self

  scope :for_user, ->(user_id) { where(blocker_id: user_id) }
  scope :recent, -> { order(created_at: :desc) }

  private

  def cannot_block_self
    if blocker_id == blocked_id
      errors.add(:base, "You cannot block yourself")
    end
  end
end
