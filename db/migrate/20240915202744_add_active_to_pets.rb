class AddActiveToPets < ActiveRecord::Migration[6.1]
  def change
    add_column :pets, :active, :boolean, default: true, null: false
  end
end
