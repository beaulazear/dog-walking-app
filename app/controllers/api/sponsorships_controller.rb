module Api
  class SponsorshipsController < ApplicationController
    skip_before_action :authorized, only: [ :index ]
    before_action :set_sponsorship, only: [ :show, :claim, :pause, :resume, :cancel ]

    # GET /sponsorships?status=open
    # Public endpoint - returns open sponsorships for map/dog walkers
    def index
      sponsorships = if params[:status] == "open"
                       Sponsorship.open
      elsif params[:my_sponsorships] && current_user
                       current_user.sponsorships_as_sponsor
      elsif params[:my_claimed] && current_user
                       current_user.sponsorships_as_scooper
      else
                       Sponsorship.all
      end

      render json: sponsorships.map { |s| sponsorship_json(s) }
    end

    # GET /sponsorships/:id
    def show
      render json: sponsorship_json(@sponsorship, detailed: true)
    end

    # POST /sponsorships
    # Create a new block sponsorship
    def create
      unless current_user.is_poster
        render json: { error: "Only posters can create sponsorships" }, status: :forbidden
        return
      end

      sponsorship = current_user.sponsorships_as_sponsor.new(sponsorship_params)

      # Generate block_id from lat/lng
      sponsorship.block_id = generate_block_id(sponsorship.latitude, sponsorship.longitude)

      if sponsorship.save
        # TODO: Send push notifications to dog walkers in neighborhood
        # TODO: Create Stripe subscription

        render json: {
          sponsorship: sponsorship_json(sponsorship, detailed: true)
        }, status: :created
      else
        render json: { errors: sponsorship.errors.full_messages }, status: :unprocessable_entity
      end
    end

    # POST /sponsorships/:id/claim
    # Dog walker claims a sponsorship (first-tap-wins)
    def claim
      unless current_user.is_dog_walker
        render json: { error: "Only dog walkers can claim sponsorships" }, status: :forbidden
        return
      end

      ActiveRecord::Base.transaction do
        # Lock the sponsorship to prevent double-claiming
        @sponsorship = Sponsorship.lock.find(params[:id])

        if @sponsorship.status != "open"
          render json: { error: "Sponsorship already claimed" }, status: :conflict
          return
        end

        @sponsorship.claim!(current_user)

        # TODO: Send notification to sponsor
        # TODO: Broadcast to map via ActionCable

        render json: {
          sponsorship: sponsorship_json(@sponsorship, detailed: true)
        }
      end
    rescue StandardError => e
      render json: { error: e.message }, status: :unprocessable_entity
    end

    # POST /sponsorships/:id/pause
    def pause
      authorize_sponsor!

      @sponsorship.pause!
      render json: { sponsorship: sponsorship_json(@sponsorship) }
    rescue StandardError => e
      render json: { error: e.message }, status: :unprocessable_entity
    end

    # POST /sponsorships/:id/resume
    def resume
      authorize_sponsor!

      @sponsorship.resume!
      render json: { sponsorship: sponsorship_json(@sponsorship) }
    rescue StandardError => e
      render json: { error: e.message }, status: :unprocessable_entity
    end

    # POST /sponsorships/:id/cancel
    def cancel
      authorize_sponsor!

      @sponsorship.cancel!
      # TODO: Cancel Stripe subscription
      render json: { sponsorship: sponsorship_json(@sponsorship) }
    rescue StandardError => e
      render json: { error: e.message }, status: :unprocessable_entity
    end

    private

    def set_sponsorship
      @sponsorship = Sponsorship.find(params[:id])
    end

    def authorize_sponsor!
      unless @sponsorship.sponsor_id == current_user.id
        render json: { error: "Unauthorized" }, status: :forbidden
        raise ActiveRecord::RecordNotFound
      end
    end

    def sponsorship_params
      params.require(:sponsorship).permit(
        :latitude,
        :longitude,
        :schedule,
        :monthly_budget,
        :display_preference,
        :display_name,
        segments_selected: []
      )
    end

    def sponsorship_json(sponsorship, detailed: false)
      base = {
        id: sponsorship.id,
        latitude: sponsorship.latitude,
        longitude: sponsorship.longitude,
        block_id: sponsorship.block_id,
        segments_selected: sponsorship.segments_selected,
        schedule: sponsorship.schedule,
        monthly_budget: sponsorship.monthly_budget,
        sponsor_display: sponsorship.sponsor_display,
        status: sponsorship.status
      }

      if detailed
        base.merge!({
                      scooper: sponsorship.scooper_public_profile,
                      claimed_at: sponsorship.claimed_at,
                      started_at: sponsorship.started_at,
                      clean_since: sponsorship.clean_since,
                      current_monthly_cost: sponsorship.current_monthly_cost,
                      total_pickups: sponsorship.total_pickups,
                      pickups_this_month: sponsorship.pickups_this_month,
                      contributor_count: sponsorship.contributor_count,
                      stripe_subscription_id: sponsorship.stripe_subscription_id,
                      created_at: sponsorship.created_at
                    })
      end

      base
    end

    def generate_block_id(lat, lng)
      # Round to 4 decimal places (~10m precision)
      # Format: "BK-40.6782--73.9442"
      borough = "BK" # For MVP, assume Brooklyn
      lat_rounded = lat.round(4)
      lng_rounded = lng.round(4)
      "#{borough}-#{lat_rounded}-#{lng_rounded}"
    end
  end
end
