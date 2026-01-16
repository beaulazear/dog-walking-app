class AddClientIdToPets < ActiveRecord::Migration[7.2]
  def change
    add_reference :pets, :client, null: true, foreign_key: true, index: true
  end
end
