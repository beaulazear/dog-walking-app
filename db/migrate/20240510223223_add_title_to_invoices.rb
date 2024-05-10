class AddTitleToInvoices < ActiveRecord::Migration[6.1]
  def change
    add_column :invoices, :title, :string
  end
end
