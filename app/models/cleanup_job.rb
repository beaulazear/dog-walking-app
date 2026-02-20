class CleanupJob < ApplicationRecord
  # Constants for job metadata
  JOB_TYPES = %w[poop litter both].freeze
  POOP_ITEMIZATIONS = %w[1-3 4-8 9+].freeze
  LITTER_ITEMIZATIONS = %w[light moderate heavy].freeze
  SEGMENTS = %w[north south east west].freeze
  STATUSES = %w[open claimed in_progress completed confirmed disputed expired cancelled].freeze

  belongs_to :poster, class_name: "User"
  belongs_to :scooper, class_name: "User", optional: true
  belongs_to :block, optional: true
  belongs_to :cancelled_by, class_name: "User", optional: true
  belongs_to :recurring_cleanup, optional: true

  has_many_attached :before_photos
  has_many_attached :after_photos

  has_many :reviews, dependent: :destroy

  # Basic validations
  validates :latitude, :longitude, :price, presence: true
  validates :price, numericality: { greater_than: 0 }
  validates :status, inclusion: { in: STATUSES }
  validates :job_type, inclusion: { in: JOB_TYPES }

  # Conditional validations based on job_type
  validates :poop_itemization,
    inclusion: { in: POOP_ITEMIZATIONS },
    if: -> { job_type.in?([ "poop", "both" ]) },
    allow_nil: -> { job_type == "litter" }

  validates :litter_itemization,
    inclusion: { in: LITTER_ITEMIZATIONS },
    if: -> { job_type.in?([ "litter", "both" ]) },
    allow_nil: -> { job_type == "poop" }

  # Custom validation for segments
  validate :segments_must_be_valid

  private

  def segments_must_be_valid
    return if segments_selected.blank?

    unless segments_selected.is_a?(Array)
      errors.add(:segments_selected, "must be an array")
      return
    end

    invalid_segments = segments_selected - SEGMENTS
    if invalid_segments.any?
      errors.add(:segments_selected, "contains invalid segments: #{invalid_segments.join(', ')}")
    end

    if segments_selected.empty?
      errors.add(:segments_selected, "must select at least one segment")
    end
  end

  # Status scopes
  scope :open, -> { where(status: "open") }
  scope :claimed, -> { where(status: "claimed") }
  scope :in_progress, -> { where(status: "in_progress") }
  scope :completed, -> { where(status: "completed") }
  scope :confirmed, -> { where(status: "confirmed") }
  scope :disputed, -> { where(status: "disputed") }
  scope :expired, -> { where(status: "expired") }
  scope :cancelled, -> { where(status: "cancelled") }

  # Job type scopes
  scope :poop_only, -> { where(job_type: "poop") }
  scope :litter_only, -> { where(job_type: "litter") }
  scope :both_types, -> { where(job_type: "both") }
  scope :by_job_type, ->(type) { where(job_type: type) if type.present? }

  # Time-based scopes
  scope :just_posted, -> { where("created_at > ?", 1.hour.ago) }
  scope :recent, -> { order(created_at: :desc) }
  scope :highest_pay, -> { order(price: :desc) }

  # Find jobs near a location (haversine formula)
  scope :nearby, ->(lat, lng, radius_miles = 0.5) {
    where("
      (3959 * acos(
        cos(radians(?)) * cos(radians(latitude)) *
        cos(radians(longitude) - radians(?)) +
        sin(radians(?)) * sin(radians(latitude))
      )) < ?
    ", lat, lng, lat, radius_miles)
  }

  # Active jobs (can be claimed or worked on)
  scope :active, -> { where(status: [ "open", "claimed", "in_progress" ]) }

  # Check if job can be claimed
  def claimable?
    status == "open" && scooper_id.nil?
  end

  # Check if job can be started
  def startable?
    status == "claimed"
  end

  # Check if job can be completed
  def completable?
    status == "in_progress"
  end

  # Check if job can be confirmed
  def confirmable?
    status == "completed"
  end

  # Calculate cancellation fee based on who cancels and when
  def calculate_cancellation_fee(cancelling_user)
    # Poster cancels after scooper has claimed: 20% fee
    if cancelling_user.id == poster_id && scooper_id.present?
      (price * 0.20).round(2)
    else
      # No fee for:
      # - Poster cancelling unclaimed job
      # - Scooper cancelling (they face reputation penalty instead)
      0.0
    end
  end
end
