module Api
  class SweepsController < ApplicationController
    before_action :set_sponsorship

    # POST /sponsorships/:sponsorship_id/sweeps
    # Log a maintenance sweep
    def create
      unless @sponsorship.scooper_id == current_user.id
        render json: { error: "Unauthorized - must be assigned scooper" }, status: :forbidden
        return
      end

      sweep = @sponsorship.sweeps.new(
        scooper: current_user,
        pickup_count: sweep_params[:pickup_count],
        notes: sweep_params[:notes],
        litter_flagged: sweep_params[:litter_flagged],
        arrival_latitude: sweep_params[:arrival_latitude],
        arrival_longitude: sweep_params[:arrival_longitude]
      )

      # Attach after photo if provided
      if params[:after_photo].present?
        sweep.after_photo.attach(params[:after_photo])
      end

      # Complete the sweep
      sweep.complete!(sweep_params)

      # Calculate next sweep date
      next_sweep_date = calculate_next_sweep_date(@sponsorship)
      @sponsorship.update(next_sweep_date:)

      # TODO: Send notification to sponsor
      # TODO: Process payout via Stripe
      # TODO: Broadcast to map via ActionCable

      render json: {
        sweep: sweep_json(sweep),
        sponsorship: {
          pickups_this_month: @sponsorship.pickups_this_month,
          pickups_all_time: @sponsorship.total_pickups,
          next_sweep: next_sweep_date
        }
      }, status: :created
    rescue StandardError => e
      render json: { error: e.message, details: sweep.errors.full_messages }, status: :unprocessable_entity
    end

    # GET /sponsorships/:sponsorship_id/sweeps
    # List all sweeps for a sponsorship
    def index
      sweeps = @sponsorship.sweeps.order(completed_at: :desc)
      render json: sweeps.map { |s| sweep_json(s) }
    end

    private

    def set_sponsorship
      @sponsorship = Sponsorship.find(params[:sponsorship_id])
    end

    def sweep_params
      params.require(:sweep).permit(
        :pickup_count,
        :notes,
        :litter_flagged,
        :arrival_latitude,
        :arrival_longitude,
        :after_photo
      )
    end

    def sweep_json(sweep)
      {
        id: sweep.id,
        sponsorship_id: sweep.sponsorship_id,
        scooper_id: sweep.scooper_id,
        status: sweep.status,
        pickup_count: sweep.pickup_count,
        payout_amount: sweep.payout_amount,
        after_photo_url: sweep.after_photo_url,
        notes: sweep.notes,
        litter_flagged: sweep.litter_flagged,
        completed_at: sweep.completed_at,
        created_at: sweep.created_at
      }
    end

    def calculate_next_sweep_date(sponsorship)
      if sponsorship.schedule == "weekly"
        7.days.from_now.to_date
      else # biweekly
        14.days.from_now.to_date
      end
    end
  end
end
