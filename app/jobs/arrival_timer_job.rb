# frozen_string_literal: true

# Auto-releases job if scooper doesn't arrive within 60 minutes of claiming
class ArrivalTimerJob < ApplicationJob
  queue_as :critical

  def perform(cleanup_job_id)
    cleanup_job = CleanupJob.find_by(id: cleanup_job_id)
    return unless cleanup_job

    # Only auto-release if still in claimed status (not started yet)
    if cleanup_job.status == "claimed"
      scooper = cleanup_job.scooper

      cleanup_job.update!(
        status: "open",
        scooper_id: nil,
        claimed_at: nil
      )

      # Notify both parties
      PushNotificationService.notify_scooper_auto_released(cleanup_job, scooper)
      PushNotificationService.notify_job_available_again(cleanup_job)

      # TODO: Potentially penalize scooper's reliability score
    end
  end
end
