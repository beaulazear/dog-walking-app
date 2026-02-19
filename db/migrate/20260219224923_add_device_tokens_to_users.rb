class AddDeviceTokensToUsers < ActiveRecord::Migration[7.2]
  def change
    add_column :users, :device_token, :string
    add_column :users, :device_platform, :string

    # Index for faster lookups when sending notifications
    add_index :users, :device_token
  end
end
