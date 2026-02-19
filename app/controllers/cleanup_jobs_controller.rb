class CleanupJobsController < ApplicationController
  before_action :authenticate_user!
  before_action :set_cleanup_job, only: [ :show, :claim, :start, :complete, :confirm, :dispute, :cancel, :upload_before_photo, :upload_after_photo ]

  # GET /cleanup_jobs
  # List jobs - optionally filtered by status
  def index
    jobs = CleanupJob.includes(:poster, :scooper)

    # Filter by status
    if params[:status].present?
      jobs = jobs.where(status: params[:status])
    end

    # Filter by location if provided
    if params[:latitude].present? && params[:longitude].present?
      lat = params[:latitude].to_f
      lng = params[:longitude].to_f
      radius = params[:radius]&.to_f || 5.0
      jobs = jobs.nearby(lat, lng, radius)
    end

    # Order by created_at descending (newest first)
    jobs = jobs.order(created_at: :desc)

    render json: { jobs: jobs.map { |job| job_json(job) } }, status: :ok
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

    @cleanup_job.update!(
      status: "cancelled",
      scooper_id: nil  # Release scooper if they cancelled
    )

    # TODO: Release Stripe payment hold if exists

    render json: { job: job_json(@cleanup_job) }, status: :ok
  end

  private

  def set_cleanup_job
    @cleanup_job = CleanupJob.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    render json: { error: "Job not found" }, status: :not_found
  end

  def cleanup_job_params
    params.permit(:latitude, :longitude, :address, :price, :note, :stripe_payment_intent_id)
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
      claimed_at: job.claimed_at,
      completed_at: job.completed_at,
      confirmed_at: job.confirmed_at,
      created_at: job.created_at,
      before_photos: job.before_photos.attached? ? job.before_photos.map { |photo| rails_blob_url(photo) } : [],
      after_photos: job.after_photos.attached? ? job.after_photos.map { |photo| rails_blob_url(photo) } : []
    }
  end
end
