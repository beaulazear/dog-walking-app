class JobBoardChannel < ApplicationCable::Channel
  def subscribed
    # Subscribe to job board updates for user's area
    # In the future, could be filtered by location
    stream_from "job_board_updates"
  end

  def unsubscribed
    stop_all_streams
  end
end
