class CreateWalkerEarnings < ActiveRecord::Migration[7.2]
  def change
    create_table :walker_earnings do |t|
      t.references :appointment, null: false, foreign_key: true
      t.references :walker, null: false, foreign_key: { to_table: :users }
      t.references :appointment_share, null: false, foreign_key: true
      t.references :pet, null: false, foreign_key: true
      t.date :date_completed, null: false
      t.integer :compensation, null: false
      t.integer :split_percentage, null: false
      t.boolean :paid, default: false, null: false
      t.boolean :pending, default: false, null: false
      t.string :title

      t.timestamps
    end

    add_index :walker_earnings, %i[walker_id paid pending],
              name: 'index_walker_earnings_on_walker_and_payment_status'
    add_index :walker_earnings, :date_completed
  end
end
