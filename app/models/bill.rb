class Bill < ApplicationRecord
  belongs_to :client
  belongs_to :user
  has_many :invoices, dependent: :nullify

  validates :period_start, :period_end, presence: true
  validates :bill_number, uniqueness: true, allow_nil: true
  validate :period_end_after_start

  before_create :generate_bill_number
  before_save :calculate_total

  # Helper: Is this bill unpaid?
  def unpaid?
    !paid
  end

  # Mark as paid - also marks all invoices paid
  def mark_as_paid!(paid_date = Time.current)
    transaction do
      update!(paid: true, paid_at: paid_date)
      invoices.where(paid: false).update_all(paid: true, paid_at: paid_date)
    end
  end

  # Unmark as paid (if you made a mistake)
  def mark_as_unpaid!
    transaction do
      update!(paid: false, paid_at: nil)
      invoices.update_all(paid: false, paid_at: nil)
    end
  end

  private

  def period_end_after_start
    return unless period_start && period_end

    if period_end < period_start
      errors.add(:period_end, "must be after period start")
    end
  end

  def generate_bill_number
    date_prefix = (created_at || Time.current).strftime("%Y%m")
    last_num = Bill.where("bill_number LIKE ?", "B-#{date_prefix}-%")
                  .order(:bill_number)
                  .last
                  &.bill_number
                  &.split("-")
                  &.last
                  &.to_i || 0

    self.bill_number = "B-#{date_prefix}-#{(last_num + 1).to_s.rjust(3, '0')}"
  end

  def calculate_total
    self.total_amount = invoices.sum(:price)
  end
end
