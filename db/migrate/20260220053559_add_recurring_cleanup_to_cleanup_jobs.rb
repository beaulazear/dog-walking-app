class AddRecurringCleanupToCleanupJobs < ActiveRecord::Migration[7.2]
  def change
    add_reference :cleanup_jobs, :recurring_cleanup, null: true, foreign_key: true
  end
end
