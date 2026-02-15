class PoopReportsController < ApplicationController
  before_action :set_poop_report, only: [ :show, :update, :destroy ]
  before_action :require_client, only: [ :create ]

  # GET /poop_reports
  # Returns poop reports - optionally filtered by block, status, or reporter
  def index
    poop_reports = PoopReport.all

    # Filter by block
    poop_reports = poop_reports.where(block_id: params[:block_id]) if params[:block_id].present?

    # Filter by status
    poop_reports = poop_reports.where(status: params[:status]) if params[:status].present?

    # Filter by client
    poop_reports = poop_reports.where(client_id: params[:client_id]) if params[:client_id].present?

    # Order by most recent first
    poop_reports = poop_reports.order(reported_at: :desc)

    # Pagination
    page = params[:page] || 1
    per_page = params[:per_page] || 50

    poop_reports = poop_reports.page(page).per(per_page)

    render json: {
      poop_reports: poop_reports.map { |report| serialize_poop_report(report) },
      meta: {
        current_page: poop_reports.current_page,
        total_pages: poop_reports.total_pages,
        total_count: poop_reports.total_count
      }
    }
  end

  # GET /poop_reports/:id
  def show
    render json: {
      poop_report: serialize_poop_report_detail(@poop_report)
    }
  end

  # GET /poop_reports/nearby
  # Find poop reports near a specific location
  def nearby
    latitude = params[:latitude]&.to_f
    longitude = params[:longitude]&.to_f
    radius = params[:radius]&.to_i || 500 # Default 500m radius

    unless latitude && longitude
      return render json: { error: "Latitude and longitude required" }, status: :bad_request
    end

    # In production with PostGIS, use spatial query
    # In development, use simple lat/lng distance approximation
    if Rails.env.production?
      point = "POINT(#{longitude} #{latitude})"
      poop_reports = PoopReport.where(
        "ST_DWithin(location, ST_GeographyFromText('SRID=4326;#{point}'), ?)",
        radius
      )
    else
      # Simple bounding box approximation for development
      lat_offset = radius / 111320.0 # meters to degrees latitude
      lng_offset = radius / (111320.0 * Math.cos(latitude * Math::PI / 180))

      poop_reports = PoopReport.where(
        latitude: (latitude - lat_offset)..(latitude + lat_offset),
        longitude: (longitude - lng_offset)..(longitude + lng_offset)
      )
    end

    # Filter to open reports only by default
    status = params[:status] || "open"
    poop_reports = poop_reports.where(status: status) if status.present?

    render json: {
      poop_reports: poop_reports.map { |report| serialize_poop_report(report) },
      meta: {
        latitude: latitude,
        longitude: longitude,
        radius_meters: radius,
        count: poop_reports.count
      }
    }
  end

  # POST /poop_reports
  # Create a new poop report
  def create
    client = current_user.client
    unless client
      return render json: { error: "Client profile not found" }, status: :unprocessable_entity
    end

    # Find nearest block
    latitude = params[:poop_report][:latitude].to_f
    longitude = params[:poop_report][:longitude].to_f

    block = Block.nearby(latitude, longitude, 100).first # Find block within 100m

    unless block
      return render json: {
        error: "No block found at this location. Please report closer to a block boundary."
      }, status: :unprocessable_entity
    end

    poop_report = PoopReport.new(
      client: client,
      block: block,
      latitude: latitude,
      longitude: longitude,
      notes: params[:poop_report][:notes],
      reported_at: Time.current,
      status: "open"
    )

    if poop_report.save
      # Attach photo if provided
      if params[:poop_report][:photo].present?
        poop_report.photo.attach(params[:poop_report][:photo])
        poop_report.update(has_photo: true)
      end

      render json: {
        poop_report: serialize_poop_report_detail(poop_report),
        message: "Poop report submitted successfully!"
      }, status: :created
    else
      render json: { errors: poop_report.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # PATCH /poop_reports/:id
  # Update report status (acknowledge or resolve)
  def update
    # Only block's active scooper can acknowledge/resolve
    if params[:status].present? && ![ "acknowledged", "resolved" ].include?(params[:status])
      return render json: { error: "Invalid status" }, status: :bad_request
    end

    if params[:status].present?
      unless @poop_report.block.active_scooper_id == current_user&.id
        return render json: {
          error: "Only the active scooper can update report status"
        }, status: :forbidden
      end
    end

    if @poop_report.update(status: params[:status])
      render json: {
        poop_report: serialize_poop_report_detail(@poop_report),
        message: "Report status updated successfully"
      }
    else
      render json: { errors: @poop_report.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # DELETE /poop_reports/:id
  # Delete a report (only reporter can delete, and only if open)
  def destroy
    unless @poop_report.client.user_id == current_user&.id
      return render json: { error: "Unauthorized" }, status: :forbidden
    end

    unless @poop_report.status == "open"
      return render json: {
        error: "Can only delete open reports"
      }, status: :unprocessable_entity
    end

    @poop_report.destroy
    render json: { message: "Report deleted successfully" }
  end

  private

  def set_poop_report
    @poop_report = PoopReport.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    render json: { error: "Poop report not found" }, status: :not_found
  end

  def require_client
    unless current_user&.client
      render json: { error: "You must have a client profile to create reports" }, status: :forbidden
    end
  end

  def serialize_poop_report(report)
    {
      id: report.id,
      latitude: report.latitude,
      longitude: report.longitude,
      notes: report.notes,
      reported_at: report.reported_at,
      status: report.status,
      has_photo: report.has_photo,
      photo_url: report.photo.attached? ? url_for(report.photo) : nil,
      block: {
        id: report.block.id,
        block_id: report.block.block_id,
        neighborhood: report.block.neighborhood,
        borough: report.block.borough
      }
    }
  end

  def serialize_poop_report_detail(report)
    serialize_poop_report(report).merge(
      reporter: {
        id: report.client.id,
        # Keep reporter anonymous unless they choose otherwise
        anonymous: true
      },
      active_scooper: report.block.active_scooper ? {
        id: report.block.active_scooper.id,
        name: report.block.active_scooper.name,
        profile_pic_url: report.block.active_scooper.profile_pic_url
      } : nil
    )
  end
end
