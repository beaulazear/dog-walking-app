class PetSit < ApplicationRecord
  belongs_to :user
  belongs_to :pet
  belongs_to :completed_by_user, class_name: 'User', optional: true

  has_many :pet_sit_completions, dependent: :destroy
  has_many :invoices, dependent: :destroy

  validates :user_id, :pet_id, :start_date, :end_date, :daily_rate, presence: true
  validates :daily_rate, numericality: { greater_than: 0 }
  validates :additional_charge, numericality: { greater_than_or_equal_to: 0 }
  validate :end_date_after_start_date

  scope :active, -> { where(canceled: false) }
  scope :for_date, ->(date) { where('start_date <= ? AND end_date >= ?', date, date) }
  scope :upcoming, -> { where('start_date > ?', Date.today) }
  scope :current, -> { where('start_date <= ? AND end_date >= ?', Date.today, Date.today) }
  scope :past, -> { where('end_date < ?', Date.today) }

  # Check if a specific date is completed
  def completed_on?(date)
    pet_sit_completions.exists?(completion_date: date)
  end

  # Get all dates in the sit range
  def dates
    (start_date..end_date).to_a
  end

  # Get uncompleted dates
  def uncompleted_dates
    completed_dates = pet_sit_completions.pluck(:completion_date)
    dates.reject { |date| completed_dates.include?(date) }
  end

  # Check if entire sit is completed
  def fully_completed?
    dates.length == pet_sit_completions.count
  end

  # Total cost for entire sit
  def total_cost
    days = (end_date - start_date).to_i + 1
    (daily_rate * days) + additional_charge
  end

  # Cost per day (including prorated additional charge)
  def daily_cost
    days = (end_date - start_date).to_i + 1
    daily_rate + (additional_charge.to_f / days).round
  end

  # Custom JSON serialization
  def as_json(options = {})
    super(options).merge(
      'pet' => pet&.as_json(only: [:id, :name, :active, :address, :owner_name]),
      'user' => user&.as_json(only: [:id, :name, :email]),
      'completed_by_user' => completed_by_user&.as_json(only: [:id, :name, :email]),
      'pet_sit_completions' => pet_sit_completions.as_json(only: [:id, :completion_date, :completed_at, :completed_by_user_id]),
      'invoices' => invoices.as_json(only: [:id, :amount, :status, :date_completed]),
      'total_cost' => total_cost,
      'daily_cost' => daily_cost,
      'fully_completed' => fully_completed?
    )
  end

  private

  def end_date_after_start_date
    return unless end_date.present? && start_date.present? && end_date < start_date

    errors.add(:end_date, 'must be after start date')
  end
end
