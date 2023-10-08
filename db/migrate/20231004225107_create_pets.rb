class CreatePets < ActiveRecord::Migration[6.1]
  def change
    create_table :pets do |t|
      t.belongs_to :user, null: false, foreign_key: true
      t.string :name
      t.datetime :birthdate
      t.string :sex
      t.boolean :spayed_neutered
      t.string :address
      t.text :behavorial_notes
      t.text :supplies_location
      t.string :allergies

      t.timestamps
    end
  end
end
