class CreateWaitlistSignups < ActiveRecord::Migration[7.2]
  def change
    create_table :waitlist_signups do |t|
      t.string :email, null: false
      t.string :ip_address
      t.string :user_agent

      t.timestamps
    end
    add_index :waitlist_signups, :email, unique: true
  end
end
