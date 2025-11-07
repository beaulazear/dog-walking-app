class AddSplitsToInvoices < ActiveRecord::Migration[7.2]
  def change
    add_column :invoices, :is_shared, :boolean, default: false, null: false
    add_column :invoices, :split_percentage, :decimal, precision: 5, scale: 2, default: 0.0
    add_column :invoices, :owner_amount, :decimal, precision: 10, scale: 2
    add_column :invoices, :walker_amount, :decimal, precision: 10, scale: 2
    add_reference :invoices, :completed_by_user, foreign_key: { to_table: :users }, null: true, index: true

    add_index :invoices, :is_shared
  end
end
