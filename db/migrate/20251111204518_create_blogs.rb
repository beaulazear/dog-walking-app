class CreateBlogs < ActiveRecord::Migration[7.2]
  def change
    create_table :blogs do |t|
      t.references :user, null: false, foreign_key: true
      t.references :pet, foreign_key: true
      t.text :content
      t.string :training_focus, array: true, default: []

      t.timestamps
    end

    add_index :blogs, %i[user_id created_at]
  end
end
