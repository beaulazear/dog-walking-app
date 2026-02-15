class ScooperMilestonesController < ApplicationController
  before_action :require_scooper, except: [ :index, :show ]

  # GET /scooper_milestones
  # Returns milestones - optionally filtered by scooper
  def index
    if params[:user_id].present?
      milestones = ScooperMilestone.where(user_id: params[:user_id])
    elsif current_user&.is_scooper
      milestones = current_user.scooper_milestones
    else
      milestones = ScooperMilestone.all
    end

    # Filter by celebrated status
    if params[:celebrated] == "false"
      milestones = milestones.where(celebrated: false)
    elsif params[:celebrated] == "true"
      milestones = milestones.where(celebrated: true)
    end

    # Filter by milestone type
    milestones = milestones.where(milestone_type: params[:milestone_type]) if params[:milestone_type].present?

    # Order by most recently achieved first
    milestones = milestones.order(achieved_at: :desc)

    render json: {
      milestones: milestones.map { |milestone| serialize_milestone(milestone) },
      uncelebrated_count: current_user&.is_scooper ? current_user.scooper_milestones.where(celebrated: false).count : 0
    }
  end

  # GET /scooper_milestones/:id
  def show
    milestone = ScooperMilestone.find(params[:id])

    render json: {
      milestone: serialize_milestone_detail(milestone)
    }
  rescue ActiveRecord::RecordNotFound
    render json: { error: "Milestone not found" }, status: :not_found
  end

  # PATCH /scooper_milestones/:id/celebrate
  # Mark a milestone as celebrated (user has seen the achievement notification)
  def celebrate
    milestone = ScooperMilestone.find(params[:id])

    unless milestone.user_id == current_user.id
      return render json: { error: "Unauthorized" }, status: :forbidden
    end

    if milestone.update(celebrated: true)
      render json: {
        milestone: serialize_milestone(milestone),
        message: "Milestone celebrated!"
      }
    else
      render json: { errors: milestone.errors.full_messages }, status: :unprocessable_entity
    end
  rescue ActiveRecord::RecordNotFound
    render json: { error: "Milestone not found" }, status: :not_found
  end

  # POST /scooper_milestones/celebrate_all
  # Mark all uncelebrated milestones as celebrated
  def celebrate_all
    uncelebrated_milestones = current_user.scooper_milestones.where(celebrated: false)

    uncelebrated_milestones.update_all(celebrated: true)

    render json: {
      message: "All milestones celebrated!",
      count: uncelebrated_milestones.count
    }
  end

  # GET /scooper_milestones/available
  # Get list of all possible milestone tiers and which ones user has achieved
  def available
    unless current_user&.is_scooper
      return render json: { error: "You must be a scooper to view milestones" }, status: :forbidden
    end

    milestone_config = ScooperMilestone.milestone_titles
    achieved_milestones = current_user.scooper_milestones.pluck(:milestone_type, :threshold)

    available_milestones = milestone_config.map do |type, tiers|
      {
        milestone_type: type,
        tiers: tiers.map do |threshold, data|
          achieved = achieved_milestones.include?([ type.to_s, threshold ])
          {
            threshold: threshold,
            title: data[:title],
            description: data[:description],
            badge_icon: data[:icon],
            achieved: achieved,
            achieved_at: achieved ? current_user.scooper_milestones.find_by(
              milestone_type: type,
              threshold: threshold
            )&.achieved_at : nil
          }
        end
      }
    end

    render json: {
      available_milestones: available_milestones,
      current_stats: {
        total_lifetime_pickups: current_user.total_lifetime_pickups,
        current_streak_days: current_user.current_streak_days,
        active_blocks_count: current_user.active_blocks.count,
        total_cleanups: current_user.cleanups.count
      }
    }
  end

  private

  def require_scooper
    unless current_user&.is_scooper
      render json: { error: "You must be a scooper to perform this action" }, status: :forbidden
    end
  end

  def serialize_milestone(milestone)
    {
      id: milestone.id,
      milestone_type: milestone.milestone_type,
      threshold: milestone.threshold,
      title: milestone.title,
      badge_icon: milestone.badge_icon,
      description: milestone.description,
      achieved_at: milestone.achieved_at,
      celebrated: milestone.celebrated,
      scooper: {
        id: milestone.user.id,
        name: milestone.user.name,
        profile_pic_url: milestone.user.profile_pic_url
      }
    }
  end

  def serialize_milestone_detail(milestone)
    serialize_milestone(milestone).merge(
      scooper_stats: {
        total_lifetime_pickups: milestone.user.total_lifetime_pickups,
        current_streak_days: milestone.user.current_streak_days,
        active_blocks_count: milestone.user.active_blocks.count
      },
      next_milestone: find_next_milestone(milestone)
    )
  end

  def find_next_milestone(current_milestone)
    all_tiers = ScooperMilestone.milestone_titles[current_milestone.milestone_type.to_sym]
    return nil unless all_tiers

    next_threshold = all_tiers.keys.find { |threshold| threshold > current_milestone.threshold }
    return nil unless next_threshold

    next_data = all_tiers[next_threshold]
    {
      threshold: next_threshold,
      title: next_data[:title],
      description: next_data[:description],
      badge_icon: next_data[:icon]
    }
  end
end
