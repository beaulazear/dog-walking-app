class AddJobMetadataToCleanupJobs < ActiveRecord::Migration[7.2]
  def change
    add_column :cleanup_jobs, :job_type, :string, null: false, default: "poop"
    add_column :cleanup_jobs, :poop_itemization, :string
    add_column :cleanup_jobs, :litter_itemization, :string
    add_column :cleanup_jobs, :segments_selected, :jsonb, default: []

    # Index for filtering by job type
    add_index :cleanup_jobs, :job_type
  end
end
