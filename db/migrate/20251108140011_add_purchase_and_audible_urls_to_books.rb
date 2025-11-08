class AddPurchaseAndAudibleUrlsToBooks < ActiveRecord::Migration[7.2]
  def change
    add_column :books, :purchase_url, :string
    add_column :books, :audible_url, :string
  end
end
