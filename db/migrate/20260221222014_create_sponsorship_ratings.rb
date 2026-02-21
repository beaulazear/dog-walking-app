class CreateSponsorshipRatings < ActiveRecord::Migration[7.2]
  def change
    create_table :sponsorship_ratings do |t|
      # Relationships
      t.references :sponsorship, foreign_key: true, null: false
      t.references :sponsor, foreign_key: { to_table: :users }, null: false
      t.references :scooper, foreign_key: { to_table: :users }, null: false

      # Rating period (first day of the month being rated)
      t.date :month, null: false

      # Category ratings (1-5 stars each)
      t.integer :quality_rating
      t.integer :thoroughness_rating
      t.integer :timeliness_rating
      t.integer :communication_rating

      # Overall
      t.decimal :overall_rating, precision: 3, scale: 2

      t.text :review_text

      t.timestamps
    end

    add_index :sponsorship_ratings, [ :sponsorship_id, :month ], unique: true
  end
end
