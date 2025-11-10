class CreateWalkGroups < ActiveRecord::Migration[7.2]
  def change
    create_table :walk_groups do |t|
      t.references :user, null: false, foreign_key: true
      t.date :date
      t.string :name

      t.timestamps
    end
  end
end
