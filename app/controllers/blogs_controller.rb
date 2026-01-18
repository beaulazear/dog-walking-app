class BlogsController < ApplicationController
  before_action :current_user
  before_action :set_blog, only: %i[update destroy]

  # GET /blogs
  def index
    blogs = @current_user.blogs
                         .order(created_at: :desc)
                         .includes(:pet)

    render json: blogs.as_json(include: { pet: { only: %i[id name] } })
  end

  # POST /blogs
  def create
    blog = @current_user.blogs.build(blog_params)

    if blog.save
      render json: blog.as_json(include: { pet: { only: %i[id name] } }), status: :created
    else
      render json: { errors: blog.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # PATCH /blogs/:id
  def update
    if @blog.update(blog_params)
      render json: @blog.as_json(include: { pet: { only: %i[id name] } })
    else
      render json: { errors: @blog.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # DELETE /blogs/:id
  def destroy
    @blog.destroy
    head :no_content
  end

  private

  def set_blog
    @blog = @current_user.blogs.find_by(id: params[:id])
    render json: { error: "Blog not found" }, status: :not_found unless @blog
  end

  def blog_params
    params.require(:blog).permit(
      :pet_id,
      :content,
      training_focus: []
    )
  end
end
