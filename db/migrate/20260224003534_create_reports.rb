class CreateReports < ActiveRecord::Migration[7.2]
  def change
    create_table :reports do |t|
      # Polymorphic association - can report Sightings, CleanupJobs, Users, etc.
      t.string :reportable_type, null: false
      t.bigint :reportable_id, null: false

      # Who reported it
      t.references :reporter, null: false, foreign_key: { to_table: :users }

      # Report details
      t.string :reason, null: false
      t.text :description

      # Status tracking
      t.string :status, default: 'pending', null: false
      t.datetime :reviewed_at
      t.references :reviewed_by, foreign_key: { to_table: :users }

      # Resolution
      t.string :resolution_action
      t.text :resolution_notes
      t.text :internal_notes # Admin-only notes

      t.timestamps
    end

    # Indexes for performance
    add_index :reports, [ :reportable_type, :reportable_id ]
    add_index :reports, :status
    add_index :reports, :reason
    add_index :reports, :created_at

    # Prevent duplicate reports (same user reporting same content)
    add_index :reports, [ :reporter_id, :reportable_type, :reportable_id ],
              unique: true,
              name: 'index_reports_on_reporter_and_reportable'
  end
end
