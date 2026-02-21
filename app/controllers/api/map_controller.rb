module Api
  class MapController < ApplicationController
    skip_before_action :authenticate_user, only: [ :stats, :block_detail, :neighborhoods ]

    # GET /map/stats?lat=40.6782&lng=-73.9442
    # Returns neighborhood stats for the map ticker
    def stats
      lat = params[:lat].to_f
      lng = params[:lng].to_f

      neighborhood = determine_neighborhood(lat, lng)

      stats = {
        sponsored_blocks: Sponsorship.active.where(
          "latitude BETWEEN ? AND ? AND longitude BETWEEN ? AND ?",
          lat - 0.01, lat + 0.01, lng - 0.01, lng + 0.01
        ).count,
        pickups_this_month: Sponsorship.active.where(
          "latitude BETWEEN ? AND ? AND longitude BETWEEN ? AND ?",
          lat - 0.01, lat + 0.01, lng - 0.01, lng + 0.01
        ).sum(:pickups_this_month),
        open_jobs: CleanupJob.where(status: "open").where(
          "latitude BETWEEN ? AND ? AND longitude BETWEEN ? AND ?",
          lat - 0.01, lat + 0.01, lng - 0.01, lng + 0.01
        ).count
      }

      render json: {
        neighborhood:,
        stats:
      }
    end

    # GET /map/blocks/:block_id
    # Returns detailed information about a specific block
    def block_detail
      block_id = params[:block_id]

      sponsorship = Sponsorship.active.find_by(block_id:)

      if sponsorship
        render json: {
          block_id:,
          sponsored: true,
          sponsorship: {
            id: sponsorship.id,
            sponsor_display: sponsorship.sponsor_display,
            scooper: sponsorship.scooper_public_profile,
            schedule: sponsorship.schedule,
            next_sweep: sponsorship.next_sweep_date,
            clean_since: sponsorship.clean_since,
            pickups_this_month: sponsorship.pickups_this_month,
            pickups_all_time: sponsorship.total_pickups,
            contributor_count: sponsorship.contributor_count
          },
          recent_jobs: recent_jobs_for_block(block_id)
        }
      else
        render json: {
          block_id:,
          sponsored: false,
          sponsorship: nil,
          recent_jobs: recent_jobs_for_block(block_id)
        }
      end
    end

    # GET /map/neighborhoods
    # Returns list of all neighborhoods
    def neighborhoods
      # For MVP, return Brooklyn neighborhoods
      # In production, this could query a neighborhoods table or use PostGIS
      neighborhoods = [
        "Park Slope",
        "Prospect Heights",
        "Windsor Terrace",
        "Carroll Gardens",
        "Cobble Hill",
        "Brooklyn Heights",
        "DUMBO",
        "Williamsburg",
        "Greenpoint"
      ]

      render json: { neighborhoods: }
    end

    private

    def determine_neighborhood(lat, lng)
      # Simple neighborhood detection based on lat/lng ranges
      # In production, use reverse geocoding or PostGIS neighborhood polygons

      # Park Slope approximate bounds
      if lat.between?(40.660, 40.680) && lng.between?(-73.990, -73.970)
        "Park Slope"
      # Prospect Heights
      elsif lat.between?(40.670, 40.685) && lng.between?(-73.975, -73.955)
        "Prospect Heights"
      # Default
      else
        "Brooklyn"
      end
    end

    def recent_jobs_for_block(block_id)
      CleanupJob.where(block_identifier: block_id)
                .where(status: "completed")
                .where("completed_at >= ?", 7.days.ago)
                .order(completed_at: :desc)
                .limit(10)
                .map do |job|
        {
          id: job.id,
          completed_at: job.completed_at,
          pickup_count: job.pickup_count,
          job_type: job.job_type
        }
      end
    end
  end
end
