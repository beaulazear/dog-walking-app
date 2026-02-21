class SponsorshipRating < ApplicationRecord
  # Associations
  belongs_to :sponsorship
  belongs_to :sponsor, class_name: "User", foreign_key: "sponsor_id"
  belongs_to :scooper, class_name: "User", foreign_key: "scooper_id"

  # Validations
  validates :month, presence: true, uniqueness: { scope: :sponsorship_id }
  validates :quality_rating, :thoroughness_rating, :timeliness_rating, :communication_rating,
            numericality: { only_integer: true, greater_than_or_equal_to: 1, less_than_or_equal_to: 5 },
            allow_nil: true

  # Callbacks
  before_save :calculate_overall_rating
  after_save :update_scooper_overall_rating

  private

  def calculate_overall_rating
    ratings = [
      quality_rating,
      thoroughness_rating,
      timeliness_rating,
      communication_rating
    ].compact

    self.overall_rating = if ratings.any?
                            (ratings.sum.to_f / ratings.size).round(2)
    else
                            0.0
    end
  end

  def update_scooper_overall_rating
    scooper.update_overall_rating!
  end
end
