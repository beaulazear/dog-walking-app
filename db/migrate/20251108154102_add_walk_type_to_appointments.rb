class AddWalkTypeToAppointments < ActiveRecord::Migration[7.2]
  def change
    add_column :appointments, :walk_type, :string
  end
end
