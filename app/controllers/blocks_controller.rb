class BlocksController < ApplicationController
  before_action :set_block, only: [ :show, :stats ]
  skip_before_action :authorized, only: [ :index, :show, :nearby, :stats ]

  # GET /blocks
  # Returns all blocks with optional filters
  def index
    blocks = Block.all

    # Filter by status
    blocks = blocks.where(status: params[:status]) if params[:status].present?

    # Filter by borough
    blocks = blocks.by_borough(params[:borough]) if params[:borough].present?

    # Filter by neighborhood
    blocks = blocks.by_neighborhood(params[:neighborhood]) if params[:neighborhood].present?

    # Pagination
    page = params[:page] || 1
    per_page = params[:per_page] || 50

    blocks = blocks.page(page).per(per_page)

    render json: {
      blocks: blocks.map { |block| serialize_block(block) },
      meta: {
        current_page: blocks.current_page,
        total_pages: blocks.total_pages,
        total_count: blocks.total_count
      }
    }
  end

  # GET /blocks/:id
  # Returns detailed block information including competing scoopers
  def show
    render json: {
      block: serialize_block_detail(@block)
    }
  end

  # GET /blocks/nearby
  # Find blocks near a specific location
  def nearby
    latitude = params[:latitude]&.to_f
    longitude = params[:longitude]&.to_f
    radius = params[:radius]&.to_i || 1000 # Default 1km radius

    unless latitude && longitude
      return render json: { error: "Latitude and longitude required" }, status: :bad_request
    end

    blocks = Block.nearby(latitude, longitude, radius)

    render json: {
      blocks: blocks.map { |block| serialize_block(block) },
      meta: {
        latitude: latitude,
        longitude: longitude,
        radius_meters: radius,
        count: blocks.count
      }
    }
  end

  # GET /blocks/:id/stats
  # Returns block statistics (pickups, cleanups, etc.)
  def stats
    recent_cleanups = @block.cleanups.this_month.order(cleanup_date: :desc).limit(30)

    render json: {
      total_pickups_all_time: @block.total_pickups_all_time,
      current_month_pickups: @block.current_month_pickups,
      active_streak_days: @block.active_streak_days,
      last_cleanup_date: @block.last_cleanup_date,
      recent_cleanups: recent_cleanups.map { |cleanup| serialize_cleanup(cleanup) },
      average_daily_pickups: calculate_average_daily_pickups(@block)
    }
  end

  private

  def set_block
    @block = Block.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    render json: { error: "Block not found" }, status: :not_found
  end

  def serialize_block(block)
    {
      id: block.id,
      block_id: block.block_id,
      status: block.status,
      neighborhood: block.neighborhood,
      borough: block.borough,
      geojson: block.geojson,
      active_monthly_rate: block.active_monthly_rate,
      total_pledge_amount: block.total_pledge_amount,
      pledge_progress_percentage: block.pledge_progress_percentage,
      total_pickups_all_time: block.total_pickups_all_time,
      current_month_pickups: block.current_month_pickups,
      active_streak_days: block.active_streak_days,
      last_cleanup_date: block.last_cleanup_date,
      competing_scoopers_count: block.competing_scoopers.count,
      warning_expires_at: block.warning_expires_at
    }
  end

  def serialize_block_detail(block)
    serialize_block(block).merge(
      active_scooper: block.active_scooper ? serialize_scooper(block.active_scooper) : nil,
      competing_scoopers: block.competing_scoopers.map { |cr| serialize_coverage_region(cr) },
      recent_cleanups_count: block.cleanups.this_week.count,
      open_poop_reports_count: block.poop_reports.open.count
    )
  end

  def serialize_scooper(user)
    {
      id: user.id,
      name: user.name,
      profile_pic_url: user.profile_pic_url,
      total_lifetime_pickups: user.total_lifetime_pickups,
      current_streak_days: user.current_streak_days
    }
  end

  def serialize_coverage_region(coverage_region)
    {
      id: coverage_region.id,
      scooper: serialize_scooper(coverage_region.user),
      monthly_rate: coverage_region.monthly_rate,
      total_pledges: coverage_region.total_pledges,
      pledge_progress_percentage: coverage_region.pledge_progress_percentage,
      service_days: coverage_region.service_days,
      status: coverage_region.status
    }
  end

  def serialize_cleanup(cleanup)
    {
      id: cleanup.id,
      cleanup_date: cleanup.cleanup_date,
      pickup_count: cleanup.pickup_count,
      scooper_name: cleanup.user.name
    }
  end

  def calculate_average_daily_pickups(block)
    return 0 if block.cleanups.empty?

    days_active = (Date.today - block.activated_at.to_date).to_i + 1
    return 0 if days_active <= 0

    (block.total_pickups_all_time.to_f / days_active).round(2)
  end
end
