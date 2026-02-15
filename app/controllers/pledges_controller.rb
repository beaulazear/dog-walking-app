class PledgesController < ApplicationController
  before_action :set_pledge, only: [:show, :update, :destroy]
  before_action :require_client, only: [:create, :switch_scooper]

  # GET /pledges
  # Returns pledges - optionally filtered by client or block
  def index
    if params[:client_id].present?
      # Get all pledges by a specific client
      pledges = Pledge.where(client_id: params[:client_id])
    elsif params[:block_id].present?
      # Get all pledges for a specific block
      pledges = Pledge.where(block_id: params[:block_id])
    elsif current_user
      # If logged in as user, show their client's pledges
      client = current_user.client
      pledges = client ? client.pledges : Pledge.none
    else
      pledges = Pledge.all
    end

    # Filter by status
    pledges = pledges.where(status: params[:status]) if params[:status].present?

    render json: {
      pledges: pledges.map { |pledge| serialize_pledge(pledge) }
    }
  end

  # GET /pledges/:id
  def show
    # Only allow viewing own pledges unless admin
    if @pledge.client.user_id != current_user&.id
      return render json: { error: 'Unauthorized' }, status: :forbidden
    end

    render json: {
      pledge: serialize_pledge_detail(@pledge)
    }
  end

  # POST /pledges
  # Client creates a pledge toward a coverage region
  def create
    client = current_user.client
    unless client
      return render json: { error: 'Client profile not found' }, status: :unprocessable_entity
    end

    coverage_region = CoverageRegion.find(params[:coverage_region_id])
    block = coverage_region.block

    # Check if client already has a pledge on this block
    existing_pledge = Pledge.find_by(client_id: client.id, block_id: block.id)
    if existing_pledge
      return render json: {
        error: 'You already have a pledge on this block',
        existing_pledge: serialize_pledge(existing_pledge)
      }, status: :unprocessable_entity
    end

    # Validate amount
    amount = params[:pledge][:amount].to_f
    if amount < 5
      return render json: { error: 'Minimum pledge amount is $5.00' }, status: :unprocessable_entity
    end

    pledge = Pledge.new(
      client: client,
      block: block,
      coverage_region: coverage_region,
      amount: amount,
      anonymous: params[:pledge][:anonymous] || true,
      status: 'pending'
    )

    if pledge.save
      # If this pledge causes block to reach funding threshold, it will auto-activate via callback
      render json: {
        pledge: serialize_pledge_detail(pledge),
        message: 'Pledge created successfully!',
        block_activated: pledge.reload.status == 'active'
      }, status: :created
    else
      render json: { errors: pledge.errors.full_messages }, status: :unprocessable_entity
    end
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'Coverage region not found' }, status: :not_found
  end

  # PATCH /pledges/:id
  # Update pledge amount or privacy settings
  def update
    unless @pledge.client.user_id == current_user.id
      return render json: { error: 'Unauthorized' }, status: :forbidden
    end

    # Can only update amount if pledge is still pending or active
    unless ['pending', 'active'].include?(@pledge.status)
      return render json: { error: 'Cannot update cancelled or dissolved pledge' }, status: :unprocessable_entity
    end

    if @pledge.update(pledge_update_params)
      render json: {
        pledge: serialize_pledge_detail(@pledge),
        message: 'Pledge updated successfully'
      }
    else
      render json: { errors: @pledge.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # DELETE /pledges/:id
  # Cancel a pledge (this will trigger Stripe subscription cancellation)
  def destroy
    unless @pledge.client.user_id == current_user.id
      return render json: { error: 'Unauthorized' }, status: :forbidden
    end

    if @pledge.status == 'cancelled'
      return render json: { error: 'Pledge already cancelled' }, status: :unprocessable_entity
    end

    # TODO: Cancel Stripe subscription here
    # Stripe::Subscription.delete(@pledge.stripe_subscription_id) if @pledge.stripe_subscription_id

    @pledge.update(
      status: 'cancelled',
      cancelled_at: Time.current
    )

    render json: { message: 'Pledge cancelled successfully' }
  end

  # POST /pledges/:id/switch_scooper
  # Switch pledge to a different scooper on the same block
  def switch_scooper
    pledge = Pledge.find(params[:id])

    unless pledge.client.user_id == current_user.id
      return render json: { error: 'Unauthorized' }, status: :forbidden
    end

    new_coverage_region = CoverageRegion.find(params[:new_coverage_region_id])

    # Verify new coverage region is for the same block
    unless new_coverage_region.block_id == pledge.block_id
      return render json: { error: 'Coverage region must be for the same block' }, status: :unprocessable_entity
    end

    # Can't switch if block is already active (locked in)
    if pledge.block.status == 'active' && pledge.block.active_scooper_id != new_coverage_region.user_id
      return render json: {
        error: 'Cannot switch scoopers once block is active'
      }, status: :unprocessable_entity
    end

    if pledge.switch_to_coverage_region!(new_coverage_region)
      render json: {
        pledge: serialize_pledge_detail(pledge.reload),
        message: 'Successfully switched to new scooper'
      }
    else
      render json: { errors: pledge.errors.full_messages }, status: :unprocessable_entity
    end
  rescue ActiveRecord::RecordNotFound => e
    render json: { error: e.message }, status: :not_found
  end

  private

  def set_pledge
    @pledge = Pledge.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'Pledge not found' }, status: :not_found
  end

  def require_client
    unless current_user&.client
      render json: { error: 'You must have a client profile to create pledges' }, status: :forbidden
    end
  end

  def pledge_update_params
    params.require(:pledge).permit(:amount, :anonymous)
  end

  def serialize_pledge(pledge)
    {
      id: pledge.id,
      amount: pledge.amount,
      status: pledge.status,
      anonymous: pledge.anonymous,
      block: {
        id: pledge.block.id,
        block_id: pledge.block.block_id,
        neighborhood: pledge.block.neighborhood,
        borough: pledge.block.borough,
        status: pledge.block.status
      },
      scooper: {
        id: pledge.coverage_region.user.id,
        name: pledge.coverage_region.user.name,
        profile_pic_url: pledge.coverage_region.user.profile_pic_url
      },
      created_at: pledge.created_at,
      activated_at: pledge.activated_at,
      cancelled_at: pledge.cancelled_at
    }
  end

  def serialize_pledge_detail(pledge)
    serialize_pledge(pledge).merge(
      coverage_region: {
        id: pledge.coverage_region.id,
        monthly_rate: pledge.coverage_region.monthly_rate,
        total_pledges: pledge.coverage_region.total_pledges,
        pledge_progress_percentage: pledge.coverage_region.pledge_progress_percentage,
        service_days: pledge.coverage_region.service_days
      },
      stripe_subscription_id: pledge.stripe_subscription_id,
      block_fully_funded: pledge.coverage_region.fully_funded?
    )
  end
end
