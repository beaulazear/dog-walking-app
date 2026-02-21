class CreateSweeps < ActiveRecord::Migration[7.2]
  def change
    create_table :sweeps do |t|
      # Relationships
      t.references :sponsorship, foreign_key: true, null: false
      t.references :scooper, foreign_key: { to_table: :users }, null: false

      # GPS verification
      t.decimal :arrival_latitude, precision: 10, scale: 6
      t.decimal :arrival_longitude, precision: 10, scale: 6
      t.datetime :arrived_at

      # Completion data
      t.integer :pickup_count, default: 0 # Piles picked up during sweep
      t.string :after_photo_url
      t.text :notes
      t.boolean :litter_flagged, default: false # Walker noticed heavy litter

      # Status
      t.string :status, default: 'scheduled' # 'scheduled', 'in_progress', 'completed'
      t.datetime :completed_at

      # Payment
      t.decimal :payout_amount, precision: 8, scale: 2
      t.string :stripe_payout_id

      t.timestamps
    end

    add_index :sweeps, :status
    add_index :sweeps, :completed_at
  end
end
