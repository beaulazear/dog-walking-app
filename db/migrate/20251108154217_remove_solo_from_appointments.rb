class RemoveSoloFromAppointments < ActiveRecord::Migration[7.2]
  def change
    remove_column :appointments, :solo, :boolean
  end
end
