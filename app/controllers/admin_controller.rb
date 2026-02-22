class AdminController < ApplicationController
  before_action :admin_only

  # Dashboard - overview stats
  def dashboard
    render json: {
      users: {
        total: User.count,
        pocket_walks_users: User.where(uses_pocket_walks: true).count,
        scoopers_users: User.where(uses_scoopers: true).count,
        using_both_apps: User.where(uses_pocket_walks: true, uses_scoopers: true).count,
        dog_walkers: User.where(is_dog_walker: true).count,
        with_stripe: User.where.not(stripe_connect_account_id: nil).count
      },
      waitlist: {
        total: WaitlistSignup.count,
        this_week: WaitlistSignup.where("created_at >= ?", 1.week.ago).count,
        today: WaitlistSignup.where("created_at >= ?", Date.today).count
      },
      sponsorships: {
        total: Sponsorship.count,
        active: Sponsorship.where(status: "active").count,
        paused: Sponsorship.where(status: "paused").count,
        cancelled: Sponsorship.where(status: "cancelled").count,
        total_revenue: Sponsorship.where(status: "active").sum(:monthly_amount)
      },
      cleanup_jobs: {
        total: CleanupJob.count,
        pending: CleanupJob.where(status: "pending").count,
        in_progress: CleanupJob.where(status: "in_progress").count,
        completed: CleanupJob.where(status: "completed").count,
        disputed: CleanupJob.where(status: "disputed").count
      },
      sweeps: {
        total: Sweep.count,
        this_week: Sweep.where("created_at >= ?", 1.week.ago).count,
        today: Sweep.where("created_at >= ?", Date.today).count
      },
      contributions: {
        total: Contribution.count,
        active: Contribution.where(active: true).count,
        total_monthly: Contribution.where(active: true).sum(:monthly_amount)
      }
    }, status: :ok
  end

  # Users list
  def users
    # Filter by app if specified
    users = User.includes(:sponsorships_as_sponsor, :sponsorships_as_scooper, :cleanup_jobs_as_poster, :cleanup_jobs_as_scooper)

    # Filter by app
    case params[:app]
    when "pocket_walks"
      users = users.where(uses_pocket_walks: true)
    when "scoopers"
      users = users.where(uses_scoopers: true)
    when "both"
      users = users.where(uses_pocket_walks: true, uses_scoopers: true)
    end

    users = users.order(created_at: :desc).limit(100)

    render json: users.map { |u|
      {
        id: u.id,
        username: u.username,
        name: u.name,
        email: u.email_address,
        is_dog_walker: u.is_dog_walker,
        admin: u.admin,
        stripe_account_id: u.stripe_account_id,
        stripe_customer_id: u.stripe_customer_id,
        overall_rating: u.overall_rating,
        total_pickups: u.total_pickups,
        instagram: u.instagram_handle,
        business_name: u.business_name,
        uses_pocket_walks: u.uses_pocket_walks,
        uses_scoopers: u.uses_scoopers,
        registered_from_app: u.registered_from_app,
        app_list: u.app_list,
        sponsorships_as_sponsor: u.sponsorships_as_sponsor.count,
        sponsorships_as_scooper: u.sponsorships_as_scooper.count,
        jobs_posted: u.cleanup_jobs_as_poster.count,
        jobs_completed: u.cleanup_jobs_as_scooper.where(status: "completed").count,
        created_at: u.created_at
      }
    }, status: :ok
  end

  # Sponsorships list
  def sponsorships
    sponsorships = Sponsorship.includes(:sponsor, :scooper, :contributions)
                               .order(created_at: :desc)
                               .limit(100)

    render json: sponsorships.map { |s|
      {
        id: s.id,
        sponsor: {
          id: s.sponsor.id,
          name: s.sponsor.name,
          display_name: s.display_name
        },
        scooper: s.scooper ? {
          id: s.scooper.id,
          name: s.scooper.name,
          business_name: s.scooper.business_name
        } : nil,
        block_name: s.block_name,
        monthly_amount: s.monthly_amount,
        frequency: s.frequency,
        status: s.status,
        contributors_count: s.contributions.where(active: true).count,
        total_contributions: s.contributions.where(active: true).sum(:monthly_amount),
        next_billing_date: s.next_billing_date,
        created_at: s.created_at
      }
    }, status: :ok
  end

  # Cleanup Jobs list
  def cleanup_jobs
    jobs = CleanupJob.includes(:poster, :scooper)
                     .order(created_at: :desc)
                     .limit(100)

    render json: jobs.map { |j|
      {
        id: j.id,
        poster: {
          id: j.poster.id,
          name: j.poster.name
        },
        scooper: j.scooper ? {
          id: j.scooper.id,
          name: j.scooper.name
        } : nil,
        description: j.description,
        location: j.location,
        latitude: j.latitude,
        longitude: j.longitude,
        payout: j.payout,
        status: j.status,
        category: j.category,
        claimed_at: j.claimed_at,
        completed_at: j.completed_at,
        created_at: j.created_at
      }
    }, status: :ok
  end

  # Sweeps list
  def sweeps
    sweeps = Sweep.includes(:sponsorship, :scooper)
                  .order(created_at: :desc)
                  .limit(100)

    render json: sweeps.map { |s|
      {
        id: s.id,
        sponsorship_id: s.sponsorship_id,
        block_name: s.sponsorship.block_name,
        scooper: {
          id: s.scooper.id,
          name: s.scooper.name
        },
        pickup_count: s.pickup_count,
        latitude: s.latitude,
        longitude: s.longitude,
        notes: s.notes,
        created_at: s.created_at
      }
    }, status: :ok
  end

  # Contributions list
  def contributions
    contributions = Contribution.includes(:sponsorship, :contributor)
                                .order(created_at: :desc)
                                .limit(100)

    render json: contributions.map { |c|
      {
        id: c.id,
        sponsorship_id: c.sponsorship_id,
        block_name: c.sponsorship.block_name,
        contributor: {
          id: c.contributor.id,
          name: c.contributor.name,
          display_preference: c.display_preference
        },
        monthly_amount: c.monthly_amount,
        active: c.active,
        stripe_subscription_id: c.stripe_subscription_id,
        created_at: c.created_at
      }
    }, status: :ok
  end

  # Waitlist signups (already exists but adding here for completeness)
  def waitlist
    signups = WaitlistSignup.order(created_at: :desc).limit(500)

    render json: signups.map { |s|
      {
        id: s.id,
        email: s.email,
        ip_address: s.ip_address,
        user_agent: s.user_agent,
        created_at: s.created_at
      }
    }, status: :ok
  end

  # Reviews list
  def reviews
    reviews = Review.includes(:reviewer, :scooper, :cleanup_job)
                    .order(created_at: :desc)
                    .limit(100)

    render json: reviews.map { |r|
      {
        id: r.id,
        reviewer: {
          id: r.reviewer.id,
          name: r.reviewer.name
        },
        scooper: {
          id: r.scooper.id,
          name: r.scooper.name
        },
        cleanup_job_id: r.cleanup_job_id,
        rating: r.rating,
        comment: r.comment,
        created_at: r.created_at
      }
    }, status: :ok
  end

  # Sponsorship ratings list
  def sponsorship_ratings
    ratings = SponsorshipRating.includes(:sponsor, :scooper, :sponsorship)
                               .order(created_at: :desc)
                               .limit(100)

    render json: ratings.map { |r|
      {
        id: r.id,
        sponsor: {
          id: r.sponsor.id,
          name: r.sponsor.name
        },
        scooper: {
          id: r.scooper.id,
          name: r.scooper.name
        },
        sponsorship_id: r.sponsorship_id,
        block_name: r.sponsorship.block_name,
        overall_rating: r.overall_rating,
        cleanliness_rating: r.cleanliness_rating,
        communication_rating: r.communication_rating,
        reliability_rating: r.reliability_rating,
        comment: r.comment,
        created_at: r.created_at
      }
    }, status: :ok
  end
end
