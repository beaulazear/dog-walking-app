class AddTrainingSessionToInvoices < ActiveRecord::Migration[7.2]
  def change
    add_reference :invoices, :training_session, foreign_key: true, index: true
  end
end
