class CreateAppointments < ActiveRecord::Migration[6.1]
  def change
    create_table :appointments do |t|
      t.belongs_to :user, null: false, foreign_key: true
      t.belongs_to :pet, null: false, foreign_key: true
      t.boolean :recurring
      t.datetime :appointment_date
      t.datetime :start_time
      t.datetime :end_time
      t.integer :duration
      t.integer :price
      t.boolean :monday
      t.boolean :tuesday
      t.boolean :wednesday
      t.boolean :thursday
      t.boolean :friday
      t.boolean :saturday
      t.boolean :sunday
      t.boolean :completed
      t.boolean :canceled

      t.timestamps
    end
  end
end
