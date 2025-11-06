class CreateMilestones < ActiveRecord::Migration[7.2]
  def change
    create_table :milestones do |t|
      t.references :user, null: false, foreign_key: true
      t.integer :hours_reached
      t.datetime :achieved_at, null: false
      t.boolean :celebrated, default: false

      t.timestamps
    end

    add_index :milestones, %i[user_id hours_reached], unique: true
  end
end
