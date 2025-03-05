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
    return unless birthdate > Date.current

    errors.add(:birthdate, 'Must be in the past')
  end

  def profile_pic_url
    profile_pic.attached? ? Rails.application.routes.url_helpers.rails_blob_url(profile_pic, only_path: true) : nil
  end
end
