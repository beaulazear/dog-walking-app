class CreateCleanups < ActiveRecord::Migration[7.2]
  def change
    create_table :cleanups do |t|
      t.references :block, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true # The scooper who performed cleanup

      # GPS location (point geometry)
      # TODO: Add after PostGIS enabled: t.geometry :location, geographic: true, srid: 4326
      t.decimal :latitude, precision: 10, scale: 7, null: false
      t.decimal :longitude, precision: 10, scale: 7, null: false

      # Cleanup details
      t.integer :pickup_count, default: 0, null: false
      t.date :cleanup_date, null: false
      t.datetime :cleanup_timestamp, null: false

      # Photo (Active Storage will handle actual file, metadata stored here)
      # Photos auto-delete after 7-14 days via S3 lifecycle policy
      t.boolean :has_photo, default: false

      # Verification
      t.boolean :gps_verified, default: true, null: false

      t.timestamps
    end

    # Spatial index for location queries (will add after PostGIS enabled)
    # TODO: add_index :cleanups, :location, using: :gist

    # Regular indexes
    add_index :cleanups, :cleanup_date
    add_index :cleanups, [ :block_id, :cleanup_date ]
    add_index :cleanups, [ :user_id, :cleanup_date ]

    # Prevent duplicate cleanups (one cleanup per scooper per block per day)
    add_index :cleanups, [ :user_id, :block_id, :cleanup_date ], unique: true
  end
end
