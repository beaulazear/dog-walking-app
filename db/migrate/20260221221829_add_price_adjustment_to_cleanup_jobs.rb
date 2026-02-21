class AddPriceAdjustmentToCleanupJobs < ActiveRecord::Migration[7.2]
  def change
    # Price adjustment flow (worse-than-described scenario)
    add_column :cleanup_jobs, :arrival_status, :string
    add_column :cleanup_jobs, :price_adjustment_requested, :decimal, precision: 10, scale: 2
    add_column :cleanup_jobs, :price_adjustment_status, :string
    add_column :cleanup_jobs, :price_adjustment_requested_at, :datetime
    add_column :cleanup_jobs, :price_adjustment_responded_at, :datetime

    # Block ID for grouping jobs (format: "BK-40.6782--73.9442")
    # Note: cleanup_jobs already has block_id as foreign key to blocks table
    # We'll add a string column for the simple block identifier
    add_column :cleanup_jobs, :block_identifier, :string

    add_index :cleanup_jobs, :arrival_status
    add_index :cleanup_jobs, :price_adjustment_status
    add_index :cleanup_jobs, :block_identifier
  end
end
