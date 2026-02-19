# frozen_string_literal: true

# Expires unclaimed cleanup jobs after 24 hours
class JobExpirationJob < ApplicationJob
  queue_as :default

  def perform(cleanup_job_id)
    cleanup_job = CleanupJob.find_by(id: cleanup_job_id)
    return unless cleanup_job

    # Only expire if still open (not claimed)
    if cleanup_job.status == "open"
      cleanup_job.update!(status: "expired")

      # Notify poster that job expired
      PushNotificationService.notify_job_expired(cleanup_job)

      # TODO: Release Stripe payment hold if exists
    end
  end
end
