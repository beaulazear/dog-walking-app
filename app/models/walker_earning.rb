class WalkerEarning < ApplicationRecord
  # Associations
  belongs_to :appointment
  belongs_to :walker, class_name: "User"
  belongs_to :appointment_share
  belongs_to :pet
  belongs_to :training_session, optional: true

  # Validations
  validates :compensation, presence: true, numericality: { only_integer: true, greater_than: 0 }
  validates :split_percentage, presence: true,
                               numericality: { only_integer: true, greater_than_or_equal_to: 0,
                                               less_than_or_equal_to: 100 }
  validates :date_completed, presence: true

  # Scopes
  scope :unpaid, -> { where(paid: false, pending: false) }
  scope :paid, -> { where(paid: true) }
  scope :pending, -> { where(pending: true) }
  scope :for_walker, ->(walker_id) { where(walker_id: walker_id) }
  scope :for_date, ->(date) { where(date_completed: date) }
  scope :recent, -> { order(date_completed: :desc) }

  # Check if this is a training walk (based on title)
  def training_walk?
    title&.downcase&.include?("training")
  end

  # Convert this walker earning to a training session for the walker
  def create_training_session!
    return training_session if training_session.present?
    return nil unless training_walk?

    duration = appointment&.duration || 60

    session = walker.training_sessions.create!(
      pet_id: pet_id,
      session_date: date_completed,
      duration_minutes: duration,
      session_type: "solo_walk",
      notes: "Shared walk - covering: #{title}",
      training_focus: []
    )

    update!(training_session: session)
    session
  end
end
