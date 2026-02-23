class AddBillingSettingsToUsers < ActiveRecord::Migration[7.2]
  def change
    add_column :users, :billing_day_of_week, :integer, comment: "0=Sunday, 1=Monday, etc."
    add_column :users, :billing_time_of_day, :time, comment: "Time of day to generate bills"
    add_column :users, :billing_recurrence_weeks, :integer, default: 2, comment: "Billing frequency in weeks (1-4)"
  end
end
