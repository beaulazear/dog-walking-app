class AddNeighborhoodToCleanupJobs < ActiveRecord::Migration[7.2]
  def change
    add_column :cleanup_jobs, :neighborhood, :string
    add_index :cleanup_jobs, :neighborhood
  end
end
