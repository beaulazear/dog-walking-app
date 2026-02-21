class AddCategoryRatingsToReviews < ActiveRecord::Migration[7.2]
  def change
    # Add category ratings (1-5 stars each) for one-off job reviews
    add_column :reviews, :quality_rating, :integer
    add_column :reviews, :thoroughness_rating, :integer
    add_column :reviews, :timeliness_rating, :integer
    add_column :reviews, :communication_rating, :integer

    # Keep existing :rating column as overall average for backward compatibility
  end
end
