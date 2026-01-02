class AddPetSittingRateToUsers < ActiveRecord::Migration[7.2]
  def change
    add_column :users, :pet_sitting_rate, :integer
  end
end
