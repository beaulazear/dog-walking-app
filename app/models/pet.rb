class Pet < ApplicationRecord
  belongs_to :user
  has_many :appointments, dependent: :destroy
  has_many :invoices, dependent: :destroy
  has_many :additional_incomes, dependent: :destroy

  has_one_attached :profile_pic

  validates :name, presence: true
  validates :address, presence: true
  validates :supplies_location, presence: true
  validates :behavorial_notes, presence: true
  validates :birthdate, presence: true

  before_validation :ensure_birthdate_is_valid

  def ensure_birthdate_is_valid
    if birthdate > Date.current
      errors.add(:birthdate, "Must be in the past")
    end
  end

end
