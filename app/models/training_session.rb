class TrainingSession < ApplicationRecord
  belongs_to :user
  belongs_to :pet, optional: true
  has_many :invoices, dependent: :nullify

  validates :session_date, presence: true
  validates :duration_minutes, presence: true, numericality: { greater_than: 0 }
  validates :session_type, inclusion: {
    in: %w[solo_walk pack_walk group_class private_lesson shelter_volunteer other],
    allow_blank: true
  }

  # Scopes
  scope :for_user, ->(user_id) { where(user_id: user_id) }
  scope :in_date_range, lambda { |start_date, end_date|
    where(session_date: start_date..end_date)
  }
  scope :this_week, lambda {
    where(session_date: Time.current.beginning_of_week..Time.current.end_of_week)
  }
  scope :this_month, lambda {
    where(session_date: Time.current.beginning_of_month..Time.current.end_of_month)
  }
  scope :by_type, ->(type) { where(session_type: type) }
  scope :from_invoices, -> { where.not(id: Invoice.where.not(training_session_id: nil).select(:training_session_id)) }

  # Instance methods
  def duration_hours
    (duration_minutes / 60.0).round(2)
  end

  # Check if this session came from an invoice
  def from_invoice?
    invoices.exists?
  end
end
