class CreateBlockedUsers < ActiveRecord::Migration[7.2]
  def change
    create_table :blocked_users do |t|
      # User who is blocking
      t.references :blocker, null: false, foreign_key: { to_table: :users }

      # User being blocked
      t.references :blocked, null: false, foreign_key: { to_table: :users }

      t.timestamps
    end

    # Prevent duplicate blocks
    add_index :blocked_users, [ :blocker_id, :blocked_id ], unique: true
  end
end
