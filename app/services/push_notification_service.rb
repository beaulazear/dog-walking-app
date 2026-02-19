# frozen_string_literal: true

# Stub implementation for push notifications
# TODO: Integrate with Firebase Cloud Messaging (FCM) for Android
# TODO: Integrate with Apple Push Notification service (APNs) for iOS
class PushNotificationService
  # Send notification to a single user
  def self.send_to_user(user, title:, body:, data: {})
    return unless user&.device_token.present?

    # Log for now - will implement FCM/APNs later
    Rails.logger.info "📲 [NOTIFICATION] To: #{user.name} (#{user.device_platform})"
    Rails.logger.info "   Title: #{title}"
    Rails.logger.info "   Body: #{body}"
    Rails.logger.info "   Data: #{data.inspect}"

    # TODO: Implement actual push notification sending
    # if user.device_platform == "ios"
    #   send_apns(user.device_token, title, body, data)
    # elsif user.device_platform == "android"
    #   send_fcm(user.device_token, title, body, data)
    # end

    true
  end

  # Job-related notifications
  def self.notify_job_expired(cleanup_job)
    send_to_user(
      cleanup_job.poster,
      title: "Job Expired",
      body: "Your cleanup job at #{cleanup_job.address} has expired without being claimed.",
      data: { type: "job_expired", job_id: cleanup_job.id }
    )
  end

  def self.notify_scooper_auto_released(cleanup_job, scooper)
    send_to_user(
      scooper,
      title: "Job Auto-Released",
      body: "You were automatically released from the job at #{cleanup_job.address} due to not arriving within 60 minutes.",
      data: { type: "auto_released", job_id: cleanup_job.id }
    )
  end

  def self.notify_job_available_again(cleanup_job)
    send_to_user(
      cleanup_job.poster,
      title: "Job Available Again",
      body: "Your job at #{cleanup_job.address} is now available for claiming again.",
      data: { type: "job_available", job_id: cleanup_job.id }
    )
  end

  def self.notify_job_auto_confirmed(cleanup_job)
    # Notify scooper
    send_to_user(
      cleanup_job.scooper,
      title: "Job Confirmed",
      body: "Your completed job at #{cleanup_job.address} was automatically confirmed. Payment is being processed.",
      data: { type: "job_confirmed", job_id: cleanup_job.id }
    )

    # Notify poster
    send_to_user(
      cleanup_job.poster,
      title: "Job Auto-Confirmed",
      body: "Your job at #{cleanup_job.address} was automatically confirmed after 2 hours.",
      data: { type: "job_auto_confirmed", job_id: cleanup_job.id }
    )
  end

  def self.notify_job_claimed(cleanup_job)
    send_to_user(
      cleanup_job.poster,
      title: "Job Claimed",
      body: "#{cleanup_job.scooper.name} has claimed your cleanup job at #{cleanup_job.address}!",
      data: { type: "job_claimed", job_id: cleanup_job.id }
    )
  end

  def self.notify_job_started(cleanup_job)
    send_to_user(
      cleanup_job.poster,
      title: "Scooper Arrived",
      body: "#{cleanup_job.scooper.name} has arrived at #{cleanup_job.address}.",
      data: { type: "job_started", job_id: cleanup_job.id }
    )
  end

  def self.notify_job_completed(cleanup_job)
    send_to_user(
      cleanup_job.poster,
      title: "Job Completed",
      body: "#{cleanup_job.scooper.name} has completed the cleanup at #{cleanup_job.address}. Please review and confirm.",
      data: { type: "job_completed", job_id: cleanup_job.id }
    )
  end

  def self.notify_job_confirmed(cleanup_job)
    send_to_user(
      cleanup_job.scooper,
      title: "Job Confirmed",
      body: "#{cleanup_job.poster.name} has confirmed your work at #{cleanup_job.address}. Payment is being processed.",
      data: { type: "job_confirmed", job_id: cleanup_job.id }
    )
  end

  def self.notify_job_disputed(cleanup_job)
    send_to_user(
      cleanup_job.scooper,
      title: "Job Disputed",
      body: "#{cleanup_job.poster.name} has reported an issue with the cleanup at #{cleanup_job.address}. Support will review.",
      data: { type: "job_disputed", job_id: cleanup_job.id }
    )
  end
end
