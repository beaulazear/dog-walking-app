# frozen_string_literal: true

# Auto-confirms completed jobs if poster doesn't respond within 2 hours
class ConfirmationTimeoutJob < ApplicationJob
  queue_as :default

  def perform(cleanup_job_id)
    cleanup_job = CleanupJob.find_by(id: cleanup_job_id)
    return unless cleanup_job

    # Only auto-confirm if still in completed status (waiting for poster confirmation)
    if cleanup_job.status == "completed"
      cleanup_job.update!(
        status: "confirmed",
        confirmed_at: Time.current
      )

      # Notify both parties about auto-confirmation
      PushNotificationService.notify_job_auto_confirmed(cleanup_job)

      # TODO: Process payment to scooper via Stripe
    end
  end
end
