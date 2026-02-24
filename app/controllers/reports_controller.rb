class ReportsController < ApplicationController
  before_action :authorized, only: [ :create, :my_reports ]
  before_action :set_report, only: [ :show ]

  # POST /reports
  # Submit a new report (requires authentication)
  def create
    # Find the reportable content
    reportable = find_reportable(params[:reportable_type], params[:reportable_id])

    unless reportable
      return render json: { error: "Content not found" }, status: :not_found
    end

    # Check if user already reported this content
    existing_report = current_user.reports_filed.find_by(
      reportable_type: params[:reportable_type],
      reportable_id: params[:reportable_id]
    )

    if existing_report
      return render json: {
        error: "You have already reported this content",
        report_id: existing_report.id
      }, status: :unprocessable_entity
    end

    # Create the report
    report = current_user.reports_filed.new(
      reportable: reportable,
      reason: params[:reason],
      description: params[:description]
    )

    if report.save
      render json: {
        status: "success",
        message: "Report submitted successfully. We will review it within 24 hours.",
        report: report_json(report)
      }, status: :created
    else
      render json: {
        error: "Failed to submit report",
        errors: report.errors.full_messages
      }, status: :unprocessable_entity
    end
  end

  # GET /reports/my_reports
  # List all reports filed by current user
  def my_reports
    reports = current_user.reports_filed.includes(:reportable).recent.page(params[:page]).per(20)

    render json: {
      reports: reports.map { |r| report_json(r) },
      total: current_user.reports_filed.count,
      page: params[:page]&.to_i || 1
    }
  end

  # GET /reports/:id
  # Show a specific report (must be the reporter or an admin)
  def show
    unless can_view_report?(@report)
      return render json: { error: "Unauthorized" }, status: :forbidden
    end

    render json: { report: detailed_report_json(@report) }
  end

  private

  def find_reportable(type, id)
    case type
    when "Sighting"
      Sighting.find_by(id: id)
    when "CleanupJob"
      CleanupJob.find_by(id: id)
    when "User"
      User.find_by(id: id)
    else
      nil
    end
  end

  def set_report
    @report = Report.find_by(id: params[:id])
    render json: { error: "Report not found" }, status: :not_found unless @report
  end

  def can_view_report?(report)
    return false unless current_user

    current_user.admin? || report.reporter_id == current_user.id
  end

  def report_json(report)
    {
      id: report.id,
      reportable_type: report.reportable_type,
      reportable_id: report.reportable_id,
      reason: report.reason,
      reason_label: Report::REASONS[report.reason.to_sym],
      description: report.description,
      status: report.status,
      created_at: report.created_at,
      reviewed_at: report.reviewed_at
    }
  end

  def detailed_report_json(report)
    report_json(report).merge(
      reported_content: report.reported_content_preview,
      resolution_action: report.resolution_action,
      resolution_notes: (current_user&.admin? ? report.resolution_notes : nil),
      internal_notes: (current_user&.admin? ? report.internal_notes : nil)
    )
  end
end
