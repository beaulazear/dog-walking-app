class Pet < ApplicationRecord
  belongs_to :user
  has_many :appointments, dependent: :destroy
  has_many :invoices, dependent: :destroy
  has_many :additional_incomes, dependent: :destroy
  has_many :blogs, dependent: :destroy

  has_one_attached :profile_pic

  validates :name, presence: true
  validates :address, presence: true
  validates :supplies_location, presence: true
  validates :behavioral_notes, presence: true
  validates :birthdate, presence: true

  before_validation :ensure_birthdate_is_valid
  after_save :geocode_address, if: :should_geocode?

  def ensure_birthdate_is_valid
    return unless birthdate > Date.current

    errors.add(:birthdate, 'Must be in the past')
  end

  def profile_pic_url
    profile_pic.attached? ? Rails.application.routes.url_helpers.rails_blob_url(profile_pic, only_path: true) : nil
  end

  # Geocoding methods
  def should_geocode?
    # Geocode if address changed or if we don't have coordinates yet
    saved_change_to_address? || (address.present? && latitude.nil?)
  end

  def geocode_address
    return if address.blank?

    result = GeocodingService.geocode(address)

    if result[:success]
      update_columns(
        latitude: result[:latitude],
        longitude: result[:longitude],
        geocoded_at: Time.current,
        geocoding_failed: false,
        geocoding_error: nil
      )
    else
      update_columns(
        geocoding_failed: true,
        geocoding_error: result[:error]
      )
    end
  rescue StandardError => e
    update_columns(
      geocoding_failed: true,
      geocoding_error: "Exception: #{e.message}"
    )
  end

  def coordinates
    return nil unless latitude && longitude

    [latitude, longitude]
  end

  def geocoded?
    latitude.present? && longitude.present?
  end

  # Manual geocode trigger (useful for retrying failed geocoding)
  def geocode!
    geocode_address
  end
end
