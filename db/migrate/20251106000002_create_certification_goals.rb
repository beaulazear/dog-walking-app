class CreateCertificationGoals < ActiveRecord::Migration[7.2]
  def change
    create_table :certification_goals do |t|
      t.references :user, null: false, foreign_key: true, index: { unique: true }
      t.string :certification_type, default: 'CPDT-KA'
      t.integer :target_hours, default: 300
      t.integer :weekly_goal_hours, default: 12
      t.date :target_completion_date

      t.timestamps
    end
  end
end
