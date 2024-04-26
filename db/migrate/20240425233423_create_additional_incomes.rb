class CreateAdditionalIncomes < ActiveRecord::Migration[6.1]
  def change
    create_table :additional_incomes do |t|
      t.string :description
      t.datetime :date_added
      t.integer :compensation
      t.belongs_to :pet, null: false, foreign_key: true

      t.timestamps
    end
  end
end
