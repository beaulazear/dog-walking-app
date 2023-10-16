class CreateInvoices < ActiveRecord::Migration[6.1]
  def change
    create_table :invoices do |t|
      t.belongs_to :appointment, null: false, foreign_key: true
      t.belongs_to :user, null: false, foreign_key: true
      t.datetime :date_completed
      t.integer :compensation
      t.boolean :paid

      t.timestamps
    end
  end
end
