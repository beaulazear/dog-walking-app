class CleanupJobChannel < ApplicationCable::Channel
  def subscribed
    job = CleanupJob.find_by(id: params[:job_id])

    if job && (job.poster_id == current_user.id || job.scooper_id == current_user.id)
      stream_from "cleanup_job_#{params[:job_id]}"
    else
      reject
    end
  end

  def unsubscribed
    stop_all_streams
  end

  # Scooper can send location updates
  def update_location(data)
    job = CleanupJob.find_by(id: params[:job_id])

    if job && job.scooper_id == current_user.id && job.status.in?([ "claimed", "in_progress" ])
      ActionCable.server.broadcast(
        "cleanup_job_#{params[:job_id]}",
        {
          type: "location_update",
          latitude: data["latitude"],
          longitude: data["longitude"],
          timestamp: Time.current
        }
      )
    end
  end
end
