class EnablePostgis < ActiveRecord::Migration[7.2]
  def up
    # Only enable PostGIS in production/staging (Render has it)
    # Skip in development (PostgreSQL 14 doesn't have PostGIS locally)
    enable_extension 'postgis' unless Rails.env.development?
  end

  def down
    disable_extension 'postgis' unless Rails.env.development?
  end
end
