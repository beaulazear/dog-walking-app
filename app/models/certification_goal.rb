class CertificationGoal < ApplicationRecord
  belongs_to :user

  validates :target_hours, numericality: { greater_than: 0 }
  validates :weekly_goal_hours, numericality: { greater_than: 0 }
  validates :certification_type, presence: true

  def hours_per_week_needed
    return 0 unless target_completion_date

    weeks_remaining = ((target_completion_date - Date.current) / 7).ceil
    return 0 if weeks_remaining <= 0

    hours_remaining = target_hours - user.total_training_hours
    (hours_remaining / weeks_remaining.to_f).round(1)
  end

  def projected_completion_date
    return nil if user.total_training_hours.zero?

    # Calculate based on last 30 days average
    recent_sessions = user.training_sessions.where('session_date > ?', 30.days.ago)
    return nil if recent_sessions.empty?

    hours_per_day = recent_sessions.sum(:duration_minutes) / 60.0 / 30
    hours_remaining = target_hours - user.total_training_hours
    days_remaining = (hours_remaining / hours_per_day).ceil

    Date.current + days_remaining.days
  end
end
