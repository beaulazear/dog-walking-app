class AddIncomeSplitToAppointmentShares < ActiveRecord::Migration[7.2]
  def change
    add_column :appointment_shares, :covering_walker_percentage, :integer
    add_column :appointment_shares, :proposed_by, :string
  end
end
