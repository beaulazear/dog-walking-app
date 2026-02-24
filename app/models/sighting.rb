class Sighting < ApplicationRecord
  # Constants
  TAG_TYPES = %w[residential business].freeze
  STATUSES = %w[active expired converted_to_job].freeze
  MAX_EXPIRATION_HOURS = 72
  DEFAULT_EXPIRATION_HOURS = 48
  CONFIRMATION_EXTENSION_HOURS = 6

  # Associations
  belongs_to :reporter, class_name: "User", optional: true
  belongs_to :converted_job, class_name: "CleanupJob", optional: true
  has_many_attached :photos
  has_many :reports, as: :reportable, dependent: :destroy

  # Validations
  validates :latitude, :longitude, :address, :neighborhood, presence: true
  validates :reporter_name, presence: true
  validates :tag_type, inclusion: { in: TAG_TYPES }
  validates :status, inclusion: { in: STATUSES }
  validates :business_name, presence: true, if: -> { tag_type == "business" }

  # Callbacks
  before_validation :set_default_expiration, on: :create
  before_validation :set_default_reporter_name, on: :create

  # Scopes
  scope :active, -> { where(status: "active") }
  scope :expired, -> { where(status: "expired") }
  scope :converted, -> { where(status: "converted_to_job") }
  scope :by_neighborhood, ->(name) { where(neighborhood: name) if name.present? }
  scope :expiring_soon, -> { active.where("expires_at <= ?", 12.hours.from_now) }
  scope :recent, -> { order(created_at: :desc) }

  # Geographic scope (nearby)
  scope :nearby, ->(lat, lng, radius_miles = 0.5) {
    where("
      (3959 * acos(
        cos(radians(?)) * cos(radians(latitude)) *
        cos(radians(longitude) - radians(?)) +
        sin(radians(?)) * sin(radians(latitude))
      )) < ?
    ", lat, lng, lat, radius_miles)
  }

  # Instance methods
  def extend_expiration!
    return if status != "active"

    max_allowed = created_at + MAX_EXPIRATION_HOURS.hours
    new_expiration = expires_at + CONFIRMATION_EXTENSION_HOURS.hours

    self.expires_at = [ new_expiration, max_allowed ].min
    save!
  end

  def add_confirmation!(user_id)
    return false if confirmed_by_ids.include?(user_id)

    self.confirmed_by_ids << user_id
    self.confirmation_count += 1
    extend_expiration!
    true
  end

  def convert_to_job!(job)
    update!(
      status: "converted_to_job",
      converted_job: job
    )
  end

  def expired?
    Time.current >= expires_at && status == "active"
  end

  private

  def set_default_expiration
    self.expires_at ||= DEFAULT_EXPIRATION_HOURS.hours.from_now
  end

  def set_default_reporter_name
    self.reporter_name ||= "Someone"
  end
end
