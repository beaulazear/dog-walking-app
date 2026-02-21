class CreateSponsorships < ActiveRecord::Migration[7.2]
  def change
    create_table :sponsorships do |t|
      # Relationships
      t.references :sponsor, foreign_key: { to_table: :users }, null: false
      t.references :scooper, foreign_key: { to_table: :users }, null: true

      # Location
      t.decimal :latitude, precision: 10, scale: 6, null: false
      t.decimal :longitude, precision: 10, scale: 6, null: false
      t.string :block_id, null: false # e.g., "BK-40.6782--73.9442"
      t.text :segments_selected, array: true, default: [] # ['NW', 'NE', 'SW', 'SE']

      # Sponsorship details
      t.string :schedule, null: false # 'weekly' or 'biweekly'
      t.decimal :monthly_budget, precision: 8, scale: 2, null: false
      t.string :display_preference, null: false # 'first_name', 'business', 'anonymous'
      t.string :display_name # Custom display name (for business/org)

      # Status
      t.string :status, default: 'open' # 'open', 'claimed', 'active', 'paused', 'cancelled'
      t.datetime :claimed_at
      t.datetime :started_at # When first sweep was completed

      # Payment
      t.string :stripe_subscription_id
      t.decimal :current_monthly_cost, precision: 8, scale: 2 # After contributions

      # Stats
      t.integer :total_pickups, default: 0
      t.integer :pickups_this_month, default: 0
      t.integer :contributor_count, default: 0

      t.timestamps
    end

    add_index :sponsorships, :block_id
    add_index :sponsorships, :status
    add_index :sponsorships, [ :latitude, :longitude ]
  end
end
