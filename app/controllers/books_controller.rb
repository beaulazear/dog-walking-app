class BooksController < ApplicationController
  before_action :current_user

  # GET /books - Returns all default books
  def index
    default_books = Book.defaults
    render json: default_books.as_json(except: %i[created_at updated_at]), status: :ok
  end

  # GET /books/my_list - Returns user's tracked books (cloned + custom)
  def my_list
    user_books = @current_user.books
    render json: user_books.as_json(except: %i[created_at updated_at]), status: :ok
  end

  # POST /books/:id/add_to_list - Clone a default book to user's list
  def add_to_list
    default_book = Book.find_by(id: params[:id], is_default: true, user_id: nil)

    if default_book.nil?
      render json: { error: 'Default book not found' }, status: :not_found
      return
    end

    # Check if user already has this book
    existing_book = @current_user.books.find_by(
      title: default_book.title,
      author: default_book.author
    )

    if existing_book
      render json: { error: 'Book already in your list' }, status: :unprocessable_entity
      return
    end

    # Clone the book for the user
    user_book = @current_user.books.create(
      title: default_book.title,
      author: default_book.author,
      category: default_book.category,
      description: default_book.description,
      pages: default_book.pages,
      publisher: default_book.publisher,
      year: default_book.year,
      isbn: default_book.isbn,
      price_range: default_book.price_range,
      format: default_book.format,
      why_you_need_it: default_book.why_you_need_it,
      best_for: default_book.best_for,
      is_default: false,
      status: 'not_started',
      progress_percentage: 0
    )

    if user_book.valid?
      render json: user_book.as_json(except: %i[created_at updated_at]), status: :created
    else
      render json: { errors: user_book.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # POST /books/custom - Create a custom user book
  def create_custom
    user_book = @current_user.books.create(
      title: params[:title],
      author: params[:author],
      category: 'User Recommendation',
      description: params[:description],
      notes: params[:notes],
      is_default: false,
      status: params[:status] || 'not_started',
      progress_percentage: params[:progress_percentage] || 0
    )

    if user_book.valid?
      render json: user_book.as_json(except: %i[created_at updated_at]), status: :created
    else
      render json: { errors: user_book.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # PATCH /books/:id - Update user's book (progress, status, notes, rating)
  def update
    book = @current_user.books.find_by(id: params[:id])

    if book.nil?
      render json: { error: 'Book not found' }, status: :not_found
      return
    end

    # Only allow updating certain fields
    update_params = {}
    update_params[:status] = params[:status] if params[:status]
    update_params[:progress_percentage] = params[:progress_percentage] if params[:progress_percentage]
    update_params[:notes] = params[:notes] if params.key?(:notes)
    update_params[:rating] = params[:rating] if params[:rating]
    update_params[:completed_date] = params[:completed_date] if params[:completed_date]

    if book.update(update_params)
      render json: book.as_json(except: %i[created_at updated_at]), status: :ok
    else
      render json: { errors: book.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # DELETE /books/:id - Delete user's book
  def destroy
    book = @current_user.books.find_by(id: params[:id])

    if book.nil?
      render json: { error: 'Book not found' }, status: :not_found
      return
    end

    book.destroy
    render json: { message: 'Book deleted successfully' }, status: :ok
  end
end
