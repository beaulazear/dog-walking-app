class CreateClients < ActiveRecord::Migration[7.2]
  def change
    create_table :clients do |t|
      t.string :first_name, null: false
      t.string :last_name, null: false
      t.string :email, null: false
      t.string :password_digest, null: false
      t.string :phone_number
      t.string :push_token
      t.string :notification_preferences, default: 'email'
      t.datetime :email_verified_at
      t.datetime :phone_verified_at

      t.timestamps
    end

    add_index :clients, :email, unique: true
    add_index :clients, :push_token
  end
end
