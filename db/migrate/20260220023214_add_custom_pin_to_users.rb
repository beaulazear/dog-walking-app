class AddCustomPinToUsers < ActiveRecord::Migration[7.2]
  def change
    add_column :users, :custom_pin, :string, default: '📍'
  end
end
