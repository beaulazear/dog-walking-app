class AddSoloRateToUsers < ActiveRecord::Migration[6.1]
  def change
    add_column :users, :solo_rate, :integer
  end
end
