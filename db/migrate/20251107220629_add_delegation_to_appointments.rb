class AddDelegationToAppointments < ActiveRecord::Migration[7.2]
  def change
    add_reference :appointments, :completed_by_user, foreign_key: { to_table: :users }, null: true, index: true
    add_column :appointments, :delegation_status, :string, default: 'none', null: false

    add_index :appointments, :delegation_status
  end
end
