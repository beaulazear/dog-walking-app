class SightingExpirationJob < ApplicationJob
  queue_as :default

  def perform
    # Find all active sightings that have passed their expiration time
    expired_count = Sighting.active
                            .where("expires_at <= ?", Time.current)
                            .update_all(status: "expired")

    Rails.logger.info "⏰ Expired #{expired_count} sightings at #{Time.current}"

    # Return count for testing purposes
    expired_count
  end
end
