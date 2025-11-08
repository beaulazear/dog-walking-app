class UpdateExistingBooksWithUrls < ActiveRecord::Migration[7.2]
  def up
    # Load and execute the books seed file, which will create or update books
    load Rails.root.join('db', 'seeds', 'books_seed.rb')

    puts 'Books seed file executed - URLs should now be present on all default books'
  end

  def down
    # Remove URLs from all default books
    Book.where(is_default: true, user_id: nil).update_all(
      purchase_url: nil,
      audible_url: nil
    )
  end
end
