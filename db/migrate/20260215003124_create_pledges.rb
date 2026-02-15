class CreatePledges < ActiveRecord::Migration[7.2]
  def change
    create_table :pledges do |t|
      t.references :client, null: false, foreign_key: true # The resident
      t.references :block, null: false, foreign_key: true
      t.references :coverage_region, null: false, foreign_key: true # Links to specific scooper+block combo

      # Pledge amount (monthly subscription)
      t.decimal :amount, precision: 10, scale: 2, null: false

      # Status: 'pending' (not charged yet), 'active' (block activated, subscription running),
      # 'cancelled', 'dissolved' (another scooper won)
      t.string :status, default: 'pending', null: false

      # Stripe subscription data
      t.string :stripe_subscription_id
      t.string :stripe_customer_id

      # Privacy
      t.boolean :anonymous, default: true, null: false

      # Timestamps for lifecycle tracking
      t.datetime :activated_at # When block was funded and subscription started
      t.datetime :cancelled_at

      t.timestamps
    end

    add_index :pledges, :status
    add_index :pledges, :stripe_subscription_id
    add_index :pledges, [ :client_id, :block_id ]
  end
end
