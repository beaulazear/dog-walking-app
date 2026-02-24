class NeighborhoodsController < ApplicationController
  skip_before_action :authorized, only: [ :stats ]

  def stats
    neighborhood = params[:neighborhood]

    # Get blocks sponsored (Phase 3 feature - gracefully handle for now)
    blocks_sponsored = begin
      if defined?(Sponsorship) && Sponsorship.column_names.include?("neighborhood")
        Sponsorship.where(neighborhood: neighborhood, status: "active").count
      else
        # For Phase 1A, return 0 since sponsorships aren't implemented yet
        0
      end
    rescue StandardError => e
      Rails.logger.warn("Sponsorship stats unavailable: #{e.message}")
      0
    end

    # Get active sightings
    active_sightings = Sighting.where(neighborhood: neighborhood, status: "active").count

    # Get jobs posted this week
    jobs_posted_this_week = begin
      CleanupJob.where(neighborhood: neighborhood)
                .where("created_at >= ?", 1.week.ago)
                .count
    rescue StandardError
      0
    end

    # Get total pickups this month
    total_pickups_this_month = begin
      CleanupJob.where(neighborhood: neighborhood, status: "confirmed")
                .where("confirmed_at >= ?", 1.month.ago)
                .sum(:pickup_count) || 0
    rescue StandardError
      0
    end

    render json: {
      neighborhood: neighborhood,
      blocks_sponsored: blocks_sponsored,
      active_sightings: active_sightings,
      jobs_posted_this_week: jobs_posted_this_week,
      total_pickups_this_month: total_pickups_this_month
    }, status: :ok
  end
end
