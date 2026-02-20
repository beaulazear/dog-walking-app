class CreateRecurringCleanups < ActiveRecord::Migration[7.2]
  def change
    create_table :recurring_cleanups do |t|
      t.references :poster, null: false, foreign_key: { to_table: :users }
      t.references :scooper, null: true, foreign_key: { to_table: :users }
      t.string :address, null: false
      t.decimal :latitude, precision: 10, scale: 6, null: false
      t.decimal :longitude, precision: 10, scale: 6, null: false
      t.string :frequency, null: false # weekly, biweekly, monthly
      t.integer :day_of_week # 0-6, Sunday-Saturday
      t.decimal :price, precision: 8, scale: 2, null: false
      t.string :status, default: "pending", null: false # pending, active, paused, cancelled
      t.string :stripe_subscription_id
      t.string :stripe_customer_id
      t.datetime :last_job_generated_at
      t.date :next_job_date
      t.datetime :started_at
      t.datetime :cancelled_at
      t.string :job_type, null: false # poop, litter, both
      t.text :segments_selected # JSON array of segments
      t.string :poop_itemization
      t.string :litter_itemization
      t.text :note

      t.timestamps
    end

    add_index :recurring_cleanups, :status
    add_index :recurring_cleanups, :next_job_date
    add_index :recurring_cleanups, :stripe_subscription_id, unique: true
  end
end
