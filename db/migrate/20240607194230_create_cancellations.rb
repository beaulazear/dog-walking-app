class CreateCancellations < ActiveRecord::Migration[6.1]
  def change
    create_table :cancellations do |t|
      t.datetime :date
      t.belongs_to :appointment, null: false, foreign_key: true

      t.timestamps
    end
  end
end
