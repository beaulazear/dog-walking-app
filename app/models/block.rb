class Block < ApplicationRecord
  # Associations
  has_many :coverage_regions, dependent: :destroy
  has_many :scoopers, through: :coverage_regions, source: :user
  has_many :pledges, dependent: :destroy
  has_many :residents, through: :pledges, source: :client
  has_many :cleanups, dependent: :destroy
  has_many :poop_reports, dependent: :destroy
  belongs_to :active_scooper, class_name: "User", foreign_key: "active_scooper_id", optional: true

  # Validations
  validates :block_id, presence: true, uniqueness: true
  validates :geojson, presence: true
  validates :status, presence: true, inclusion: { in: %w[inactive pledging active warning] }

  # Scopes
  scope :active, -> { where(status: "active") }
  scope :inactive, -> { where(status: "inactive") }
  scope :pledging, -> { where(status: "pledging") }
  scope :warning, -> { where(status: "warning") }
  scope :by_borough, ->(borough) { where(borough: borough) }
  scope :by_neighborhood, ->(neighborhood) { where(neighborhood: neighborhood) }

  # Class methods
  def self.nearby(latitude, longitude, radius_meters = 1000)
    # In development (no PostGIS), use simple bounding box
    if Rails.env.development?
      lat_delta = radius_meters / 111_000.0
      lng_delta = radius_meters / (111_000.0 * Math.cos(latitude * Math::PI / 180))

      # This is a simplified approach - just returns all blocks for now
      all
    else
      # In production with PostGIS, use actual spatial query
      where("ST_DWithin(geom, ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography, ?)",
            longitude, latitude, radius_meters)
    end
  end

  # Instance methods
  def total_pledge_amount
    pledges.where(status: "pending").sum(:amount)
  end

  def pledge_progress_percentage
    return 0 unless active_monthly_rate.present? && active_monthly_rate > 0
    ((total_pledge_amount / active_monthly_rate) * 100).round(2)
  end

  def fully_funded?
    total_pledge_amount >= (active_monthly_rate || 0)
  end

  def competing_scoopers
    coverage_regions.where(status: "claimed").includes(:user)
  end

  def activate!(scooper, monthly_rate)
    transaction do
      update!(
        status: "active",
        active_scooper_id: scooper.id,
        active_monthly_rate: monthly_rate,
        activated_at: Time.current
      )

      # Activate all pledges for this scooper
      pledges.where(coverage_region: coverage_regions.find_by(user: scooper))
             .update_all(status: "active", activated_at: Time.current)

      # Dissolve pledges for other scoopers
      pledges.where.not(coverage_region: coverage_regions.find_by(user: scooper))
             .update_all(status: "dissolved")
    end
  end

  def enter_warning_state!
    update!(
      status: "warning",
      warning_started_at: Time.current,
      warning_expires_at: 90.days.from_now
    )
  end

  def deactivate!
    update!(
      status: "inactive",
      active_scooper_id: nil,
      active_monthly_rate: nil,
      activated_at: nil,
      warning_started_at: nil,
      warning_expires_at: nil
    )
  end

  def increment_pickups!(count = 1)
    increment!(:total_pickups_all_time, count)
    increment!(:current_month_pickups, count)
  end

  def reset_monthly_pickups!
    update!(current_month_pickups: 0)
  end
end
