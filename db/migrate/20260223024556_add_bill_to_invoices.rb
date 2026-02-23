class AddBillToInvoices < ActiveRecord::Migration[7.2]
  def change
    add_reference :invoices, :bill, null: true, foreign_key: true
    add_index :invoices, [ :bill_id, :date_completed ]
  end
end
