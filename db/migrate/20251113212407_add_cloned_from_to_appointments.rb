class AddClonedFromToAppointments < ActiveRecord::Migration[7.2]
  def change
    add_column :appointments, :cloned_from_appointment_id, :integer
  end
end
