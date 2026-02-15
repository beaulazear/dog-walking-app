class CoverageRegion < ApplicationRecord
  # Associations
  belongs_to :user # The scooper
  belongs_to :block
  has_many :pledges, dependent: :destroy

  # Validations
  validates :user_id, uniqueness: { scope: :block_id, message: "has already claimed this block" }
  validates :monthly_rate, presence: true, numericality: { greater_than: 0 }
  validates :status, presence: true, inclusion: { in: %w[claimed competing lost] }

  # Callbacks
  after_create :update_block_status_to_pledging

  # Scopes
  scope :claimed, -> { where(status: "claimed") }
  scope :competing, -> { where(status: "competing") }
  scope :lost, -> { where(status: "lost") }
  scope :active_claims, -> { where(status: %w[claimed competing]) }

  # Instance methods
  def total_pledges
    pledges.where(status: "pending").sum(:amount)
  end

  def pledge_progress_percentage
    return 0 unless monthly_rate > 0
    ((total_pledges / monthly_rate) * 100).round(2)
  end

  def fully_funded?
    total_pledges >= monthly_rate
  end

  def service_days
    days = []
    days << "Monday" if monday
    days << "Tuesday" if tuesday
    days << "Wednesday" if wednesday
    days << "Thursday" if thursday
    days << "Friday" if friday
    days << "Saturday" if saturday
    days << "Sunday" if sunday
    days
  end

  def service_days_count
    [ monday, tuesday, wednesday, thursday, friday, saturday, sunday ].count(true)
  end

  def mark_as_lost!
    update!(status: "lost")
  end

  def mark_as_competing!
    update!(status: "competing") if status == "claimed"
  end

  private

  def update_block_status_to_pledging
    block.update!(status: "pledging") if block.status == "inactive"
  end
end
