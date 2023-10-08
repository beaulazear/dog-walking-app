class Pet < ApplicationRecord
  belongs_to :user

  validates :name, presence: true
  validates :address, presence: true
  validates :supplies_location, presence: true
  validates :behavorial_notes, presence: true

end
