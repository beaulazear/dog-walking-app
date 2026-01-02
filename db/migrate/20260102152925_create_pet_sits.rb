class CreatePetSits < ActiveRecord::Migration[7.2]
  def change
    create_table :pet_sits do |t|
      t.references :user, null: false, foreign_key: true
      t.references :pet, null: false, foreign_key: true
      t.date :start_date, null: false
      t.date :end_date, null: false
      t.integer :daily_rate, null: false
      t.integer :additional_charge, default: 0
      t.text :description
      t.boolean :canceled, default: false
      t.bigint :completed_by_user_id

      t.timestamps
    end

    add_index :pet_sits, %i[start_date end_date]
    add_index :pet_sits, :completed_by_user_id
    add_foreign_key :pet_sits, :users, column: :completed_by_user_id
  end
end
