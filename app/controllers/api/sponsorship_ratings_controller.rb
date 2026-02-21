module Api
  class SponsorshipRatingsController < ApplicationController
    before_action :set_sponsorship

    # POST /sponsorships/:sponsorship_id/ratings
    # Create a monthly rating
    def create
      unless @sponsorship.sponsor_id == current_user.id
        render json: { error: "Only sponsor can rate" }, status: :forbidden
        return
      end

      rating = @sponsorship.sponsorship_ratings.new(rating_params)
      rating.sponsor = current_user
      rating.scooper = @sponsorship.scooper

      if rating.save
        render json: {
          rating: rating_json(rating),
          scooper: {
            overall_rating: @sponsorship.scooper.overall_rating
          }
        }, status: :created
      else
        render json: { errors: rating.errors.full_messages }, status: :unprocessable_entity
      end
    end

    # GET /sponsorships/:sponsorship_id/ratings
    # List all ratings for a sponsorship
    def index
      ratings = @sponsorship.sponsorship_ratings.order(month: :desc)
      render json: ratings.map { |r| rating_json(r) }
    end

    private

    def set_sponsorship
      @sponsorship = Sponsorship.find(params[:sponsorship_id])
    end

    def rating_params
      params.require(:rating).permit(
        :month,
        :quality_rating,
        :thoroughness_rating,
        :timeliness_rating,
        :communication_rating,
        :review_text
      )
    end

    def rating_json(rating)
      {
        id: rating.id,
        sponsorship_id: rating.sponsorship_id,
        sponsor_id: rating.sponsor_id,
        scooper_id: rating.scooper_id,
        month: rating.month,
        quality_rating: rating.quality_rating,
        thoroughness_rating: rating.thoroughness_rating,
        timeliness_rating: rating.timeliness_rating,
        communication_rating: rating.communication_rating,
        overall_rating: rating.overall_rating,
        review_text: rating.review_text,
        created_at: rating.created_at
      }
    end
  end
end
