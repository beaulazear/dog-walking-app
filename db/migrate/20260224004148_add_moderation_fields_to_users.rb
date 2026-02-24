class AddModerationFieldsToUsers < ActiveRecord::Migration[7.2]
  def change
    add_column :users, :status, :string, default: 'active', null: false
    add_column :users, :suspended_until, :datetime
    add_column :users, :suspension_reason, :text
    add_column :users, :banned_at, :datetime
    add_column :users, :ban_reason, :text
    add_column :users, :warnings_count, :integer, default: 0, null: false
    add_column :users, :reports_count, :integer, default: 0, null: false

    # Policy acceptance tracking (for App Store compliance)
    add_column :users, :terms_accepted_at, :datetime
    add_column :users, :terms_version, :string
    add_column :users, :privacy_policy_accepted_at, :datetime
    add_column :users, :privacy_policy_version, :string
    add_column :users, :community_guidelines_accepted_at, :datetime
    add_column :users, :community_guidelines_version, :string

    # Indexes for performance
    add_index :users, :status
    add_index :users, :suspended_until
    add_index :users, :banned_at
  end
end
