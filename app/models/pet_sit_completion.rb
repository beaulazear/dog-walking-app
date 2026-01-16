class PetSitCompletion < ApplicationRecord
  belongs_to :pet_sit
  belongs_to :completed_by_user, class_name: 'User', optional: true

  validates :pet_sit_id, :completion_date, :completed_at, presence: true
  validates :completion_date, uniqueness: { scope: :pet_sit_id, message: 'already completed for this sit' }
  validate :completion_date_within_sit_range

  # Automatically create invoice after completion
  after_create :create_invoice

  private

  def completion_date_within_sit_range
    return unless completion_date.present? && pet_sit.present?
    return if pet_sit.dates.include?(completion_date)

    errors.add(:completion_date, 'must be within pet sit date range')
  end

  def create_invoice
    Invoice.create!(
      pet_sit_id: pet_sit.id,
      pet_id: pet_sit.pet_id,
      date_completed: completion_date,
      compensation: pet_sit.daily_cost,
      title: "Pet Sit - #{pet_sit.pet.name} (#{completion_date.strftime('%b %d, %Y')})",
      paid: false,
      pending: false,
      completed_by_user_id: completed_by_user_id
    )
  rescue ActiveRecord::RecordInvalid => e
    # Log the error and add to errors
    Rails.logger.error "Failed to create invoice for pet sit completion #{id}: #{e.message}"
    errors.add(:base, "Failed to create invoice: #{e.message}")
    # Raise Rollback to prevent the completion from being saved if invoice creation fails
    raise ActiveRecord::Rollback
  end
end
