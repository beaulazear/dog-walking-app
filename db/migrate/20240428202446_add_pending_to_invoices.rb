class AddPendingToInvoices < ActiveRecord::Migration[6.1]
  def change
    add_column :invoices, :pending, :boolean
  end
end
