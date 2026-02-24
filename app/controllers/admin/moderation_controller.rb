module Admin
  class ModerationController < ApplicationController
    before_action :authorized
    before_action :require_admin
    before_action :set_report, only: [ :show, :review, :resolve, :dismiss ]

    # GET /admin/moderation/dashboard
    # Admin moderation dashboard with stats and overview
    def dashboard
      render json: {
        stats: moderation_stats,
        recent_reports: Report.recent.limit(10).map { |r| report_summary_json(r) },
        overdue_reports: Report.overdue.map { |r| report_summary_json(r) },
        reports_by_reason: reports_by_reason_stats,
        reports_by_status: reports_by_status_stats
      }
    end

    # GET /admin/moderation/reports
    # List all reports with filtering
    def index
      reports = Report.includes(:reporter, :reportable, :reviewed_by).recent

      # Filter by status
      reports = reports.where(status: params[:status]) if params[:status].present?

      # Filter by reason
      reports = reports.where(reason: params[:reason]) if params[:reason].present?

      # Filter by overdue
      reports = reports.overdue if params[:overdue] == "true"

      # Paginate
      reports = reports.page(params[:page]).per(params[:per_page] || 20)

      render json: {
        reports: reports.map { |r| detailed_report_json(r) },
        total: reports.total_count,
        page: params[:page]&.to_i || 1,
        per_page: params[:per_page]&.to_i || 20
      }
    end

    # GET /admin/moderation/reports/:id
    # Show full report details
    def show
      render json: {
        report: full_report_json(@report),
        moderation_history: moderation_history_json(@report)
      }
    end

    # PATCH /admin/moderation/reports/:id/review
    # Mark report as being reviewed
    def review
      if @report.mark_as_reviewing!(current_user)
        render json: {
          message: "Report marked as reviewing",
          report: detailed_report_json(@report)
        }
      else
        render json: { error: "Failed to update report" }, status: :unprocessable_entity
      end
    end

    # PATCH /admin/moderation/reports/:id/resolve
    # Resolve a report with action
    def resolve
      action = params[:resolution_action]
      notes = params[:resolution_notes]

      unless Report::RESOLUTION_ACTIONS.keys.map(&:to_s).include?(action)
        return render json: {
          error: "Invalid resolution action",
          valid_actions: Report::RESOLUTION_ACTIONS.keys
        }, status: :unprocessable_entity
      end

      begin
        @report.resolve!(action, notes, current_user)

        render json: {
          message: "Report resolved successfully",
          report: detailed_report_json(@report)
        }
      rescue => e
        Rails.logger.error "Error resolving report: #{e.message}"
        render json: { error: "Failed to resolve report: #{e.message}" }, status: :unprocessable_entity
      end
    end

    # PATCH /admin/moderation/reports/:id/dismiss
    # Dismiss a report (no violation found)
    def dismiss
      reason = params[:reason] || "No violation found"

      if @report.dismiss!(reason, current_user)
        render json: {
          message: "Report dismissed",
          report: detailed_report_json(@report)
        }
      else
        render json: { error: "Failed to dismiss report" }, status: :unprocessable_entity
      end
    end

    # GET /admin/moderation/users/:id/history
    # Get moderation history for a specific user
    def user_history
      user = User.find_by(id: params[:id])

      unless user
        return render json: { error: "User not found" }, status: :not_found
      end

      render json: {
        user: user_summary_json(user),
        reports_about_user: user.reports_about_me.map { |r| report_summary_json(r) },
        moderation_actions: user.moderation_actions.recent.limit(50).map { |a| moderation_action_json(a) },
        stats: {
          total_reports: user.reports_count,
          total_warnings: user.warnings_count,
          status: user.status,
          suspended_until: user.suspended_until,
          banned_at: user.banned_at
        }
      }
    end

    # POST /admin/moderation/users/:id/warn
    # Warn a user
    def warn_user
      user = User.find_by(id: params[:id])
      return render json: { error: "User not found" }, status: :not_found unless user

      reason = params[:reason] || "Community guidelines violation"

      user.warn!(reason, current_user)

      render json: {
        message: "User warned successfully",
        user: user_summary_json(user)
      }
    end

    # POST /admin/moderation/users/:id/suspend
    # Suspend a user
    def suspend_user
      user = User.find_by(id: params[:id])
      return render json: { error: "User not found" }, status: :not_found unless user

      duration = params[:duration_days]&.to_i || 7
      reason = params[:reason] || "Community guidelines violation"

      user.suspend!(duration.days, reason, current_user)

      render json: {
        message: "User suspended for #{duration} days",
        user: user_summary_json(user)
      }
    end

    # POST /admin/moderation/users/:id/ban
    # Ban a user permanently
    def ban_user
      user = User.find_by(id: params[:id])
      return render json: { error: "User not found" }, status: :not_found unless user

      reason = params[:reason] || "Severe community guidelines violation"

      user.ban!(reason, current_user)

      render json: {
        message: "User banned permanently",
        user: user_summary_json(user)
      }
    end

    # POST /admin/moderation/users/:id/unsuspend
    # Unsuspend a user
    def unsuspend_user
      user = User.find_by(id: params[:id])
      return render json: { error: "User not found" }, status: :not_found unless user

      user.unsuspend!(current_user)

      render json: {
        message: "User unsuspended",
        user: user_summary_json(user)
      }
    end

    # POST /admin/moderation/users/:id/unban
    # Unban a user
    def unban_user
      user = User.find_by(id: params[:id])
      return render json: { error: "User not found" }, status: :not_found unless user

      user.unban!(current_user)

      render json: {
        message: "User unbanned",
        user: user_summary_json(user)
      }
    end

    # GET /admin/moderation/stats
    # Get overall moderation statistics
    def stats
      render json: {
        reports: {
          total: Report.count,
          pending: Report.pending.count,
          resolved: Report.resolved.count,
          dismissed: Report.dismissed.count,
          overdue: Report.overdue.count
        },
        users: {
          total: User.count,
          active: User.where(status: "active").count,
          suspended: User.where(status: "suspended").count,
          banned: User.where(status: "banned").count
        },
        moderation_actions: {
          total: ModerationAction.count,
          warnings: ModerationAction.where(action_type: "warned").count,
          suspensions: ModerationAction.where(action_type: "suspended").count,
          bans: ModerationAction.where(action_type: "banned").count
        }
      }
    end

    private

    def require_admin
      unless current_user&.admin?
        render json: { error: "Admin access required" }, status: :forbidden
      end
    end

    def set_report
      @report = Report.find_by(id: params[:id])
      render json: { error: "Report not found" }, status: :not_found unless @report
    end

    def moderation_stats
      {
        total_reports: Report.count,
        pending_reports: Report.pending.count,
        overdue_reports: Report.overdue.count,
        resolved_today: Report.resolved.where("resolved_at >= ?", 24.hours.ago).count,
        average_resolution_time: calculate_avg_resolution_time
      }
    end

    def calculate_avg_resolution_time
      resolved = Report.resolved.where.not(reviewed_at: nil)
      return 0 if resolved.empty?

      total_seconds = resolved.sum { |r| (r.reviewed_at - r.created_at).to_i }
      avg_seconds = total_seconds / resolved.count
      (avg_seconds / 3600.0).round(1) # Convert to hours
    end

    def reports_by_reason_stats
      Report.group(:reason).count
    end

    def reports_by_status_stats
      Report.group(:status).count
    end

    def report_summary_json(report)
      {
        id: report.id,
        reportable_type: report.reportable_type,
        reportable_id: report.reportable_id,
        reported_content: report.reported_content_preview,
        reporter: {
          id: report.reporter_id,
          name: report.reporter.name,
          username: report.reporter.username
        },
        reported_user: report.reported_user ? user_summary_json(report.reported_user) : nil,
        reason: report.reason,
        reason_label: Report::REASONS[report.reason.to_sym],
        status: report.status,
        created_at: report.created_at,
        overdue: report.overdue?
      }
    end

    def detailed_report_json(report)
      report_summary_json(report).merge(
        description: report.description,
        reviewed_at: report.reviewed_at,
        reviewed_by: report.reviewed_by ? { id: report.reviewed_by.id, name: report.reviewed_by.name } : nil,
        resolution_action: report.resolution_action,
        resolution_notes: report.resolution_notes,
        internal_notes: report.internal_notes
      )
    end

    def full_report_json(report)
      detailed_report_json(report).merge(
        reportable_details: reportable_details(report.reportable)
      )
    end

    def reportable_details(reportable)
      case reportable
      when Sighting
        {
          type: "Sighting",
          address: reportable.address,
          neighborhood: reportable.neighborhood,
          tag_type: reportable.tag_type,
          business_name: reportable.business_name,
          created_at: reportable.created_at,
          photo_urls: reportable.photos.attached? ? reportable.photos.map { |p| url_for(p) } : []
        }
      when CleanupJob
        {
          type: "CleanupJob",
          address: reportable.address,
          job_type: reportable.job_type,
          price: reportable.price,
          status: reportable.status,
          created_at: reportable.created_at
        }
      when User
        user_summary_json(reportable)
      else
        { type: "Unknown" }
      end
    end

    def user_summary_json(user)
      {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email_address,
        status: user.status,
        warnings_count: user.warnings_count,
        reports_count: user.reports_count,
        suspended_until: user.suspended_until,
        banned_at: user.banned_at
      }
    end

    def moderation_history_json(report)
      return [] unless report.reported_user

      report.reported_user.moderation_actions.recent.limit(20).map { |action| moderation_action_json(action) }
    end

    def moderation_action_json(action)
      {
        id: action.id,
        action_type: action.action_type,
        action_label: action.action_label,
        reason: action.reason,
        details: action.details,
        moderator: {
          id: action.moderator_id,
          name: action.moderator.name
        },
        created_at: action.created_at,
        expires_at: action.expires_at
      }
    end
  end
end
