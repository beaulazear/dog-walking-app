class CoverageRegionsController < ApplicationController
  before_action :set_coverage_region, only: [:show, :update, :destroy]
  before_action :require_scooper, only: [:create, :update, :destroy]

  # GET /coverage_regions
  # Returns coverage regions - optionally filtered by scooper or block
  def index
    if params[:user_id].present?
      # Get all blocks claimed by a specific scooper
      coverage_regions = CoverageRegion.where(user_id: params[:user_id])
    elsif params[:block_id].present?
      # Get all scoopers competing for a specific block
      coverage_regions = CoverageRegion.where(block_id: params[:block_id])
    else
      coverage_regions = CoverageRegion.all
    end

    # Filter by status
    coverage_regions = coverage_regions.where(status: params[:status]) if params[:status].present?

    render json: {
      coverage_regions: coverage_regions.map { |cr| serialize_coverage_region(cr) }
    }
  end

  # GET /coverage_regions/:id
  def show
    render json: {
      coverage_region: serialize_coverage_region_detail(@coverage_region)
    }
  end

  # POST /coverage_regions
  # Scooper claims a block with their rate and service days
  def create
    block = Block.find(params[:block_id])

    # Check if scooper already has a claim on this block
    existing_claim = CoverageRegion.find_by(user_id: current_user.id, block_id: block.id)
    if existing_claim
      return render json: { error: 'You already have a claim on this block' }, status: :unprocessable_entity
    end

    coverage_region = CoverageRegion.new(coverage_region_params)
    coverage_region.user = current_user
    coverage_region.block = block

    if coverage_region.save
      render json: {
        coverage_region: serialize_coverage_region_detail(coverage_region),
        message: 'Block claimed successfully!'
      }, status: :created
    else
      render json: { errors: coverage_region.errors.full_messages }, status: :unprocessable_entity
    end
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'Block not found' }, status: :not_found
  end

  # PATCH /coverage_regions/:id
  # Update monthly rate or service days
  def update
    unless @coverage_region.user_id == current_user.id
      return render json: { error: 'Unauthorized' }, status: :forbidden
    end

    # Can't update if block is already active with another scooper
    if @coverage_region.status == 'lost'
      return render json: { error: 'Cannot update - block was won by another scooper' }, status: :unprocessable_entity
    end

    if @coverage_region.update(coverage_region_params)
      render json: {
        coverage_region: serialize_coverage_region_detail(@coverage_region),
        message: 'Coverage region updated successfully'
      }
    else
      render json: { errors: @coverage_region.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # DELETE /coverage_regions/:id
  # Unclaim a block
  def destroy
    unless @coverage_region.user_id == current_user.id
      return render json: { error: 'Unauthorized' }, status: :forbidden
    end

    # Can't unclaim if block is active with this scooper
    if @coverage_region.block.active_scooper_id == current_user.id
      return render json: {
        error: 'Cannot unclaim active block. Please contact support to deactivate.'
      }, status: :unprocessable_entity
    end

    @coverage_region.destroy
    render json: { message: 'Block unclaimed successfully' }
  end

  private

  def set_coverage_region
    @coverage_region = CoverageRegion.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'Coverage region not found' }, status: :not_found
  end

  def require_scooper
    unless current_user&.is_scooper
      render json: { error: 'You must be a scooper to perform this action' }, status: :forbidden
    end
  end

  def coverage_region_params
    params.require(:coverage_region).permit(
      :block_id,
      :monthly_rate,
      :monday,
      :tuesday,
      :wednesday,
      :thursday,
      :friday,
      :saturday,
      :sunday
    )
  end

  def serialize_coverage_region(coverage_region)
    {
      id: coverage_region.id,
      block: {
        id: coverage_region.block.id,
        block_id: coverage_region.block.block_id,
        neighborhood: coverage_region.block.neighborhood,
        borough: coverage_region.block.borough,
        status: coverage_region.block.status
      },
      scooper: {
        id: coverage_region.user.id,
        name: coverage_region.user.name,
        profile_pic_url: coverage_region.user.profile_pic_url,
        total_lifetime_pickups: coverage_region.user.total_lifetime_pickups
      },
      monthly_rate: coverage_region.monthly_rate,
      total_pledges: coverage_region.total_pledges,
      pledge_progress_percentage: coverage_region.pledge_progress_percentage,
      service_days: coverage_region.service_days,
      status: coverage_region.status,
      created_at: coverage_region.created_at
    }
  end

  def serialize_coverage_region_detail(coverage_region)
    serialize_coverage_region(coverage_region).merge(
      pledges_count: coverage_region.pledges.active.count,
      fully_funded: coverage_region.fully_funded?,
      amount_remaining: [(coverage_region.monthly_rate - coverage_region.total_pledges), 0].max
    )
  end
end
