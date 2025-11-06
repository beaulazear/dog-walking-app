class Milestone < ApplicationRecord
  belongs_to :user

  validates :hours_reached, presence: true
  validates :achieved_at, presence: true
  validates :hours_reached, uniqueness: { scope: :user_id }

  MILESTONE_HOURS = [50, 100, 150, 200, 250, 300].freeze

  scope :uncelebrated, -> { where(celebrated: false) }
  scope :for_user, ->(user_id) { where(user_id: user_id) }

  def celebration_message
    case hours_reached
    when 50
      "🎯 You're 1/6th there! Most people quit before this."
    when 100
      "💪 You've hit triple digits! You're serious about this."
    when 150
      '🚀 Halfway! The finish line is in sight.'
    when 200
      "⭐ 2/3 complete! You're unstoppable."
    when 250
      '🔥 Only 50 hours left! Final stretch!'
    when 300
      '🏆 CPDT-KA READY! You did it!'
    else
      '🎉 Milestone reached!'
    end
  end
end
