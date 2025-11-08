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

    # Calculate based on last 4 weeks of actual training
    four_weeks_ago = 4.weeks.ago
    recent_sessions = user.training_sessions.where('session_date >= ?', four_weeks_ago)
    return nil if recent_sessions.empty?

    # Calculate hours per week (not per day spread across all days)
    total_hours = recent_sessions.sum(:duration_minutes) / 60.0
    weeks_with_data = [(Date.current - four_weeks_ago.to_date) / 7.0, 1].max
    hours_per_week = total_hours / weeks_with_data

    return nil if hours_per_week.zero?

    hours_remaining = target_hours - user.total_training_hours
    weeks_remaining = (hours_remaining / hours_per_week).ceil

    Date.current + (weeks_remaining * 7).days
  end
end
