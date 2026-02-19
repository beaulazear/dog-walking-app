class AddCancellationFieldsToCleanupJobs < ActiveRecord::Migration[7.2]
  def change
    add_column :cleanup_jobs, :cancelled_by_id, :bigint
    add_column :cleanup_jobs, :cancelled_at, :datetime
    add_column :cleanup_jobs, :cancellation_fee_amount, :decimal, precision: 10, scale: 2
    add_column :cleanup_jobs, :cancellation_reason, :text

    # Index for tracking who cancelled
    add_index :cleanup_jobs, :cancelled_by_id

    # Foreign key to users table
    add_foreign_key :cleanup_jobs, :users, column: :cancelled_by_id
  end
end
