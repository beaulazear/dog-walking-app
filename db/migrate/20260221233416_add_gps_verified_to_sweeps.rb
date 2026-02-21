class AddGpsVerifiedToSweeps < ActiveRecord::Migration[7.2]
  def change
    add_column :sweeps, :gps_verified, :boolean, default: false, null: false
  end
end
