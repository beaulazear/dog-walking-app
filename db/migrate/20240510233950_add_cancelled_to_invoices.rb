class AddCancelledToInvoices < ActiveRecord::Migration[6.1]
  def change
    add_column :invoices, :cancelled, :boolean
  end
end
