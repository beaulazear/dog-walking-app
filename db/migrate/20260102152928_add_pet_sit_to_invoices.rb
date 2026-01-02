class AddPetSitToInvoices < ActiveRecord::Migration[7.2]
  def change
    add_reference :invoices, :pet_sit, foreign_key: true

    # Make appointment_id optional since invoices can now be for pet sits
    change_column_null :invoices, :appointment_id, true
  end
end
