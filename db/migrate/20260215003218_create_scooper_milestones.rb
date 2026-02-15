class CreateScooperMilestones < ActiveRecord::Migration[7.2]
  def change
    create_table :scooper_milestones do |t|
      t.references :user, null: false, foreign_key: true # The scooper

      # Milestone type: 'pickup_count', 'streak', 'block_count', 'review_count'
      t.string :milestone_type, null: false

      # Milestone threshold (e.g., 100 for "100 pickups", 7 for "7-day streak")
      t.integer :threshold, null: false

      # Badge/title info
      t.string :title, null: false # e.g., "Street Sweeper", "Legend"
      t.string :badge_icon # Icon name for mobile app
      t.text :description

      # Tracking
      t.datetime :achieved_at, null: false
      t.boolean :celebrated, default: false # Has user seen the celebration?

      t.timestamps
    end

    add_index :scooper_milestones, [ :user_id, :milestone_type, :threshold ], unique: true, name: 'index_milestones_unique'
    add_index :scooper_milestones, :celebrated
  end
end
