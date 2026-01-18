class Client < ApplicationRecord
  has_secure_password

  has_many :pets, dependent: :nullify
  has_many :appointments, through: :pets
  has_many :invoices, through: :pets

  validates :first_name, :last_name, :email, presence: true
  validates :email, uniqueness: { case_sensitive: false }, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :notification_preferences, inclusion: { in: %w[email sms both none] }, allow_nil: true

  before_validation :normalize_email
  before_validation :set_default_notification_preferences

  # Check if client can receive push notifications
  def can_receive_push_notifications?
    push_token.present? && notification_preferences.in?(%w[both sms])
  end

  # Check if client can receive email notifications
  def can_receive_email?
    email.present? && notification_preferences.in?(%w[email both])
  end

  # Full name helper
  def full_name
    "#{first_name} #{last_name}"
  end

  # Get active pets (pets that are currently active)
  def active_pets
    pets.where(active: true)
  end

  # Get upcoming appointments
  def upcoming_appointments
    appointments.where("appointment_date >= ?", Date.today)
                .where(canceled: false, completed: false)
                .order(:appointment_date, :start_time)
  end

  # Get unpaid invoices
  def unpaid_invoices
    invoices.where(paid: false, cancelled: false)
            .order(date_completed: :desc)
  end

  # Get total unpaid amount
  def total_unpaid_amount
    unpaid_invoices.sum(:compensation)
  end

  private

  def normalize_email
    self.email = email.downcase.strip if email.present?
  end

  def set_default_notification_preferences
    self.notification_preferences ||= "email"
  end
end
