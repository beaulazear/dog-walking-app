class Report < ApplicationRecord
  # Polymorphic association - can report any content type
  belongs_to :reportable, polymorphic: true
  belongs_to :reporter, class_name: "User"
  belongs_to :reviewed_by, class_name: "User", optional: true

  has_many :moderation_actions, dependent: :destroy

  # Validations
  validates :reason, presence: true, inclusion: {
    in: %w[inappropriate_photo fake_report harassment spam other],
    message: "%{value} is not a valid report reason"
  }
  validates :status, presence: true, inclusion: {
    in: %w[pending reviewing resolved dismissed],
    message: "%{value} is not a valid status"
  }
  validates :resolution_action, inclusion: {
    in: %w[content_deleted user_warned user_suspended user_banned dismissed no_action],
    allow_nil: true
  }

  # Scopes
  scope :pending, -> { where(status: "pending") }
  scope :resolved, -> { where(status: "resolved") }
  scope :dismissed, -> { where(status: "dismissed") }
  scope :overdue, -> { pending.where("created_at < ?", 24.hours.ago) }
  scope :recent, -> { order(created_at: :desc) }

  # Callbacks
  after_create :increment_user_reports_count
  after_create :notify_admin_of_new_report

  # Report reasons with human-friendly labels
  REASONS = {
    inappropriate_photo: "Inappropriate photo",
    fake_report: "Fake or spam report",
    harassment: "Harassment",
    spam: "Spam",
    other: "Other"
  }.freeze

  # Resolution actions
  RESOLUTION_ACTIONS = {
    content_deleted: "Content deleted",
    user_warned: "User warned",
    user_suspended: "User suspended",
    user_banned: "User banned",
    dismissed: "Report dismissed",
    no_action: "No action taken"
  }.freeze

  # Instance methods
  def reported_user
    case reportable_type
    when "Sighting"
      reportable.reporter_id.present? ? User.find_by(id: reportable.reporter_id) : nil
    when "CleanupJob"
      reportable.poster
    when "User"
      reportable
    else
      nil
    end
  end

  def reported_content_preview
    case reportable_type
    when "Sighting"
      "Sighting at #{reportable.address}"
    when "CleanupJob"
      "Job at #{reportable.address}"
    when "User"
      "User: #{reportable.username || reportable.name}"
    else
      "N/A"
    end
  end

  def overdue?
    pending? && created_at < 24.hours.ago
  end

  def pending?
    status == "pending"
  end

  def reviewing?
    status == "reviewing"
  end

  def resolved?
    status == "resolved"
  end

  def dismissed?
    status == "dismissed"
  end

  def mark_as_reviewing!(admin_user)
    update!(
      status: "reviewing",
      reviewed_by: admin_user,
      reviewed_at: Time.current
    )
  end

  def resolve!(action, notes, admin_user)
    transaction do
      update!(
        status: "resolved",
        resolution_action: action,
        resolution_notes: notes,
        reviewed_by: admin_user,
        reviewed_at: Time.current
      )

      # Execute the action
      execute_resolution_action(action, admin_user)
    end
  end

  def dismiss!(reason, admin_user)
    update!(
      status: "dismissed",
      resolution_action: "dismissed",
      resolution_notes: reason,
      reviewed_by: admin_user,
      reviewed_at: Time.current
    )
  end

  private

  def execute_resolution_action(action, admin_user)
    user = reported_user
    return unless user

    case action
    when "content_deleted"
      delete_reported_content
      create_moderation_log(admin_user, "content_deleted", "Content removed")
    when "user_warned"
      user.warn!(resolution_notes, admin_user, self)
    when "user_suspended"
      user.suspend!(7.days, resolution_notes, admin_user, self)
    when "user_banned"
      user.ban!(resolution_notes, admin_user, self)
    end
  end

  def delete_reported_content
    return unless reportable.respond_to?(:destroy)

    # Soft delete or hard delete depending on model
    if reportable.respond_to?(:deleted_at)
      reportable.update(deleted_at: Time.current)
    else
      reportable.destroy
    end
  end

  def create_moderation_log(admin_user, action_type, details)
    ModerationAction.create!(
      user: reported_user,
      moderator: admin_user,
      report: self,
      action_type: action_type,
      reason: reason,
      details: details
    )
  end

  def increment_user_reports_count
    user = reported_user
    return unless user

    user.increment!(:reports_count)
  end

  def notify_admin_of_new_report
    # Will be implemented when email service is set up
    # ReportMailer.new_report_notification(self).deliver_later
    Rails.logger.info "📧 New report ##{id} created - Admin notification pending"
  end
end
