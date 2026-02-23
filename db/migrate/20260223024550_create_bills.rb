class CreateBills < ActiveRecord::Migration[7.2]
  def change
    create_table :bills do |t|
      t.references :client, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true
      t.date :period_start, null: false
      t.date :period_end, null: false
      t.decimal :total_amount, precision: 8, scale: 2, default: 0
      t.boolean :paid, default: false
      t.datetime :paid_at
      t.text :notes
      t.string :bill_number

      t.timestamps
    end

    add_index :bills, [ :user_id, :client_id, :period_start ]
    add_index :bills, :bill_number, unique: true
  end
end
