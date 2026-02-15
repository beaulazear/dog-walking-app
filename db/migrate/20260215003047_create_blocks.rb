class CreateBlocks < ActiveRecord::Migration[7.2]
  def change
    create_table :blocks do |t|
      # Geographic data
      # TODO: Add geometry column after PostGIS is enabled: t.geometry :geom, geographic: true, srid: 4326
      t.jsonb :geojson # GeoJSON representation for mobile app

      # Block identification
      t.string :block_id, null: false # NYC block ID or unique identifier
      t.string :neighborhood
      t.string :borough

      # Block status: 'inactive', 'pledging', 'active', 'warning'
      t.string :status, default: 'inactive', null: false

      # Warning state tracking
      t.datetime :warning_started_at
      t.datetime :warning_expires_at

      # Statistics (counter caches)
      t.integer :total_pickups_all_time, default: 0, null: false
      t.integer :current_month_pickups, default: 0, null: false
      t.integer :active_streak_days, default: 0, null: false
      t.date :last_cleanup_date

      # Active scooper (when block is active)
      t.bigint :active_scooper_id
      t.decimal :active_monthly_rate, precision: 10, scale: 2
      t.datetime :activated_at

      t.timestamps
    end

    # Spatial index for geom field (will add after PostGIS enabled)
    # TODO: add_index :blocks, :geom, using: :gist

    # Regular indexes
    add_index :blocks, :block_id, unique: true
    add_index :blocks, :status
    add_index :blocks, :active_scooper_id
    add_index :blocks, :neighborhood
    add_index :blocks, :borough
  end
end
