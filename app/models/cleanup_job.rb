class CleanupJob < ApplicationRecord
  belongs_to :poster, class_name: "User"
  belongs_to :scooper, class_name: "User", optional: true
  belongs_to :block, optional: true

  has_many_attached :before_photos
  has_many_attached :after_photos

  has_many :reviews, dependent: :destroy

  validates :latitude, :longitude, :price, presence: true
  validates :price, numericality: { greater_than: 0 }
  validates :status, inclusion: { in: %w[open claimed in_progress completed confirmed disputed expired cancelled] }

  scope :open, -> { where(status: "open") }
  scope :claimed, -> { where(status: "claimed") }
  scope :in_progress, -> { where(status: "in_progress") }
  scope :completed, -> { where(status: "completed") }
  scope :confirmed, -> { where(status: "confirmed") }

  # Find jobs near a location
  scope :nearby, ->(lat, lng, radius_miles = 5) {
    where("
      (3959 * acos(
        cos(radians(?)) * cos(radians(latitude)) *
        cos(radians(longitude) - radians(?)) +
        sin(radians(?)) * sin(radians(latitude))
      )) < ?
    ", lat, lng, lat, radius_miles)
  }

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
end
