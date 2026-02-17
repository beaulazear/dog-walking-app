class CleanupsController < ApplicationController
  before_action :set_cleanup, only: [ :show, :update, :destroy ]
  before_action :require_scooper, only: [ :create, :update, :destroy ]

  # GET /cleanups
  # Returns cleanups - optionally filtered by scooper, block, or date range
  def index
    cleanups = Cleanup.all

    # Filter by scooper
    cleanups = cleanups.where(user_id: params[:user_id]) if params[:user_id].present?

    # Filter by block
    cleanups = cleanups.where(block_id: params[:block_id]) if params[:block_id].present?

    # Filter by date range
    if params[:start_date].present?
      start_date = Date.parse(params[:start_date])
      cleanups = cleanups.where("cleanup_date >= ?", start_date)
    end

    if params[:end_date].present?
      end_date = Date.parse(params[:end_date])
      cleanups = cleanups.where("cleanup_date <= ?", end_date)
    end

    # Order by most recent first
    cleanups = cleanups.order(cleanup_timestamp: :desc)

    # Pagination
    page = params[:page] || 1
    per_page = params[:per_page] || 50

    cleanups = cleanups.page(page).per(per_page)

    render json: {
      cleanups: cleanups.map { |cleanup| serialize_cleanup(cleanup) },
      meta: {
        current_page: cleanups.current_page,
        total_pages: cleanups.total_pages,
        total_count: cleanups.total_count
      }
    }
  rescue Date::Error
    render json: { error: "Invalid date format" }, status: :bad_request
  end

  # GET /cleanups/:id
  def show
    render json: {
      cleanup: serialize_cleanup_detail(@cleanup)
    }
  end

  # POST /cleanups
  # Log a new cleanup (GPS-verified)
  def create
    block = Block.find(params[:block_id])

    # Verify scooper has active coverage on this block
    unless block.active_scooper_id == current_user.id
      return render json: {
        error: "You must be the active scooper for this block to log cleanups"
      }, status: :forbidden
    end

    # Validate GPS coordinates
    latitude = params[:cleanup][:latitude]&.to_f
    longitude = params[:cleanup][:longitude]&.to_f

    unless validate_coordinates(latitude, longitude)
      return render json: {
        error: "Invalid GPS coordinates. Latitude must be between -90 and 90, longitude between -180 and 180."
      }, status: :unprocessable_entity
    end

    # Validate pickup count
    pickup_count = params[:cleanup][:pickup_count]&.to_i || 0
    if pickup_count < 0 || pickup_count > 10000
      return render json: {
        error: "Invalid pickup count. Must be between 0 and 10,000."
      }, status: :unprocessable_entity
    end

    cleanup = Cleanup.new(
      user: current_user,
      block: block,
      latitude: latitude,
      longitude: longitude,
      pickup_count: pickup_count,
      cleanup_date: Date.today,
      cleanup_timestamp: Time.current,
      gps_verified: true
    )

    if cleanup.save
      # Attach photo if provided
      if params[:cleanup][:photo].present?
        cleanup.photo.attach(params[:cleanup][:photo])
        cleanup.update(has_photo: true)
      end

      # Callbacks will automatically:
      # - Update block stats
      # - Update scooper stats
      # - Check for milestone achievements

      render json: {
        cleanup: serialize_cleanup_detail(cleanup.reload),
        message: "Cleanup logged successfully!",
        new_milestones: cleanup.user.scooper_milestones.where(celebrated: false).map { |m| serialize_milestone(m) }
      }, status: :created
    else
      render json: { errors: cleanup.errors.full_messages }, status: :unprocessable_entity
    end
  rescue ActiveRecord::RecordNotFound
    render json: { error: "Block not found" }, status: :not_found
  rescue ActiveRecord::RecordNotUnique
    # Database-level unique constraint violation (race condition caught!)
    # Find the existing cleanup and return it
    existing_cleanup = Cleanup.find_by(
      user_id: current_user.id,
      block_id: block.id,
      cleanup_date: Date.today
    )

    render json: {
      error: "You have already logged a cleanup for this block today",
      existing_cleanup: serialize_cleanup(existing_cleanup)
    }, status: :unprocessable_entity
  end

  # PATCH /cleanups/:id
  # Update pickup count or add photo
  def update
    unless @cleanup.user_id == current_user.id
      return render json: { error: "Unauthorized" }, status: :forbidden
    end

    # Can only update today's cleanup
    unless @cleanup.cleanup_date == Date.today
      return render json: { error: "Can only update today's cleanup" }, status: :unprocessable_entity
    end

    old_pickup_count = @cleanup.pickup_count

    if @cleanup.update(cleanup_update_params)
      # Attach photo if provided
      if params[:cleanup][:photo].present?
        @cleanup.photo.attach(params[:cleanup][:photo])
        @cleanup.update(has_photo: true)
      end

      # If pickup count changed, update stats
      if old_pickup_count != @cleanup.pickup_count
        pickup_difference = @cleanup.pickup_count - old_pickup_count

        # Update block stats
        @cleanup.block.increment!(:total_pickups_all_time, pickup_difference)
        @cleanup.block.increment!(:current_month_pickups, pickup_difference)

        # Update scooper stats
        @cleanup.user.increment!(:total_lifetime_pickups, pickup_difference)
      end

      render json: {
        cleanup: serialize_cleanup_detail(@cleanup.reload),
        message: "Cleanup updated successfully"
      }
    else
      render json: { errors: @cleanup.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # DELETE /cleanups/:id
  # Delete a cleanup (only allowed for today's cleanups)
  def destroy
    unless @cleanup.user_id == current_user.id
      return render json: { error: "Unauthorized" }, status: :forbidden
    end

    # Can only delete today's cleanup
    unless @cleanup.cleanup_date == Date.today
      return render json: { error: "Can only delete today's cleanup" }, status: :unprocessable_entity
    end

    # Reverse stat updates before deletion
    @cleanup.block.decrement!(:total_pickups_all_time, @cleanup.pickup_count)
    @cleanup.block.decrement!(:current_month_pickups, @cleanup.pickup_count)
    @cleanup.user.decrement!(:total_lifetime_pickups, @cleanup.pickup_count)

    @cleanup.destroy
    render json: { message: "Cleanup deleted successfully" }
  end

  private

  def set_cleanup
    @cleanup = Cleanup.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    render json: { error: "Cleanup not found" }, status: :not_found
  end

  def require_scooper
    unless current_user&.is_scooper
      render json: { error: "You must be a scooper to perform this action" }, status: :forbidden
    end
  end

  def cleanup_update_params
    params.require(:cleanup).permit(:pickup_count)
  end

  def validate_coordinates(latitude, longitude)
    return false if latitude.nil? || longitude.nil?
    return false if latitude < -90 || latitude > 90
    return false if longitude < -180 || longitude > 180
    true
  end

  def serialize_cleanup(cleanup)
    {
      id: cleanup.id,
      cleanup_date: cleanup.cleanup_date,
      cleanup_timestamp: cleanup.cleanup_timestamp,
      pickup_count: cleanup.pickup_count,
      latitude: cleanup.latitude,
      longitude: cleanup.longitude,
      has_photo: cleanup.has_photo,
      photo_url: cleanup.photo.attached? ? url_for(cleanup.photo) : nil,
      gps_verified: cleanup.gps_verified,
      scooper: {
        id: cleanup.user.id,
        name: cleanup.user.name,
        profile_pic_url: cleanup.user.profile_pic_url
      },
      block: {
        id: cleanup.block.id,
        block_id: cleanup.block.block_id,
        neighborhood: cleanup.block.neighborhood,
        borough: cleanup.block.borough
      }
    }
  end

  def serialize_cleanup_detail(cleanup)
    serialize_cleanup(cleanup).merge(
      block_stats: {
        total_pickups_all_time: cleanup.block.total_pickups_all_time,
        current_month_pickups: cleanup.block.current_month_pickups,
        active_streak_days: cleanup.block.active_streak_days
      },
      scooper_stats: {
        total_lifetime_pickups: cleanup.user.total_lifetime_pickups,
        current_streak_days: cleanup.user.current_streak_days
      }
    )
  end

  def serialize_milestone(milestone)
    {
      id: milestone.id,
      milestone_type: milestone.milestone_type,
      threshold: milestone.threshold,
      title: milestone.title,
      badge_icon: milestone.badge_icon,
      description: milestone.description,
      achieved_at: milestone.achieved_at,
      celebrated: milestone.celebrated
    }
  end
end
