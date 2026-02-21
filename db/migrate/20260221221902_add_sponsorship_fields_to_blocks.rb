class AddSponsorshipFieldsToBlocks < ActiveRecord::Migration[7.2]
  def change
    # Add sponsorship display fields to blocks table
    add_column :blocks, :this_week_pickups, :integer, default: 0
    add_column :blocks, :clean_since_date, :date
    add_column :blocks, :sponsor_display_name, :string

    # Note: blocks table already has current_month_pickups, total_pickups_all_time
  end
end
