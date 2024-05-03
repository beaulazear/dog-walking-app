class AddSoloToAppointments < ActiveRecord::Migration[6.1]
  def change
    add_column :appointments, :solo, :boolean
  end
end
