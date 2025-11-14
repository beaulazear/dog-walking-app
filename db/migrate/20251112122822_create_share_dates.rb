class CreateShareDates < ActiveRecord::Migration[7.2]
  def change
    create_table :share_dates do |t|
      t.references :appointment_share, null: false, foreign_key: true
      t.date :date, null: false
      t.timestamps
    end

    add_index :share_dates, %i[appointment_share_id date], unique: true
  end
end
