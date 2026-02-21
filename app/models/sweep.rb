class Sweep < ApplicationRecord
  # Associations
  belongs_to :sponsorship
  belongs_to :scooper, class_name: "User", foreign_key: "scooper_id"

  # Active Storage for after photo
  has_one_attached :after_photo

  # Validations
  validates :pickup_count, numericality: { greater_than_or_equal_to: 0 }
  validates :status, inclusion: { in: %w[scheduled in_progress completed] }
  validates :payout_amount, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true
  validate :gps_within_block_boundaries, on: :create

  # Scopes
  scope :completed, -> { where(status: "completed") }
  scope :scheduled, -> { where(status: "scheduled") }

  # Callbacks
  before_create :calculate_payout
  after_create :update_sponsorship_stats, if: :completed?

  def complete!(params = {})
    update!(
      status: "completed",
      completed_at: Time.current,
      pickup_count: params[:pickup_count] || 0,
      notes: params[:notes],
      litter_flagged: params[:litter_flagged] || false,
      arrival_latitude: params[:arrival_latitude],
      arrival_longitude: params[:arrival_longitude]
    )

    # Update sponsorship stats
    sponsorship.record_sweep(self)

    # Update scooper total pickups
    scooper.increment!(:total_pickups, pickup_count)

    # Activate sponsorship if this is the first sweep
    sponsorship.activate! if sponsorship.status == "claimed"
  end

  def after_photo_url
    return nil unless after_photo.attached?

    if Rails.env.production?
      after_photo.blob.service.url(
        after_photo.blob.key,
        expires_in: 7.days,
        disposition: "inline"
      )
    else
      Rails.application.routes.url_helpers.rails_blob_url(after_photo, only_path: true)
    end
  rescue StandardError => e
    Rails.logger.error("Error generating after_photo_url: #{e.message}")
    nil
  end

  private

  def calculate_payout
    self.payout_amount = sponsorship.scooper_payout_per_sweep
  end

  def update_sponsorship_stats
    sponsorship.record_sweep(self)
  end

  def gps_within_block_boundaries
    return if arrival_latitude.blank? || arrival_longitude.blank?

    # Calculate distance from sweep location to sponsorship block center
    # Allow up to ~100 meters (0.001 degrees ≈ 111 meters at equator)
    lat_diff = (arrival_latitude - sponsorship.latitude).abs
    lng_diff = (arrival_longitude - sponsorship.longitude).abs

    # Block is roughly 0.002 degrees wide (about 200m), allow 0.0015 tolerance
    max_tolerance = 0.0015

    if lat_diff > max_tolerance || lng_diff > max_tolerance
      errors.add(:base, "GPS location is too far from the sponsored block")
      self.gps_verified = false
    else
      self.gps_verified = true
    end
  end
end
