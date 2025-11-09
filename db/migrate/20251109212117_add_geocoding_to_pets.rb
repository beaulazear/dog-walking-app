class AddGeocodingToPets < ActiveRecord::Migration[7.2]
  def change
    add_column :pets, :latitude, :decimal, precision: 10, scale: 6
    add_column :pets, :longitude, :decimal, precision: 10, scale: 6
    add_column :pets, :geocoded_at, :datetime
    add_column :pets, :geocoding_failed, :boolean, default: false
    add_column :pets, :geocoding_error, :string

    add_index :pets, %i[latitude longitude]
  end
end
