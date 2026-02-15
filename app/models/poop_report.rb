class PoopReport < ApplicationRecord
  # Associations
  belongs_to :client
  belongs_to :block
  has_one_attached :photo

  # Validations
  validates :latitude, :longitude, :reported_at, presence: true
  validates :status, presence: true, inclusion: { in: %w[open acknowledged resolved] }

  # Callbacks
  after_create :notify_scooper
  after_create :schedule_photo_deletion

  # Scopes
  scope :open, -> { where(status: "open") }
  scope :acknowledged, -> { where(status: "acknowledged") }
  scope :resolved, -> { where(status: "resolved") }
  scope :for_block, ->(block_id) { where(block_id: block_id) }
  scope :recent, -> { where("reported_at >= ?", 7.days.ago) }

  # Instance methods
  def acknowledge!
    update!(status: "acknowledged")
  end

  def resolve!
    update!(status: "resolved")
  end

  def attach_photo!(photo_file)
    self.photo.attach(photo_file)
    update!(has_photo: true)
  end

  def scooper
    block.active_scooper
  end

  private

  def notify_scooper
    # Notification logic would go in a job/service
    # For now, just a placeholder
  end

  def schedule_photo_deletion
    # Photos are automatically deleted after 14 days via S3 lifecycle policy
  end
end
