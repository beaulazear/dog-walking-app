class AddWalkGroupToAppointments < ActiveRecord::Migration[7.2]
  def change
    add_reference :appointments, :walk_group, null: true, foreign_key: true
  end
end
