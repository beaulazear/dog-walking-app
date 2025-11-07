class CreateWalkerConnections < ActiveRecord::Migration[7.2]
  def change
    create_table :walker_connections do |t|
      t.references :user, null: false, foreign_key: true
      t.references :connected_user, null: false, foreign_key: { to_table: :users }
      t.string :status, null: false, default: 'pending'

      t.timestamps
    end

    add_index :walker_connections, %i[user_id connected_user_id], unique: true
    add_index :walker_connections, :status
  end
end
