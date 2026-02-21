class AddDogWalkerFieldsToUsers < ActiveRecord::Migration[7.2]
  def change
    # Add poster role (anyone can post jobs or sponsor blocks)
    add_column :users, :is_poster, :boolean, default: false, null: false

    # Dog walker specific fields
    add_column :users, :is_dog_walker, :boolean, default: false, null: false
    add_column :users, :instagram_handle, :string
    add_column :users, :neighborhoods, :text, array: true, default: []
    add_column :users, :business_name, :string

    # Profile fields
    add_column :users, :profile_photo_url, :string
    add_column :users, :overall_rating, :decimal, precision: 3, scale: 2, default: 0.0
    add_column :users, :total_pickups, :integer, default: 0

    # User type for convenience (can be 'scooper', 'poster', or 'both')
    add_column :users, :user_type, :string

    # Indexes for performance
    add_index :users, :is_poster
    add_index :users, :is_dog_walker
    add_index :users, :neighborhoods, using: :gin
  end
end
