class AddColumnsToUser < ActiveRecord::Migration[6.1]
  def change
    add_column :users, :thirty, :integer
    add_column :users, :fourty, :integer
    add_column :users, :sixty, :integer
  end
end
