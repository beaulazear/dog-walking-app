class CreatePoopReports < ActiveRecord::Migration[7.2]
  def change
    create_table :poop_reports do |t|
      t.references :client, null: false, foreign_key: true # The resident who reported
      t.references :block, null: false, foreign_key: true

      # GPS location
      unless Rails.env.development?
        t.geometry :location, geographic: true, srid: 4326, null: false
      end
      t.decimal :latitude, precision: 10, scale: 7, null: false
      t.decimal :longitude, precision: 10, scale: 7, null: false

      # Report details
      t.text :notes
      t.datetime :reported_at, null: false

      # Photo (Active Storage will handle actual file)
      # Photos auto-delete after 7-14 days via S3 lifecycle policy
      t.boolean :has_photo, default: false

      # Status: 'open', 'acknowledged', 'resolved'
      t.string :status, default: 'open', null: false

      t.timestamps
    end

    # Spatial index
    add_index :poop_reports, :location, using: :gist unless Rails.env.development?

    # Regular indexes
    add_index :poop_reports, :status
    add_index :poop_reports, :reported_at
    add_index :poop_reports, [ :block_id, :reported_at ]
  end
end
