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

  # Scoop associations (scooper role - old block-based model)
  has_many :coverage_regions, dependent: :destroy
  has_many :claimed_blocks, through: :coverage_regions, source: :block
  has_many :active_blocks, class_name: "Block", foreign_key: "active_scooper_id"
  has_many :cleanups, dependent: :destroy
  has_many :scooper_milestones, dependent: :destroy

  # Scoop associations (job board model)
  has_many :cleanup_jobs_as_poster, class_name: "CleanupJob", foreign_key: "poster_id", dependent: :destroy
  has_many :cleanup_jobs_as_scooper, class_name: "CleanupJob", foreign_key: "scooper_id", dependent: :nullify
  has_many :recurring_cleanups_as_poster, class_name: "RecurringCleanup", foreign_key: "poster_id",
                                          dependent: :destroy
  has_many :recurring_cleanups_as_scooper, class_name: "RecurringCleanup", foreign_key: "scooper_id",
                                           dependent: :nullify
  has_many :reviews_given, class_name: "Review", foreign_key: "reviewer_id", dependent: :destroy
  has_many :reviews_received, class_name: "Review", foreign_key: "scooper_id", dependent: :destroy

  # MVP v3: Block sponsorship associations
  has_many :sponsorships_as_sponsor, class_name: "Sponsorship", foreign_key: "sponsor_id", dependent: :destroy
  has_many :sponsorships_as_scooper, class_name: "Sponsorship", foreign_key: "scooper_id", dependent: :nullify
  has_many :sweeps, foreign_key: "scooper_id", dependent: :destroy
  has_many :contributions, foreign_key: "contributor_id", dependent: :destroy
  has_many :sponsorship_ratings_given, class_name: "SponsorshipRating", foreign_key: "sponsor_id",
                                       dependent: :destroy
  has_many :sponsorship_ratings_received, class_name: "SponsorshipRating", foreign_key: "scooper_id",
                                          dependent: :destroy

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

  # Only validate dog walking rates for Pocket Walks users
  validates :thirty, :fortyfive, :sixty, :solo_rate, :training_rate, :sibling_rate,
            numericality: { only_integer: true, greater_than_or_equal_to: 0 },
            if: :uses_pocket_walks?

  # Admin helper method
  def admin?
    admin == true
  end

  def profile_pic_url
    return nil unless profile_pic.attached?

    # In production with S3, use url for direct S3 URLs
    # In development/test, use rails_blob_url for local storage
    begin
      if Rails.env.production?
        # Generate S3 URL using service method
        # Use blob's service to get the direct S3 URL
        # Note: AWS S3 presigned URLs have a maximum expiration of 1 week
        profile_pic.blob.service.url(
          profile_pic.blob.key,
          expires_in: 7.days,
          disposition: "inline",
          filename: profile_pic.blob.filename,
          content_type: profile_pic.blob.content_type
        )
      else
        # For development/test, use blob URL for local storage
        Rails.application.routes.url_helpers.rails_blob_url(profile_pic, only_path: true)
      end
    rescue StandardError => e
      # Log the error with full details
      Rails.logger.error("Error generating profile_pic_url: #{e.class} - #{e.message}")
      Rails.logger.error(e.backtrace.first(5).join("\n"))
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

  # MVP v3: Dog walker and poster helper methods
  def display_name_for_sponsorship(preference = "first_name", custom_name = nil)
    case preference
    when "business"
      business_name || name
    when "anonymous"
      "A neighbor"
    else
      name&.split&.first || "Anonymous"
    end
  end

  def calculate_overall_rating
    job_ratings = reviews_received.average(:rating).to_f
    sponsorship_ratings = sponsorship_ratings_received.average(:overall_rating).to_f

    return 0.0 if job_ratings.zero? && sponsorship_ratings.zero?

    if job_ratings.zero?
      sponsorship_ratings
    elsif sponsorship_ratings.zero?
      job_ratings
    else
      ((job_ratings + sponsorship_ratings) / 2.0).round(2)
    end
  end

  def update_overall_rating!
    update(overall_rating: calculate_overall_rating)
  end

  # Public profile data for map/sponsorships
  def public_profile
    {
      id:,
      name:,
      is_dog_walker:,
      instagram_handle:,
      business_name:,
      overall_rating: overall_rating.to_f,
      total_pickups:,
      profile_photo_url:,
      neighborhoods:
    }
  end

  # App tracking helpers
  def mark_app_usage!(app_name)
    case app_name.to_s
    when "pocket_walks"
      update(uses_pocket_walks: true, registered_from_app: registered_from_app || "pocket_walks")
    when "scoopers"
      update(uses_scoopers: true, registered_from_app: registered_from_app || "scoopers")
    end
  end

  def app_list
    apps = []
    apps << "Pocket Walks" if uses_pocket_walks?
    apps << "Scoopers" if uses_scoopers?
    apps.join(", ")
  end
end
