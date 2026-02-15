class CreateCoverageRegions < ActiveRecord::Migration[7.2]
  def change
    create_table :coverage_regions do |t|
      t.references :user, null: false, foreign_key: true # The scooper
      t.references :block, null: false, foreign_key: true

      # Scooper's proposed monthly rate for this block
      t.decimal :monthly_rate, precision: 10, scale: 2, null: false

      # Status: 'claimed', 'competing', 'lost' (lost means another scooper won)
      t.string :status, default: 'claimed', null: false

      # Service days (scooper chooses which 5 days per week)
      t.boolean :monday, default: true
      t.boolean :tuesday, default: true
      t.boolean :wednesday, default: true
      t.boolean :thursday, default: true
      t.boolean :friday, default: true
      t.boolean :saturday, default: false
      t.boolean :sunday, default: false

      t.timestamps
    end

    # Prevent duplicate claims (same scooper can't claim same block twice)
    add_index :coverage_regions, [ :user_id, :block_id ], unique: true
    add_index :coverage_regions, :status
  end
end
