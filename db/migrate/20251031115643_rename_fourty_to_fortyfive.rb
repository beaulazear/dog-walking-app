class RenameFourtyToFortyfive < ActiveRecord::Migration[7.2]
  def change
    rename_column :users, :fourty, :fortyfive
  end
end
