class TrainingController < ApplicationController
  before_action :current_user

  # GET /training/dashboard
  def dashboard
    user = @current_user
    goal = user.certification_goal || user.build_certification_goal

    render json: {
      progress: {
        total_hours: user.total_training_hours,
        target_hours: goal.target_hours,
        hours_remaining: goal.target_hours - user.total_training_hours,
        percentage: ((user.total_training_hours / goal.target_hours.to_f) * 100).round(1)
      },
      streaks: {
        current: user.current_streak,
        longest: user.longest_streak
      },
      this_week: {
        hours: this_week_hours(user),
        goal: goal.weekly_goal_hours,
        percentage: ((this_week_hours(user) / goal.weekly_goal_hours.to_f) * 100).round(1)
      },
      projected_completion: goal.projected_completion_date,
      recent_sessions: user.training_sessions.includes(:pet).order(session_date: :desc).limit(5).as_json(include: { pet: { only: %i[id name] } }),
      uncelebrated_milestones: user.milestones.uncelebrated
    }
  end

  # GET /training/stats
  def stats
    user = @current_user
    sessions = user.training_sessions

    # Breakdown by session type
    type_breakdown = sessions.group(:session_type).sum(:duration_minutes)
    type_breakdown_hours = type_breakdown.transform_values { |mins| (mins / 60.0).round(1) }

    # Monthly comparison
    this_month = sessions.this_month.sum(:duration_minutes) / 60.0
    last_month = sessions.where(
      session_date: 1.month.ago.beginning_of_month..1.month.ago.end_of_month
    ).sum(:duration_minutes) / 60.0

    # Hours over time (last 12 weeks)
    weekly_data = (0..11).map do |weeks_ago|
      week_start = weeks_ago.weeks.ago.beginning_of_week
      week_end = weeks_ago.weeks.ago.end_of_week
      hours = sessions.in_date_range(week_start, week_end).sum(:duration_minutes) / 60.0

      {
        week: week_start.strftime('%b %d'),
        hours: hours.round(1)
      }
    end.reverse

    render json: {
      total_stats: {
        total_hours: user.total_training_hours,
        total_sessions: user.total_training_sessions,
        unique_dogs: sessions.where.not(pet_id: nil).distinct.count(:pet_id),
        average_session_duration: (sessions.average(:duration_minutes) || 0).round(0)
      },
      breakdown_by_type: type_breakdown_hours,
      monthly_comparison: {
        this_month: this_month.round(1),
        last_month: last_month.round(1),
        change_percentage: calculate_percentage_change(this_month, last_month)
      },
      weekly_trend: weekly_data
    }
  end

  private

  def this_week_hours(user)
    (user.training_sessions.this_week.sum(:duration_minutes) / 60.0).round(1)
  end

  def calculate_percentage_change(current, previous)
    return 0 if previous.zero?

    (((current - previous) / previous) * 100).round(1)
  end
end
