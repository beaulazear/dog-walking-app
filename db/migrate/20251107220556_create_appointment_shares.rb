class CreateAppointmentShares < ActiveRecord::Migration[7.2]
  def change
    create_table :appointment_shares do |t|
      t.references :appointment, null: false, foreign_key: true
      t.references :shared_by_user, null: false, foreign_key: { to_table: :users }
      t.references :shared_with_user, null: false, foreign_key: { to_table: :users }
      t.string :status, null: false, default: 'pending'
      t.boolean :recurring_share, default: false

      t.timestamps
    end

    add_index :appointment_shares, %i[appointment_id shared_with_user_id], unique: true,
                                                                           name: 'index_appointment_shares_unique'
    add_index :appointment_shares, :status
  end
end
