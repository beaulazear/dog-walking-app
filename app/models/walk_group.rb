class WalkGroup < ApplicationRecord
  belongs_to :user
  has_many :appointments, dependent: :nullify

  validates :date, presence: true
  validates :user_id, presence: true

  scope :for_date, ->(date) { where(date: date) }
  scope :for_user, ->(user) { where(user: user) }
end
