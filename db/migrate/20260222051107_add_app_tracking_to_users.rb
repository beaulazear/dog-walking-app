class AddAppTrackingToUsers < ActiveRecord::Migration[7.2]
  def change
    # Add app tracking fields
    add_column :users, :uses_pocket_walks, :boolean, default: false, null: false
    add_column :users, :uses_scoopers, :boolean, default: false, null: false
    add_column :users, :registered_from_app, :string # 'pocket_walks' or 'scoopers'

    # Add indexes for filtering
    add_index :users, :uses_pocket_walks
    add_index :users, :uses_scoopers
    add_index :users, :registered_from_app

    # Set defaults for dog walking rate fields (make them optional for Scoopers users)
    change_column_default :users, :thirty, from: nil, to: 0
    change_column_default :users, :fortyfive, from: nil, to: 0
    change_column_default :users, :sixty, from: nil, to: 0
    change_column_default :users, :solo_rate, from: nil, to: 0
    change_column_default :users, :training_rate, from: nil, to: 0
    change_column_default :users, :sibling_rate, from: nil, to: 0

    # Backfill existing users
    # If they have dog walking rates set, mark as Pocket Walks user
    # If they have is_scooper/is_poster/is_dog_walker, mark as Scoopers user
    reversible do |dir|
      dir.up do
        # Mark users with dog walking rates as Pocket Walks users
        execute <<-SQL
          UPDATE users
          SET uses_pocket_walks = true, registered_from_app = 'pocket_walks'
          WHERE (thirty > 0 OR fortyfive > 0 OR sixty > 0 OR solo_rate > 0 OR training_rate > 0 OR sibling_rate > 0)
        SQL

        # Mark users with Scoopers activity as Scoopers users
        execute <<-SQL
          UPDATE users
          SET uses_scoopers = true, registered_from_app = 'scoopers'
          WHERE (is_scooper = true OR is_poster = true OR is_dog_walker = true)
        SQL

        # Mark admin as using both (just in case)
        execute <<-SQL
          UPDATE users
          SET uses_pocket_walks = true, uses_scoopers = true
          WHERE admin = true
        SQL
      end
    end
  end
end
