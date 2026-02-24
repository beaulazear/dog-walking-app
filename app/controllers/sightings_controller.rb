class SightingsController < ApplicationController
  # Public endpoints (no auth required)
  skip_before_action :authorized, only: [ :index, :show, :create, :upload_photo ]

  # Authenticated endpoints
  before_action :authorized, only: [ :confirm, :convert ]
  before_action :set_sighting, only: [ :show, :confirm, :convert, :upload_photo ]

  # GET /sightings
  def index
    sightings = Sighting.includes(:reporter).active

    # Filter by neighborhood
    if params[:neighborhood].present?
      sightings = sightings.by_neighborhood(params[:neighborhood])
    end

    # Filter by location
    if params[:latitude].present? && params[:longitude].present?
      lat = params[:latitude].to_f
      lng = params[:longitude].to_f
      radius = params[:radius]&.to_f || 0.5
      sightings = sightings.nearby(lat, lng, radius)
    end

    # Pagination
    page = params[:page]&.to_i || 1
    per_page = params[:per_page]&.to_i || 50
    sightings = sightings.offset((page - 1) * per_page).limit(per_page)

    total_count = Sighting.active.count

    render json: {
      sightings: sightings.map { |s| sighting_json(s) },
      pagination: {
        current_page: page,
        per_page: per_page,
        total_count: total_count,
        total_pages: (total_count.to_f / per_page).ceil
      }
    }, status: :ok
  end

  # GET /sightings/:id
  def show
    render json: { sighting: sighting_json(@sighting) }, status: :ok
  end

  # POST /sightings
  def create
    @sighting = Sighting.new(sighting_params)

    if @sighting.save
      render json: { sighting: sighting_json(@sighting) }, status: :created
    else
      render json: { error: @sighting.errors.full_messages.join(", ") }, status: :unprocessable_entity
    end
  end

  # POST /sightings/:id/confirm
  def confirm
    if @sighting.add_confirmation!(current_user.id)
      render json: {
        sighting: sighting_json(@sighting),
        message: "Confirmation added"
      }, status: :ok
    else
      render json: { error: "You already confirmed this sighting" }, status: :unprocessable_entity
    end
  end

  # POST /sightings/:id/convert (Phase 1B - placeholder for now)
  def convert
    render json: {
      error: "Job conversion coming in Phase 1B"
    }, status: :not_implemented
  end

  # POST /sightings/:id/upload_photo
  def upload_photo
    if params[:photo].blank?
      return render json: { error: "No photo provided" }, status: :unprocessable_entity
    end

    begin
      # Process and strip EXIF data using ImageProcessing
      processed_photo = process_and_strip_exif(params[:photo])

      # Attach the processed photo
      @sighting.photos.attach(
        io: processed_photo[:io],
        filename: processed_photo[:filename],
        content_type: processed_photo[:content_type]
      )

      render json: {
        sighting: sighting_json(@sighting),
        message: "Photo uploaded successfully"
      }, status: :ok
    rescue StandardError => e
      Rails.logger.error("Photo upload failed: #{e.message}")
      render json: { error: "Photo upload failed: #{e.message}" }, status: :unprocessable_entity
    end
  end

  private

  # Process photo and strip EXIF data
  def process_and_strip_exif(photo)
    require "mini_magick"

    # Read the uploaded file
    temp_file = photo.tempfile

    # Use MiniMagick to strip EXIF data
    image = MiniMagick::Image.new(temp_file.path)
    image.auto_orient  # Rotate based on EXIF orientation before stripping
    image.strip        # Remove all EXIF data

    # Create new temp file for processed image
    processed_path = "#{temp_file.path}_processed.jpg"
    image.write(processed_path)

    {
      io: File.open(processed_path),
      filename: "sighting_#{Time.current.to_i}.jpg",
      content_type: "image/jpeg"
    }
  end

  def set_sighting
    @sighting = Sighting.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    render json: { error: "Sighting not found" }, status: :not_found
  end

  def sighting_params
    params.permit(
      :latitude,
      :longitude,
      :address,
      :neighborhood,
      :tag_type,
      :business_name,
      :reporter_id,
      :reporter_name,
      :comment
    )
  end

  def sighting_json(sighting)
    {
      id: sighting.id,
      latitude: sighting.latitude,
      longitude: sighting.longitude,
      address: sighting.address,
      neighborhood: sighting.neighborhood,
      tag_type: sighting.tag_type,
      business_name: sighting.business_name,
      reporter_name: sighting.reporter_name,
      comment: sighting.comment,
      confirmation_count: sighting.confirmation_count,
      confirmed_by_ids: sighting.confirmed_by_ids,
      expires_at: sighting.expires_at,
      status: sighting.status,
      converted_job_id: sighting.converted_job_id,
      photos: sighting.photos.attached? ? sighting.photos.map { |photo| rails_blob_url(photo) } : [],
      created_at: sighting.created_at,
      updated_at: sighting.updated_at
    }
  end
end
