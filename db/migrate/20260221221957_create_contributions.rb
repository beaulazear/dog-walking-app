class CreateContributions < ActiveRecord::Migration[7.2]
  def change
    create_table :contributions do |t|
      # Relationships
      t.references :sponsorship, foreign_key: true, null: false
      t.references :contributor, foreign_key: { to_table: :users }, null: false

      # Payment
      t.decimal :monthly_amount, precision: 8, scale: 2, null: false
      t.string :stripe_subscription_id
      t.string :status, default: 'active' # 'active', 'cancelled'

      t.timestamps
    end

    # Note: indexes for sponsorship_id and contributor_id are already created by t.references above
  end
end
