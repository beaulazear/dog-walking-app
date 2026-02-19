class CleanupJobsController < ApplicationController
  before_action :set_cleanup_job, only: [ :show, :claim, :start, :complete, :confirm, :dispute, :cancel, :upload_before_photo, :upload_after_photo ]

  # GET /cleanup_jobs
  # List jobs - supports comprehensive filtering per MVP spec
  def index
    jobs = CleanupJob.includes(:poster, :scooper)

    # Filter by status (default to open jobs only)
    if params[:status].present?
      jobs = jobs.where(status: params[:status])
    else
      jobs = jobs.open # Default to open jobs only (available to claim)
    end

    # Filter by job_type (poop, litter, both)
    if params[:job_type].present?
      jobs = jobs.by_job_type(params[:job_type])
    end

    # Filter by location if provided (Nearby filter)
    if params[:latitude].present? && params[:longitude].present?
      lat = params[:latitude].to_f
      lng = params[:longitude].to_f
      radius = params[:radius]&.to_f || 0.5 # Default 0.5 miles per MVP
      jobs = jobs.nearby(lat, lng, radius)
    end

    # Just Posted filter (last hour)
    if params[:just_posted] == "true"
      jobs = jobs.just_posted
    end

    # Sorting
    case params[:sort]
    when "highest_pay"
      jobs = jobs.highest_pay
    when "newest"
      jobs = jobs.recent
    else
      jobs = jobs.recent # Default sort by newest
    end

    # Pagination
    page = params[:page]&.to_i || 1
    per_page = params[:per_page]&.to_i || 50
    jobs = jobs.offset((page - 1) * per_page).limit(per_page)

    total_count = jobs.count(:all)

    render json: {
      jobs: jobs.map { |job| job_json(job) },
      pagination: {
        current_page: page,
        per_page: per_page,
        total_count: total_count,
        total_pages: (total_count.to_f / per_page).ceil
      }
    }, status: :ok
  end

  # GET /cleanup_jobs/my_posted
  # Jobs I posted
  def my_posted
    jobs = current_user.cleanup_jobs_as_poster.includes(:scooper).order(created_at: :desc)
    render json: { jobs: jobs.map { |job| job_json(job) } }, status: :ok
  end

  # GET /cleanup_jobs/my_claimed
  # Jobs I claimed
  def my_claimed
    jobs = current_user.cleanup_jobs_as_scooper.includes(:poster).order(created_at: :desc)
    render json: { jobs: jobs.map { |job| job_json(job) } }, status: :ok
  end

  # GET /cleanup_jobs/:id
  # Show job details
  def show
    render json: { job: job_json(@cleanup_job) }, status: :ok
  end

  # POST /cleanup_jobs
  # Create a new job
  def create
    @cleanup_job = current_user.cleanup_jobs_as_poster.build(cleanup_job_params)

    # Set job expiration (24 hours from now if unclaimed)
    @cleanup_job.job_expires_at = 24.hours.from_now

    if @cleanup_job.save
      # Enqueue job expiration timer (24 hours)
      JobExpirationJob.set(wait: 24.hours).perform_later(@cleanup_job.id)

      # Broadcast to job board
      broadcast_job_update(@cleanup_job, "job_created")

      render json: { job: job_json(@cleanup_job) }, status: :created
    else
      render json: { error: @cleanup_job.errors.full_messages.join(", ") }, status: :unprocessable_entity
    end
  end

  # POST /cleanup_jobs/:id/upload_before_photo
  # Upload before photo for a job
  def upload_before_photo
    unless @cleanup_job.poster_id == current_user.id
      return render json: { error: "Only the poster can upload before photos" }, status: :forbidden
    end

    if params[:before_photo].present?
      @cleanup_job.before_photos.attach(params[:before_photo])
      render json: { job: job_json(@cleanup_job) }, status: :ok
    else
      render json: { error: "No photo provided" }, status: :unprocessable_entity
    end
  end

  # POST /cleanup_jobs/:id/claim
  # Scooper claims a job
  def claim
    unless @cleanup_job.claimable?
      return render json: { error: "Job cannot be claimed" }, status: :unprocessable_entity
    end

    @cleanup_job.update!(
      scooper: current_user,
      status: "claimed",
      claimed_at: Time.current
    )

    # Enqueue arrival timer (60 minutes - scooper must arrive or job auto-releases)
    ArrivalTimerJob.set(wait: 1.hour).perform_later(@cleanup_job.id)

    # Notify poster that job was claimed
    PushNotificationService.notify_job_claimed(@cleanup_job)

    # Broadcast status change
    broadcast_job_update(@cleanup_job, "job_claimed")

    render json: { job: job_json(@cleanup_job) }, status: :ok
  end

  # POST /cleanup_jobs/:id/start
  # Scooper marks job as in progress (arrived at location)
  def start
    unless @cleanup_job.scooper_id == current_user.id
      return render json: { error: "Only the assigned scooper can start this job" }, status: :forbidden
    end

    unless @cleanup_job.startable?
      return render json: { error: "Job cannot be started" }, status: :unprocessable_entity
    end

    @cleanup_job.update!(
      status: "in_progress",
      scooper_arrived_at: Time.current
    )

    # Notify poster that scooper has arrived
    PushNotificationService.notify_job_started(@cleanup_job)

    # Broadcast status change
    broadcast_job_update(@cleanup_job, "job_started")

    render json: { job: job_json(@cleanup_job) }, status: :ok
  end

  # POST /cleanup_jobs/:id/complete
  # Scooper submits completion
  def complete
    unless @cleanup_job.scooper_id == current_user.id
      return render json: { error: "Only the assigned scooper can complete this job" }, status: :forbidden
    end

    unless @cleanup_job.completable?
      return render json: { error: "Job cannot be completed" }, status: :unprocessable_entity
    end

    @cleanup_job.update!(
      status: "completed",
      completed_at: Time.current,
      pickup_count: params[:pickup_count]&.to_i,
      expires_at: 2.hours.from_now  # Auto-confirm in 2 hours if poster doesn't respond
    )

    # Enqueue confirmation timeout (2 hours - auto-confirm if poster doesn't respond)
    ConfirmationTimeoutJob.set(wait: 2.hours).perform_later(@cleanup_job.id)

    # Notify poster that job is completed and needs confirmation
    PushNotificationService.notify_job_completed(@cleanup_job)

    # Broadcast status change
    broadcast_job_update(@cleanup_job, "job_completed")

    render json: { job: job_json(@cleanup_job) }, status: :ok
  end

  # POST /cleanup_jobs/:id/upload_after_photo
  # Upload after photo for completed job
  def upload_after_photo
    unless @cleanup_job.scooper_id == current_user.id
      return render json: { error: "Only the scooper can upload after photos" }, status: :forbidden
    end

    if params[:after_photo].present?
      @cleanup_job.after_photos.attach(params[:after_photo])
      render json: { job: job_json(@cleanup_job) }, status: :ok
    else
      render json: { error: "No photo provided" }, status: :unprocessable_entity
    end
  end

  # POST /cleanup_jobs/:id/confirm
  # Poster confirms job completion
  def confirm
    unless @cleanup_job.poster_id == current_user.id
      return render json: { error: "Only the poster can confirm this job" }, status: :forbidden
    end

    unless @cleanup_job.confirmable?
      return render json: { error: "Job cannot be confirmed" }, status: :unprocessable_entity
    end

    @cleanup_job.update!(
      status: "confirmed",
      confirmed_at: Time.current
    )

    # Notify scooper that job was confirmed
    PushNotificationService.notify_job_confirmed(@cleanup_job)

    # Broadcast status change
    broadcast_job_update(@cleanup_job, "job_confirmed")

    # TODO: Process payment to scooper via Stripe

    render json: { job: job_json(@cleanup_job) }, status: :ok
  end

  # POST /cleanup_jobs/:id/dispute
  # Poster reports an issue with completed job
  def dispute
    unless @cleanup_job.poster_id == current_user.id
      return render json: { error: "Only the poster can dispute this job" }, status: :forbidden
    end

    @cleanup_job.update!(
      status: "disputed",
      disputed_at: Time.current,
      dispute_reason: params[:dispute_reason],
      dispute_notes: params[:dispute_notes]
    )

    # Notify scooper that job was disputed
    PushNotificationService.notify_job_disputed(@cleanup_job)

    # Broadcast status change
    broadcast_job_update(@cleanup_job, "job_disputed")

    # TODO: Notify admin for manual review

    render json: { job: job_json(@cleanup_job) }, status: :ok
  end

  # POST /cleanup_jobs/:id/cancel
  # Cancel a job
  def cancel
    # Only poster can cancel unclaimed jobs, scooper can cancel claimed jobs
    can_cancel = (@cleanup_job.poster_id == current_user.id && @cleanup_job.status == "open") ||
                 (@cleanup_job.scooper_id == current_user.id && @cleanup_job.status == "claimed")

    unless can_cancel
      return render json: { error: "You cannot cancel this job" }, status: :forbidden
    end

    # Calculate cancellation fee (20% if poster cancels after scooper claimed)
    cancellation_fee = @cleanup_job.calculate_cancellation_fee(current_user)

    @cleanup_job.update!(
      status: "cancelled",
      cancelled_by_id: current_user.id,
      cancelled_at: Time.current,
      cancellation_fee_amount: cancellation_fee,
      cancellation_reason: params[:cancellation_reason],
      scooper_id: nil  # Release scooper if they cancelled
    )

    # Broadcast status change (job may be available again if scooper cancelled)
    broadcast_job_update(@cleanup_job, "job_cancelled")

    # TODO: Charge cancellation fee via Stripe if amount > 0
    # TODO: Release Stripe payment hold if exists

    render json: {
      job: job_json(@cleanup_job),
      cancellation_fee: cancellation_fee,
      message: cancellation_fee > 0 ? "Job cancelled. A #{(cancellation_fee / @cleanup_job.price * 100).to_i}% cancellation fee of $#{cancellation_fee} will be charged." : "Job cancelled successfully."
    }, status: :ok
  end

  private

  def set_cleanup_job
    @cleanup_job = CleanupJob.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    render json: { error: "Job not found" }, status: :not_found
  end

  def cleanup_job_params
    params.permit(
      :latitude,
      :longitude,
      :address,
      :price,
      :note,
      :stripe_payment_intent_id,
      :job_type,
      :poop_itemization,
      :litter_itemization,
      segments_selected: []
    )
  end

  def job_json(job)
    {
      id: job.id,
      poster_id: job.poster_id,
      poster_name: job.poster&.name,
      scooper_id: job.scooper_id,
      scooper_name: job.scooper&.name,
      latitude: job.latitude,
      longitude: job.longitude,
      address: job.address,
      price: job.price,
      note: job.note,
      status: job.status,
      pickup_count: job.pickup_count,
      # Job type and itemization (MVP)
      job_type: job.job_type,
      poop_itemization: job.poop_itemization,
      litter_itemization: job.litter_itemization,
      segments_selected: job.segments_selected || [],
      # Cancellation
      cancelled_by_id: job.cancelled_by_id,
      cancelled_at: job.cancelled_at,
      cancellation_fee_amount: job.cancellation_fee_amount,
      cancellation_reason: job.cancellation_reason,
      # Timestamps
      claimed_at: job.claimed_at,
      completed_at: job.completed_at,
      confirmed_at: job.confirmed_at,
      created_at: job.created_at,
      updated_at: job.updated_at,
      # Photos
      before_photos: job.before_photos.attached? ? job.before_photos.map { |photo| rails_blob_url(photo) } : [],
      after_photos: job.after_photos.attached? ? job.after_photos.map { |photo| rails_blob_url(photo) } : []
    }
  end

  # Broadcast job updates via Action Cable
  def broadcast_job_update(job, event_type)
    # Broadcast to specific job channel (for poster and scooper)
    ActionCable.server.broadcast(
      "cleanup_job_#{job.id}",
      {
        type: event_type,
        job: job_json(job),
        timestamp: Time.current
      }
    )

    # Broadcast to job board if it's a new or available job
    if event_type.in?([ "job_created", "job_available" ])
      ActionCable.server.broadcast(
        "job_board_updates",
        {
          type: event_type,
          job: job_json(job),
          timestamp: Time.current
        }
      )
    end
  end
end
