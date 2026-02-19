class CreateReviews < ActiveRecord::Migration[7.2]
  def change
    create_table :reviews do |t|
      t.bigint :cleanup_job_id, null: false
      t.bigint :reviewer_id, null: false     # the poster
      t.bigint :scooper_id, null: false      # the scooper being reviewed
      t.integer :rating, null: false         # 1-5
      t.text :comment
      t.decimal :tip_amount, precision: 10, scale: 2

      t.timestamps
    end

    add_index :reviews, :cleanup_job_id
    add_index :reviews, :scooper_id
    add_index :reviews, :reviewer_id

    add_foreign_key :reviews, :cleanup_jobs
    add_foreign_key :reviews, :users, column: :reviewer_id
    add_foreign_key :reviews, :users, column: :scooper_id
  end
end
