class PledgesController < ApplicationController
  before_action :set_pledge, only: [ :show, :update, :destroy ]
  before_action :require_client, only: [ :create, :switch_scooper ]

  # GET /pledges
  # Returns pledges - optionally filtered by client or block
  def index
    # Authorization: Users can only see their own pledges or public block statistics
    if current_user&.client
      # Clients can only view their own pledges
      pledges = current_user.client.pledges
    elsif current_user&.is_scooper && params[:block_id].present?
      # Scoopers can view pledges for blocks they've claimed
      block = Block.find_by(id: params[:block_id])
      if block && block.coverage_regions.exists?(user_id: current_user.id)
        pledges = block.pledges
      else
        return render json: { error: "Unauthorized: You can only view pledges for blocks you've claimed" }, status: :forbidden
      end
    elsif current_user
      # Regular users (walkers) can see their client's pledges if they have a client profile
      client = current_user.client
      pledges = client ? client.pledges : Pledge.none
    else
      # Unauthenticated users cannot access pledges
      return render json: { error: "Unauthorized: Please log in to view pledges" }, status: :forbidden
    end

    # Filter by status
    pledges = pledges.where(status: params[:status]) if params[:status].present?

    render json: {
      pledges: pledges.map { |pledge| serialize_pledge(pledge) }
    }
  rescue ActiveRecord::RecordNotFound
    render json: { error: "Block not found" }, status: :not_found
  end

  # GET /pledges/:id
  def show
    # Only allow viewing own pledges unless admin
    if @pledge.client.user_id != current_user&.id
      return render json: { error: "Unauthorized" }, status: :forbidden
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
      return render json: { error: "Client profile not found" }, status: :unprocessable_entity
    end

    coverage_region = CoverageRegion.find(params[:coverage_region_id])
    block = coverage_region.block

    # Check if client already has a pledge on this block
    existing_pledge = Pledge.find_by(client_id: client.id, block_id: block.id)
    if existing_pledge
      return render json: {
        error: "You already have a pledge on this block",
        existing_pledge: serialize_pledge(existing_pledge)
      }, status: :unprocessable_entity
    end

    # Validate amount
    amount = params[:pledge][:amount].to_f
    if amount < 5
      return render json: { error: "Minimum pledge amount is $5.00" }, status: :unprocessable_entity
    end

    # CRITICAL: Payment method ID is required
    payment_method_id = params[:pledge][:payment_method_id]
    if payment_method_id.blank?
      return render json: {
        error: "Payment method is required. Please provide a valid payment method."
      }, status: :unprocessable_entity
    end

    pledge = Pledge.new(
      client: client,
      block: block,
      coverage_region: coverage_region,
      amount: amount,
      anonymous: params[:pledge][:anonymous] || true,
      stripe_payment_method_id: payment_method_id,
      status: "pending"
    )

    if pledge.save
      # If this pledge causes block to reach funding threshold, it will auto-activate via callback
      # The callback will use the stored payment_method_id to create Stripe subscriptions
      pledge.reload

      response_data = {
        pledge: serialize_pledge_detail(pledge),
        message: "Pledge created successfully!",
        block_activated: pledge.status == "active"
      }

      # If payment requires additional action (3D Secure)
      if pledge.requires_action && pledge.client_secret.present?
        response_data[:requires_action] = true
        response_data[:client_secret] = pledge.client_secret
        response_data[:message] = "Payment requires additional authentication"
      end

      render json: response_data, status: :created
    else
      render json: { errors: pledge.errors.full_messages }, status: :unprocessable_entity
    end
  rescue ActiveRecord::RecordNotFound
    render json: { error: "Coverage region not found" }, status: :not_found
  rescue Stripe::StripeError => e
    # Handle Stripe errors gracefully
    Rails.logger.error("Stripe error during pledge creation: #{e.message}")
    render json: {
      error: "Payment processing error: #{e.message}",
      type: "stripe_error"
    }, status: :unprocessable_entity
  end

  # PATCH /pledges/:id
  # Update pledge amount or privacy settings
  def update
    unless @pledge.client.user_id == current_user.id
      return render json: { error: "Unauthorized" }, status: :forbidden
    end

    # Can only update if pledge is still pending, active, or dissolved
    unless [ "pending", "active", "dissolved" ].include?(@pledge.status)
      return render json: { error: "Cannot update cancelled pledge" }, status: :unprocessable_entity
    end

    # CRITICAL: Prevent amount changes for active pledges with Stripe subscriptions
    if @pledge.status == "active" && @pledge.stripe_subscription_id.present?
      if params[:pledge][:amount].present? && params[:pledge][:amount].to_f != @pledge.amount
        return render json: {
          error: "Cannot change pledge amount for active subscriptions. Please cancel this pledge and create a new one with the desired amount.",
          current_amount: @pledge.amount
        }, status: :unprocessable_entity
      end
    end

    # Only allow changing anonymous flag for active pledges, allow both for pending
    allowed_params = if @pledge.status == "active"
                       { anonymous: params[:pledge][:anonymous] }
    else
                       pledge_update_params
    end

    if @pledge.update(allowed_params)
      render json: {
        pledge: serialize_pledge_detail(@pledge),
        message: "Pledge updated successfully"
      }
    else
      render json: { errors: @pledge.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # DELETE /pledges/:id
  # Cancel a pledge (this will trigger Stripe subscription cancellation)
  def destroy
    unless @pledge.client.user_id == current_user.id
      return render json: { error: "Unauthorized" }, status: :forbidden
    end

    if @pledge.status == "cancelled"
      return render json: { error: "Pledge already cancelled" }, status: :unprocessable_entity
    end

    # CRITICAL: Cancel Stripe subscription BEFORE updating database
    if @pledge.stripe_subscription_id.present?
      begin
        Stripe::Subscription.cancel(@pledge.stripe_subscription_id)

        # Track successful cancellation
        StripeErrorMonitor.track_success("subscription_cancellation", context: {
          pledge_id: @pledge.id,
          subscription_id: @pledge.stripe_subscription_id,
          user_id: current_user.id
        })

        Rails.logger.info("Successfully cancelled Stripe subscription: #{@pledge.stripe_subscription_id}")
      rescue Stripe::StripeError => e
        # Track error with monitoring service
        StripeErrorMonitor.track_error(e,
          context: {
            pledge_id: @pledge.id,
            subscription_id: @pledge.stripe_subscription_id,
            user_id: current_user.id,
            action: "cancel_subscription"
          },
          severity: :critical
        )

        return render json: {
          error: "Failed to cancel subscription. Please contact support.",
          type: "stripe_error"
        }, status: :unprocessable_entity
      end
    end

    @pledge.update(
      status: "cancelled",
      cancelled_at: Time.current
    )

    render json: { message: "Pledge cancelled successfully" }
  end

  # POST /pledges/:id/switch_scooper
  # Switch pledge to a different scooper on the same block
  def switch_scooper
    pledge = Pledge.find(params[:id])

    unless pledge.client.user_id == current_user.id
      return render json: { error: "Unauthorized" }, status: :forbidden
    end

    new_coverage_region = CoverageRegion.find(params[:new_coverage_region_id])

    # Verify new coverage region is for the same block
    unless new_coverage_region.block_id == pledge.block_id
      return render json: { error: "Coverage region must be for the same block" }, status: :unprocessable_entity
    end

    # Can't switch if block is already active (locked in)
    if pledge.block.status == "active" && pledge.block.active_scooper_id != new_coverage_region.user_id
      return render json: {
        error: "Cannot switch scoopers once block is active"
      }, status: :unprocessable_entity
    end

    if pledge.switch_to_coverage_region!(new_coverage_region)
      render json: {
        pledge: serialize_pledge_detail(pledge.reload),
        message: "Successfully switched to new scooper"
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
    render json: { error: "Pledge not found" }, status: :not_found
  end

  def require_client
    unless current_user&.client
      render json: { error: "You must have a client profile to create pledges" }, status: :forbidden
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
