class AddNewRatesToUsers < ActiveRecord::Migration[7.2]
  def change
    add_column :users, :training_rate, :integer
    add_column :users, :sibling_rate, :integer
  end
end
