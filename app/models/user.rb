class User < ApplicationRecord
  has_secure_password

  has_many :pets
  has_many :appointments, through: :pets
  has_many :invoices, through: :pets
  has_many :training_sessions, dependent: :destroy
  has_one :certification_goal, dependent: :destroy
  has_many :milestones, dependent: :destroy

  validates :username, uniqueness: true, presence: true
  validates :name, presence: true
  validates :email_address, presence: true

  validates :thirty, :fortyfive, :sixty, :solo_rate, numericality: { only_integer: true }

  # Training-related methods
  def total_training_hours
    (training_sessions.sum(:duration_minutes) / 60.0).round(1)
  end

  def total_training_sessions
    training_sessions.count
  end

  def current_streak
    sessions = training_sessions.order(session_date: :desc)
    return 0 if sessions.empty?

    streak = 0
    current_date = Date.current

    sessions.group_by { |s| s.session_date.to_date }.each do |date, _|
      break if date < current_date - streak.days

      streak += 1 if date == current_date - streak.days
    end

    streak
  end

  def longest_streak
    sessions = training_sessions.order(:session_date)
    return 0 if sessions.empty?

    max_streak = 0
    current_streak = 1

    sessions.each_cons(2) do |prev, curr|
      if curr.session_date.to_date == prev.session_date.to_date + 1.day
        current_streak += 1
      else
        max_streak = [max_streak, current_streak].max
        current_streak = 1
      end
    end

    [max_streak, current_streak].max
  end

  def check_and_create_milestones!
    total_hours = total_training_hours.to_i

    Milestone::MILESTONE_HOURS.each do |milestone_hours|
      next if total_hours < milestone_hours
      next if milestones.exists?(hours_reached: milestone_hours)

      milestones.create!(
        hours_reached: milestone_hours,
        achieved_at: Time.current
      )
    end
  end
end
