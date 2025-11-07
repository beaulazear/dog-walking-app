class Book < ApplicationRecord
  belongs_to :user, optional: true # null for default books

  validates :title, presence: true
  validates :author, presence: true
  validates :category, presence: true
  validates :status, inclusion: {
    in: %w[not_started in_progress read],
    allow_blank: true
  }
  validates :rating, numericality: { only_integer: true, greater_than_or_equal_to: 1, less_than_or_equal_to: 5 },
                     allow_nil: true
  validates :progress_percentage,
            numericality: { only_integer: true, greater_than_or_equal_to: 0, less_than_or_equal_to: 100 }

  # Scopes
  scope :defaults, -> { where(is_default: true, user_id: nil) }
  scope :for_user, ->(user_id) { where(user_id: user_id) }
  scope :by_status, ->(status) { where(status: status) }
  scope :by_category, ->(category) { where(category: category) }
  scope :user_recommendations, -> { where(category: 'User Recommendation') }

  # Instance methods
  def default_book?
    is_default && user_id.nil?
  end

  def user_book?
    !user_id.nil?
  end
end
