class User < ApplicationRecord
  has_secure_password

  has_one_attached :profile_pic

  has_many :pets
  has_many :appointments, foreign_key: "user_id"
  has_many :pet_sits, dependent: :destroy
  has_many :invoices, through: :pets
  has_many :training_sessions, dependent: :destroy
  has_many :blogs, dependent: :destroy
  has_one :certification_goal, dependent: :destroy
  has_many :milestones, dependent: :destroy
  has_many :books, dependent: :destroy
  has_many :walk_groups, dependent: :destroy

  # Walker connections (team management)
  has_many :initiated_connections, class_name: "WalkerConnection", foreign_key: "user_id", dependent: :destroy
  has_many :received_connections, class_name: "WalkerConnection", foreign_key: "connected_user_id", dependent: :destroy

  # Appointment shares
  has_many :shared_appointments, class_name: "AppointmentShare", foreign_key: "shared_by_user_id", dependent: :destroy
  has_many :received_appointment_shares, class_name: "AppointmentShare", foreign_key: "shared_with_user_id",
                                         dependent: :destroy
  has_many :completed_appointments, class_name: "Appointment", foreign_key: "completed_by_user_id"

  # Walker earnings (for covering shared appointments)
  has_many :walker_earnings, foreign_key: "walker_id", dependent: :destroy

  # Scoop associations (scooper role)
  has_many :coverage_regions, dependent: :destroy
  has_many :claimed_blocks, through: :coverage_regions, source: :block
  has_many :active_blocks, class_name: "Block", foreign_key: "active_scooper_id"
  has_many :cleanups, dependent: :destroy
  has_many :scooper_milestones, dependent: :destroy

  # Helper method to get all connections (both initiated and received)
  def all_connections
    WalkerConnection.where(user_id: id).or(WalkerConnection.where(connected_user_id: id))
  end

  def connected_walkers
    accepted_initiated = initiated_connections.accepted.includes(:connected_user).map(&:connected_user)
    accepted_received = received_connections.accepted.includes(:user).map(&:user)
    (accepted_initiated + accepted_received).uniq
  end

  validates :username, uniqueness: true, presence: true
  validates :name, presence: true
  validates :email_address, presence: true

  validates :thirty, :fortyfive, :sixty, :solo_rate, :training_rate, :sibling_rate, numericality: { only_integer: true }

  def profile_pic_url
    return nil unless profile_pic.attached?

    # In production with S3, use service_url for direct S3 URLs to avoid redirect issues
    # In development/test, use rails_blob_url for local storage
    begin
      if Rails.env.production?
        # service_url generates a direct S3 URL that doesn't require Rails to proxy
        profile_pic.service_url(expires_in: 1.year, disposition: "inline")
      else
        # For development/test, use blob URL for local storage
        Rails.application.routes.url_helpers.rails_blob_url(profile_pic, only_path: true)
      end
    rescue StandardError => e
      # Log the error and return nil to prevent breaking serialization
      Rails.logger.error("Error generating profile_pic_url: #{e.message}")
      nil
    end
  end

  # Training-related methods
  def total_training_hours
    (training_sessions.sum(:duration_minutes) / 60.0).round(1)
  end

  def total_training_sessions
    training_sessions.count
  end

  def current_streak
    sessions = training_sessions.order(session_date: :desc)
    return 0 if sessions.empty?

    streak = 0
    current_date = Date.current

    sessions.group_by { |s| s.session_date.to_date }.each_key do |date|
      break if date < current_date - streak.days

      streak += 1 if date == current_date - streak.days
    end

    streak
  end

  def longest_streak
    sessions = training_sessions.order(:session_date)
    return 0 if sessions.empty?

    max_streak = 0
    current_streak = 1

    sessions.each_cons(2) do |prev, curr|
      if curr.session_date.to_date == prev.session_date.to_date + 1.day
        current_streak += 1
      else
        max_streak = [ max_streak, current_streak ].max
        current_streak = 1
      end
    end

    [ max_streak, current_streak ].max
  end

  def check_and_create_milestones!
    total_hours = total_training_hours.to_i

    Milestone::MILESTONE_HOURS.each do |milestone_hours|
      next if total_hours < milestone_hours
      next if milestones.exists?(hours_reached: milestone_hours)

      milestones.create!(
        hours_reached: milestone_hours,
        achieved_at: Time.current
      )
    end
  end
end
