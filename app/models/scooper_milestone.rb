class ScooperMilestone < ApplicationRecord
  # Associations
  belongs_to :user

  # Validations
  validates :milestone_type, presence: true, inclusion: { in: %w[pickup_count streak block_count review_count] }
  validates :threshold, presence: true, numericality: { greater_than: 0 }
  validates :title, presence: true
  validates :user_id, uniqueness: { scope: [ :milestone_type, :threshold ] }

  # Callbacks
  after_create :send_celebration_notification

  # Scopes
  scope :uncelebrated, -> { where(celebrated: false) }
  scope :celebrated, -> { where(celebrated: true) }
  scope :by_type, ->(type) { where(milestone_type: type) }

  # Class methods
  def self.milestone_titles
    {
      "pickup_count" => {
        100 => { title: "Rookie Scooper", icon: "🧹", description: "Collected your first 100 pickups!" },
        500 => { title: "Street Sweeper", icon: "🌟", description: "500 pickups! You're making a difference!" },
        1000 => { title: "Block Captain", icon: "👑", description: "1,000 pickups! Neighborhood hero status!" },
        5000 => { title: "Neighborhood Hero", icon: "🦸", description: "5,000 pickups! You're a legend!" },
        10000 => { title: "Legend", icon: "🏆", description: "10,000 pickups! Ultimate scooper!" }
      },
      "streak" => {
        7 => { title: "7-Day Streak", icon: "🔥", description: "One full week of daily cleanups!" },
        30 => { title: "30-Day Streak", icon: "💪", description: "One month straight! Unstoppable!" },
        100 => { title: "100-Day Streak", icon: "⚡", description: "100 days in a row! Incredible dedication!" }
      },
      "block_count" => {
        1 => { title: "First Block", icon: "🎯", description: "Activated your first block!" },
        5 => { title: "5 Active Blocks", icon: "📍", description: "Managing 5 blocks!" },
        10 => { title: "10 Active Blocks", icon: "🗺️", description: "Covering 10 blocks!" }
      },
      "review_count" => {
        5 => { title: "5 Five-Star Reviews", icon: "⭐", description: "Residents love your work!" },
        10 => { title: "10 Five-Star Reviews", icon: "🌟", description: "10 perfect reviews!" },
        50 => { title: "50 Five-Star Reviews", icon: "✨", description: "Top-rated scooper!" }
      }
    }
  end

  # Instance methods
  def mark_celebrated!
    update!(celebrated: true)
  end

  def celebration_message
    milestone_info = self.class.milestone_titles.dig(milestone_type, threshold)
    return "Milestone achieved: #{title}!" unless milestone_info

    "#{milestone_info[:icon]} #{milestone_info[:title]}! #{milestone_info[:description]}"
  end

  private

  def send_celebration_notification
    # This would trigger a push notification to the scooper
    # And optionally to their subscribers
    # Implementation would go in a job/service
  end
end
