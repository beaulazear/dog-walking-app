class ModerationAction < ApplicationRecord
  belongs_to :user
  belongs_to :moderator, class_name: "User"
  belongs_to :report, optional: true

  validates :action_type, presence: true, inclusion: {
    in: %w[warned suspended banned content_deleted unsuspended unbanned],
    message: "%{value} is not a valid action type"
  }

  scope :recent, -> { order(created_at: :desc) }
  scope :by_type, ->(type) { where(action_type: type) }

  # Action types with human-friendly labels
  ACTION_TYPES = {
    warned: "User warned",
    suspended: "User suspended",
    banned: "User banned",
    content_deleted: "Content deleted",
    unsuspended: "User unsuspended",
    unbanned: "User unbanned"
  }.freeze

  # Instance methods
  def active?
    case action_type
    when "suspended"
      expires_at.present? && expires_at > Time.current
    when "banned"
      true # Bans don't expire unless explicitly reversed
    else
      false
    end
  end

  def expired?
    expires_at.present? && expires_at <= Time.current
  end

  def action_label
    ACTION_TYPES[action_type.to_sym] || action_type.humanize
  end
end
