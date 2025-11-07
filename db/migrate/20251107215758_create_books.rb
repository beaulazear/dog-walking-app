class CreateBooks < ActiveRecord::Migration[7.2]
  def change
    create_table :books do |t|
      t.references :user, null: true, foreign_key: true # null for default books
      t.string :title, null: false
      t.string :author, null: false
      t.string :category, null: false
      t.boolean :is_default, default: false, null: false
      t.string :status, default: 'not_started'
      t.integer :progress_percentage, default: 0
      t.text :notes
      t.integer :rating # 1-5 stars
      t.text :description
      t.integer :pages
      t.string :publisher
      t.integer :year
      t.string :isbn
      t.string :price_range
      t.string :format
      t.text :why_you_need_it
      t.text :best_for
      t.date :completed_date

      t.timestamps
    end

    add_index :books, %i[user_id is_default]
    add_index :books, :status
  end
end
