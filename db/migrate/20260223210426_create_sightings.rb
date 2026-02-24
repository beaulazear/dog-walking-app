class CreateSightings < ActiveRecord::Migration[7.2]
  def change
    create_table :sightings do |t|
      t.decimal :latitude, precision: 10, scale: 6, null: false
      t.decimal :longitude, precision: 10, scale: 6, null: false
      t.string :address, null: false
      t.string :neighborhood, null: false
      t.string :tag_type, default: 'residential', null: false
      t.string :business_name
      t.integer :reporter_id  # Nullable for anonymous reports
      t.string :reporter_name, null: false
      t.text :comment
      t.integer :confirmation_count, default: 0
      t.integer :confirmed_by_ids, array: true, default: []
      t.datetime :expires_at, null: false
      t.string :status, default: 'active'
      t.integer :converted_job_id

      t.timestamps
    end

    add_index :sightings, :neighborhood
    add_index :sightings, :status
    add_index :sightings, :expires_at
    add_index :sightings, [ :latitude, :longitude ]
    add_index :sightings, :reporter_id
    add_index :sightings, :converted_job_id
  end
end
