class CreateTrainingSessions < ActiveRecord::Migration[7.2]
  def change
    create_table :training_sessions do |t|
      t.references :user, null: false, foreign_key: true
      t.references :pet, null: true, foreign_key: true
      t.datetime :session_date, null: false
      t.integer :duration_minutes, null: false
      t.string :session_type
      t.text :notes
      t.string :training_focus, array: true, default: []

      t.timestamps
    end

    add_index :training_sessions, %i[user_id session_date]
  end
end
