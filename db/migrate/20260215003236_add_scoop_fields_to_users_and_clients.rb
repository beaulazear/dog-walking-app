class AddScoopFieldsToUsersAndClients < ActiveRecord::Migration[7.2]
  def change
    # Add Scoop-specific fields to Users (who can be scoopers)
    add_column :users, :is_scooper, :boolean, default: false, null: false
    add_column :users, :stripe_connect_account_id, :string
    add_column :users, :stripe_connect_onboarded, :boolean, default: false
    add_column :users, :total_scooper_earnings, :decimal, precision: 10, scale: 2, default: 0
    add_column :users, :total_lifetime_pickups, :integer, default: 0
    add_column :users, :current_streak_days, :integer, default: 0
    add_column :users, :longest_streak_days, :integer, default: 0

    # Add Scoop-specific fields to Clients (residents)
    add_column :clients, :current_block_id, :bigint
    add_column :clients, :current_pledge_id, :bigint

    # Indexes
    add_index :users, :is_scooper
    add_index :users, :stripe_connect_account_id
    add_index :clients, :current_block_id
  end
end
