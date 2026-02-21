module Api
  class ContributionsController < ApplicationController
    before_action :set_sponsorship

    # POST /sponsorships/:sponsorship_id/contributions
    # Create a contribution (neighbor support)
    def create
      contribution = @sponsorship.contributions.new(contribution_params)
      contribution.contributor = current_user

      if contribution.save
        # TODO: Create Stripe subscription for contributor
        # TODO: Update sponsor's Stripe subscription amount
        # TODO: Send notification to sponsor

        render json: {
          contribution: contribution_json(contribution),
          sponsorship: {
            current_monthly_cost: @sponsorship.current_monthly_cost,
            contributor_count: @sponsorship.contributor_count
          }
        }, status: :created
      else
        render json: { errors: contribution.errors.full_messages }, status: :unprocessable_entity
      end
    end

    # DELETE /sponsorships/:sponsorship_id/contributions/:id
    # Cancel a contribution
    def destroy
      contribution = @sponsorship.contributions.find(params[:id])

      unless contribution.contributor_id == current_user.id
        render json: { error: "Unauthorized" }, status: :forbidden
        return
      end

      contribution.cancel!
      # TODO: Cancel Stripe subscription

      render json: {
        message: "Contribution cancelled",
        sponsorship: {
          current_monthly_cost: @sponsorship.current_monthly_cost,
          contributor_count: @sponsorship.contributor_count
        }
      }
    end

    # GET /sponsorships/:sponsorship_id/contributions
    # List all active contributions for a sponsorship
    def index
      contributions = @sponsorship.contributions.active
      render json: contributions.map { |c| contribution_json(c) }
    end

    private

    def set_sponsorship
      @sponsorship = Sponsorship.find(params[:sponsorship_id])
    end

    def contribution_params
      params.require(:contribution).permit(:monthly_amount)
    end

    def contribution_json(contribution)
      {
        id: contribution.id,
        sponsorship_id: contribution.sponsorship_id,
        contributor_id: contribution.contributor_id,
        monthly_amount: contribution.monthly_amount,
        status: contribution.status,
        created_at: contribution.created_at
      }
    end
  end
end
