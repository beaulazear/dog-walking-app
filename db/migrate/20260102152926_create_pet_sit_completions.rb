class CreatePetSitCompletions < ActiveRecord::Migration[7.2]
  def change
    create_table :pet_sit_completions do |t|
      t.references :pet_sit, null: false, foreign_key: true
      t.date :completion_date, null: false
      t.bigint :completed_by_user_id
      t.datetime :completed_at, null: false

      t.timestamps
    end

    add_index :pet_sit_completions, %i[pet_sit_id completion_date], unique: true, name: 'index_completions_unique'
    add_index :pet_sit_completions, :completion_date
    add_foreign_key :pet_sit_completions, :users, column: :completed_by_user_id
  end
end
