class Sponsorship < ApplicationRecord
  # Associations
  belongs_to :sponsor, class_name: "User", foreign_key: "sponsor_id"
  belongs_to :scooper, class_name: "User", foreign_key: "scooper_id", optional: true
  has_many :sweeps, dependent: :destroy
  has_many :contributions, dependent: :destroy
  has_many :sponsorship_ratings, dependent: :destroy

  # Validations
  validates :latitude, :longitude, presence: true
  validates :block_id, presence: true
  validates :schedule, inclusion: { in: %w[weekly biweekly] }
  validates :monthly_budget, numericality: { greater_than_or_equal_to: 20 }
  validates :display_preference, inclusion: { in: %w[first_name business anonymous] }
  validates :status, inclusion: { in: %w[open claimed active paused cancelled] }
  validates :segments_selected, presence: true
  validate :segments_selected_valid

  # Scopes
  scope :open, -> { where(status: "open") }
  scope :active, -> { where(status: "active") }
  scope :claimed, -> { where(status: "claimed") }

  # Callbacks
  before_create :set_current_monthly_cost
  after_update :update_sponsor_cost_after_contributions, if: :saved_change_to_contributor_count?

  # Status machine methods
  def claim!(scooper)
    raise "Sponsorship already claimed" unless status == "open"
    raise "User must be a dog walker" unless scooper.is_dog_walker

    update!(
      scooper:,
      status: "claimed",
      claimed_at: Time.current
    )
  end

  def activate!
    raise "Sponsorship not claimed" unless status == "claimed"

    update!(
      status: "active",
      started_at: Time.current
    )
  end

  def pause!
    raise "Sponsorship not active" unless status == "active"

    update!(
      status: "paused",
      paused_at: Time.current
    )
  end

  def resume!
    raise "Sponsorship not paused" unless status == "paused"

    update!(
      status: "active",
      paused_at: nil
    )
  end

  def cancel!
    update!(
      status: "cancelled",
      cancelled_at: Time.current
    )
  end

  # Sponsorship display helpers
  def sponsor_display
    return display_name if display_preference == "business" && display_name.present?
    return "A neighbor" if display_preference == "anonymous"

    sponsor.name&.split&.first || "Anonymous"
  end

  def scooper_public_profile
    return nil unless scooper

    scooper.public_profile
  end

  # Pickup tracking
  def record_sweep(sweep)
    increment!(:total_pickups, sweep.pickup_count)
    increment!(:pickups_this_month, sweep.pickup_count)
    update!(last_sweep_at: sweep.completed_at)
  end

  def reset_monthly_pickups!
    update!(pickups_this_month: 0)
  end

  def clean_since
    started_at&.to_date
  end

  # Payment calculations
  def per_sweep_amount
    sweeps_per_month = schedule == "weekly" ? 4 : 2
    monthly_budget / sweeps_per_month
  end

  def scooper_payout_per_sweep
    (per_sweep_amount * 0.82).round(2) # Scooper gets 82%
  end

  def platform_fee_per_sweep
    (per_sweep_amount * 0.18).round(2) # Platform keeps 18%
  end

  # Contribution handling
  def total_contributions
    contributions.where(status: "active").sum(:monthly_amount)
  end

  def calculate_sponsor_cost
    cost = monthly_budget - total_contributions
    [ cost, 0 ].max # Never go below zero
  end

  def update_sponsor_cost_after_contributions
    update_column(:current_monthly_cost, calculate_sponsor_cost)
  end

  private

  def segments_selected_valid
    return if segments_selected.is_a?(Array) && segments_selected.all? { |s| %w[NW NE SW SE].include?(s) }

    errors.add(:segments_selected, "must be an array of valid quadrants (NW, NE, SW, SE)")
  end

  def set_current_monthly_cost
    self.current_monthly_cost = monthly_budget
  end
end
