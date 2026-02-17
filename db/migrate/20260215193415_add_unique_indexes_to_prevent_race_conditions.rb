class AddUniqueIndexesToPreventRaceConditions < ActiveRecord::Migration[7.2]
  def change
    # Ensure one cleanup per scooper per block per day (prevents duplicate cleanup race condition)
    # This will cause a database-level constraint error if violated
    add_index :cleanups, [ :user_id, :block_id, :cleanup_date ],
              unique: true,
              name: 'index_cleanups_unique_daily',
              if_not_exists: true

    # Ensure one pledge per client per block (already validated in model, but enforce at DB level)
    # Note: This may already exist from previous migrations
    unless index_exists?(:pledges, [ :client_id, :block_id ], unique: true)
      add_index :pledges, [ :client_id, :block_id ],
                unique: true,
                name: 'index_pledges_unique_client_block'
    end

    # Ensure one coverage region per scooper per block (already validated in model, but enforce at DB level)
    unless index_exists?(:coverage_regions, [ :user_id, :block_id ], unique: true)
      add_index :coverage_regions, [ :user_id, :block_id ],
                unique: true,
                name: 'index_coverage_regions_unique_user_block'
    end
  end
end
