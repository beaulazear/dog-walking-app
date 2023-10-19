class Pet < ApplicationRecord
  belongs_to :user
  has_many :appointments, dependent: :destroy
  has_many :invoices, dependent: :destroy

  has_one_attached :profile_pic

  # validates :name, presence: true
  # validates :address, presence: true
  # validates :supplies_location, presence: true
  # validates :behavorial_notes, presence: true

end
