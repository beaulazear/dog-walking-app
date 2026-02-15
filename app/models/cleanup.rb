class Cleanup < ApplicationRecord
  # Associations
  belongs_to :block
  belongs_to :user # The scooper who performed the cleanup
  has_one_attached :photo

  # Validations
  validates :latitude, :longitude, :cleanup_date, :cleanup_timestamp, presence: true
  validates :pickup_count, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validates :user_id, uniqueness: { scope: [ :block_id, :cleanup_date ], message: "has already logged a cleanup for this block today" }

  # Callbacks
  after_create :update_block_stats
  after_create :update_scooper_stats
  after_create :check_milestone_achievements
  after_create :schedule_photo_deletion

  # Scopes
  scope :for_date, ->(date) { where(cleanup_date: date) }
  scope :for_block, ->(block_id) { where(block_id: block_id) }
  scope :for_scooper, ->(user_id) { where(user_id: user_id) }
  scope :with_photos, -> { where(has_photo: true) }
  scope :this_week, -> { where("cleanup_date >= ?", 1.week.ago) }
  scope :this_month, -> { where("cleanup_date >= ?", 1.month.ago) }

  # Instance methods
  def within_block_boundary?
    # In development (no PostGIS), skip validation
    return true if Rails.env.development?

    # In production with PostGIS, check if point is within block geometry
    result = self.class.connection.select_value(
      sanitize_sql_array([
        "SELECT ST_Within(ST_SetSRID(ST_MakePoint(?, ?), 4326), geom) FROM blocks WHERE id = ?",
        longitude, latitude, block_id
      ])
    )
    result == true || result == "t"
  end

  def attach_photo!(photo_file)
    self.photo.attach(photo_file)
    update!(has_photo: true)
  end

  private

  def update_block_stats
    block.increment_pickups!(pickup_count)
    block.update!(last_cleanup_date: cleanup_date)

    # Update streak
    if block.last_cleanup_date == cleanup_date - 1.day
      block.increment!(:active_streak_days)
    else
      block.update!(active_streak_days: 1)
    end
  end

  def update_scooper_stats
    user.increment!(:total_lifetime_pickups, pickup_count)

    # Update scooper streak
    last_cleanup = user.cleanups.where("cleanup_date < ?", cleanup_date).order(cleanup_date: :desc).first

    if last_cleanup && last_cleanup.cleanup_date == cleanup_date - 1.day
      user.increment!(:current_streak_days)
      user.update!(longest_streak_days: user.current_streak_days) if user.current_streak_days > user.longest_streak_days
    else
      user.update!(current_streak_days: 1)
    end
  end

  def check_milestone_achievements
    # Check pickup count milestones
    pickup_milestones = [ 100, 500, 1000, 5000, 10000 ]
    pickup_milestones.each do |threshold|
      if user.total_lifetime_pickups >= threshold && !user.scooper_milestones.exists?(milestone_type: "pickup_count", threshold: threshold)
        create_milestone("pickup_count", threshold)
      end
    end

    # Check streak milestones
    streak_milestones = [ 7, 30, 100 ]
    streak_milestones.each do |threshold|
      if user.current_streak_days >= threshold && !user.scooper_milestones.exists?(milestone_type: "streak", threshold: threshold)
        create_milestone("streak", threshold)
      end
    end
  end

  def create_milestone(type, threshold)
    titles = {
      "pickup_count" => {
        100 => "Rookie Scooper",
        500 => "Street Sweeper",
        1000 => "Block Captain",
        5000 => "Neighborhood Hero",
        10000 => "Legend"
      },
      "streak" => {
        7 => "7-Day Streak",
        30 => "30-Day Streak",
        100 => "100-Day Streak"
      }
    }

    ScooperMilestone.create!(
      user: user,
      milestone_type: type,
      threshold: threshold,
      title: titles.dig(type, threshold) || "#{threshold} #{type}",
      achieved_at: Time.current
    )
  end

  def schedule_photo_deletion
    # Photos are automatically deleted after 14 days via S3 lifecycle policy
    # This is just a marker - actual deletion happens on S3
  end
end
