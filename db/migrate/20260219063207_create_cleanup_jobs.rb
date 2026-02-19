class CreateCleanupJobs < ActiveRecord::Migration[7.2]
  def change
    create_table :cleanup_jobs do |t|
      # Poster
      t.bigint :poster_id, null: false        # references users

      # Location
      t.decimal :latitude, precision: 10, scale: 7, null: false
      t.decimal :longitude, precision: 10, scale: 7, null: false
      t.string :address
      t.bigint :block_id                       # optional link to blocks table for stats

      # Job details
      t.decimal :price, precision: 10, scale: 2, null: false
      t.text :note
      t.string :status, default: "open", null: false
      # statuses: open, claimed, in_progress, completed, confirmed, disputed, expired, cancelled

      # Scooper (filled when claimed)
      t.bigint :scooper_id                     # references users
      t.datetime :claimed_at
      t.datetime :scooper_arrived_at

      # Completion
      t.integer :pickup_count
      t.datetime :completed_at
      t.datetime :confirmed_at
      t.datetime :expires_at                   # auto-confirm deadline (2hrs after completion)

      # Payment
      t.string :stripe_payment_intent_id
      t.decimal :platform_fee, precision: 10, scale: 2
      t.decimal :scooper_payout, precision: 10, scale: 2

      # Dispute
      t.string :dispute_reason
      t.text :dispute_notes
      t.datetime :disputed_at
      t.string :dispute_resolution             # approved, partial_refund, full_refund

      # Expiration
      t.datetime :job_expires_at               # 24hr expiration if unclaimed

      t.timestamps
    end

    add_index :cleanup_jobs, :poster_id
    add_index :cleanup_jobs, :scooper_id
    add_index :cleanup_jobs, :block_id
    add_index :cleanup_jobs, :status
    add_index :cleanup_jobs, [ :latitude, :longitude ]
    add_index :cleanup_jobs, [ :status, :created_at ]  # for "nearby open jobs" queries

    add_foreign_key :cleanup_jobs, :users, column: :poster_id
    add_foreign_key :cleanup_jobs, :users, column: :scooper_id
  end
end
