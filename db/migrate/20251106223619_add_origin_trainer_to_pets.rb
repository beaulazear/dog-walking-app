class AddOriginTrainerToPets < ActiveRecord::Migration[7.2]
  def change
    add_column :pets, :origin_trainer, :boolean, default: false, null: false
  end
end
