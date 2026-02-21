class Contribution < ApplicationRecord
  # Associations
  belongs_to :sponsorship
  belongs_to :contributor, class_name: "User", foreign_key: "contributor_id"

  # Validations
  validates :monthly_amount, numericality: { greater_than: 0 }
  validates :status, inclusion: { in: %w[active cancelled] }

  # Scopes
  scope :active, -> { where(status: "active") }
  scope :cancelled, -> { where(status: "cancelled") }

  # Callbacks
  after_create :update_sponsorship_contributor_count
  after_update :update_sponsorship_contributor_count, if: :saved_change_to_status?
  after_destroy :update_sponsorship_contributor_count

  def cancel!
    update!(status: "cancelled")
  end

  private

  def update_sponsorship_contributor_count
    count = sponsorship.contributions.active.count
    sponsorship.update_columns(
      contributor_count: count,
      current_monthly_cost: sponsorship.calculate_sponsor_cost
    )
  end
end
