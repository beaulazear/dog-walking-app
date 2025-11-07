class Invoice < ApplicationRecord
  belongs_to :appointment
  belongs_to :pet
  belongs_to :training_session, optional: true
  belongs_to :completed_by_user, class_name: 'User', optional: true

  validates :date_completed, presence: true
  validates :compensation, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validates :title, presence: true

  # Detect if this invoice is for a training session based on title
  def training_walk?
    return false unless title.present?

    title.downcase.match?(/training/i)
  end

  # Extract duration in minutes from title (e.g., "60 minute training walk" -> 60)
  def extract_duration_minutes
    return nil unless title.present?

    # Match patterns like "60 minute", "30 min", etc.
    match = title.match(/(\d+)\s*(minute|min)/i)
    match ? match[1].to_i : nil
  end

  # Determine session type from title
  def determine_session_type
    return 'solo_walk' if title.downcase.include?('solo')
    return 'pack_walk' if title.downcase.include?('pack') || title.downcase.include?('group')
    return 'private_lesson' if title.downcase.include?('private') || title.downcase.include?('lesson')

    'solo_walk' # default for training walks
  end

  # Convert this invoice to a training session
  def create_training_session!
    return training_session if training_session.present?
    return nil unless training_walk?

    duration = extract_duration_minutes || appointment&.duration || 60

    session = pet.user.training_sessions.create!(
      pet_id: pet_id,
      session_date: date_completed,
      duration_minutes: duration,
      session_type: determine_session_type,
      notes: "Imported from invoice: #{title}",
      training_focus: []
    )

    update!(training_session: session)
    session
  end

  # Calculate and set split amounts based on split_percentage
  # split_percentage: 0-100, represents percentage that goes to the walker
  def calculate_split!(split_pct)
    return unless compensation.present?

    self.is_shared = true
    self.split_percentage = split_pct
    self.walker_amount = (compensation * (split_pct / 100.0)).round(2)
    self.owner_amount = (compensation - walker_amount).round(2)

    save!
  end

  # Get the amount for a specific user
  def amount_for_user(user_id)
    return compensation unless is_shared

    if completed_by_user_id == user_id
      walker_amount || 0
    elsif pet.user_id == user_id
      owner_amount || 0
    else
      0
    end
  end

  # Check if this invoice involves a specific user (either as owner or completing walker)
  def involves_user?(user_id)
    pet.user_id == user_id || completed_by_user_id == user_id
  end
end
