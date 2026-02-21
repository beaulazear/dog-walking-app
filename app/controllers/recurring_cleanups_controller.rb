class RecurringCleanupsController < ApplicationController
  before_action :authorized

  # GET /recurring_cleanups
  # List all recurring cleanups (for admin)
  def index
    recurring_cleanups = RecurringCleanup.includes(:poster, :scooper).all
    render json: recurring_cleanups.as_json(
      include: {
        poster: { only: [ :id, :name, :email_address ] },
        scooper: { only: [ :id, :name, :email_address ] }
      }
    )
  end

  # GET /recurring_cleanups/:id
  # Show a specific recurring cleanup
  def show
    recurring_cleanup = RecurringCleanup.find(params[:id])

    # Authorization: only poster or scooper can view
    unless [ recurring_cleanup.poster_id, recurring_cleanup.scooper_id ].include?(@current_user.id)
      return render json: { error: "Not authorized" }, status: :forbidden
    end

    render json: serialize_recurring_cleanup(recurring_cleanup)
  end

  # GET /recurring_cleanups/my_subscriptions
  # List the current user's subscriptions (as poster)
  def my_subscriptions
    subscriptions = @current_user.recurring_cleanups_as_poster
                                 .includes(:scooper)
                                 .order(created_at: :desc)

    render json: subscriptions.map { |sub| serialize_recurring_cleanup(sub) }
  end

  # GET /recurring_cleanups/my_assignments
  # List the current user's assigned recurring cleanups (as scooper)
  def my_assignments
    assignments = @current_user.recurring_cleanups_as_scooper
                               .includes(:poster)
                               .order(created_at: :desc)

    render json: assignments.map { |sub| serialize_recurring_cleanup(sub) }
  end

  # POST /recurring_cleanups
  # Create a new recurring cleanup subscription
  def create
    recurring_cleanup = RecurringCleanup.new(recurring_cleanup_params)
    recurring_cleanup.poster = @current_user
    recurring_cleanup.status = "pending"

    if recurring_cleanup.save
      # If scooper is assigned and payment method provided, create Stripe subscription
      if recurring_cleanup.scooper.present? && params[:payment_method_id].present?
        begin
          result = recurring_cleanup.create_stripe_subscription!(params[:payment_method_id])

          if result[:requires_action]
            return render json: {
              recurring_cleanup: serialize_recurring_cleanup(recurring_cleanup),
              requires_action: true,
              client_secret: result[:client_secret]
            }, status: :created
          end

          render json: {
            recurring_cleanup: serialize_recurring_cleanup(recurring_cleanup),
            message: "Subscription created successfully"
          }, status: :created
        rescue Stripe::StripeError => e
          recurring_cleanup.destroy
          render json: { error: "Payment failed: #{e.message}" }, status: :unprocessable_entity
        end
      else
        # Subscription created but pending scooper assignment or payment
        render json: {
          recurring_cleanup: serialize_recurring_cleanup(recurring_cleanup),
          message: "Subscription created, pending scooper assignment"
        }, status: :created
      end
    else
      render json: { errors: recurring_cleanup.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # PATCH /recurring_cleanups/:id
  # Update a recurring cleanup
  def update
    recurring_cleanup = RecurringCleanup.find(params[:id])

    # Authorization: only poster can update
    unless recurring_cleanup.poster_id == @current_user.id
      return render json: { error: "Not authorized" }, status: :forbidden
    end

    if recurring_cleanup.update(recurring_cleanup_update_params)
      render json: {
        recurring_cleanup: serialize_recurring_cleanup(recurring_cleanup),
        message: "Subscription updated successfully"
      }
    else
      render json: { errors: recurring_cleanup.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # POST /recurring_cleanups/:id/pause
  # Pause a recurring cleanup subscription
  def pause
    recurring_cleanup = RecurringCleanup.find(params[:id])

    # Authorization: only poster can pause
    unless recurring_cleanup.poster_id == @current_user.id
      return render json: { error: "Not authorized" }, status: :forbidden
    end

    recurring_cleanup.pause!
    render json: {
      recurring_cleanup: serialize_recurring_cleanup(recurring_cleanup),
      message: "Subscription paused"
    }
  end

  # POST /recurring_cleanups/:id/resume
  # Resume a paused recurring cleanup subscription
  def resume
    recurring_cleanup = RecurringCleanup.find(params[:id])

    # Authorization: only poster can resume
    unless recurring_cleanup.poster_id == @current_user.id
      return render json: { error: "Not authorized" }, status: :forbidden
    end

    recurring_cleanup.resume!
    render json: {
      recurring_cleanup: serialize_recurring_cleanup(recurring_cleanup),
      message: "Subscription resumed"
    }
  end

  # POST /recurring_cleanups/:id/cancel
  # Cancel a recurring cleanup subscription
  def cancel
    recurring_cleanup = RecurringCleanup.find(params[:id])

    # Authorization: only poster can cancel
    unless recurring_cleanup.poster_id == @current_user.id
      return render json: { error: "Not authorized" }, status: :forbidden
    end

    begin
      recurring_cleanup.cancel!
      render json: {
        recurring_cleanup: serialize_recurring_cleanup(recurring_cleanup),
        message: "Subscription cancelled"
      }
    rescue Stripe::StripeError => e
      render json: { error: "Failed to cancel subscription: #{e.message}" }, status: :unprocessable_entity
    end
  end

  # POST /recurring_cleanups/:id/assign_scooper
  # Assign a scooper to a pending recurring cleanup
  def assign_scooper
    recurring_cleanup = RecurringCleanup.find(params[:id])

    # Authorization: only poster can assign scooper
    unless recurring_cleanup.poster_id == @current_user.id
      return render json: { error: "Not authorized" }, status: :forbidden
    end

    scooper = User.find(params[:scooper_id])
    recurring_cleanup.scooper = scooper

    if params[:payment_method_id].present?
      begin
        result = recurring_cleanup.create_stripe_subscription!(params[:payment_method_id])

        if result[:requires_action]
          return render json: {
            recurring_cleanup: serialize_recurring_cleanup(recurring_cleanup),
            requires_action: true,
            client_secret: result[:client_secret]
          }
        end

        render json: {
          recurring_cleanup: serialize_recurring_cleanup(recurring_cleanup),
          message: "Scooper assigned and subscription activated"
        }
      rescue Stripe::StripeError => e
        render json: { error: "Payment failed: #{e.message}" }, status: :unprocessable_entity
      end
    else
      recurring_cleanup.save!
      render json: {
        recurring_cleanup: serialize_recurring_cleanup(recurring_cleanup),
        message: "Scooper assigned, payment pending"
      }
    end
  end

  private

  def recurring_cleanup_params
    params.require(:recurring_cleanup).permit(
      :scooper_id,
      :address,
      :latitude,
      :longitude,
      :frequency,
      :day_of_week,
      :price,
      :job_type,
      :poop_itemization,
      :litter_itemization,
      :note,
      segments_selected: []
    )
  end

  def recurring_cleanup_update_params
    params.require(:recurring_cleanup).permit(
      :frequency,
      :day_of_week,
      :price,
      :note
    )
  end

  def serialize_recurring_cleanup(recurring_cleanup)
    {
      id: recurring_cleanup.id,
      poster: {
        id: recurring_cleanup.poster.id,
        name: recurring_cleanup.poster.name,
        email: recurring_cleanup.poster.email_address
      },
      scooper: recurring_cleanup.scooper ? {
        id: recurring_cleanup.scooper.id,
        name: recurring_cleanup.scooper.name,
        email: recurring_cleanup.scooper.email_address
      } : nil,
      address: recurring_cleanup.address,
      latitude: recurring_cleanup.latitude,
      longitude: recurring_cleanup.longitude,
      frequency: recurring_cleanup.frequency,
      day_of_week: recurring_cleanup.day_of_week,
      price: recurring_cleanup.price,
      status: recurring_cleanup.status,
      job_type: recurring_cleanup.job_type,
      segments_selected: recurring_cleanup.segments_selected,
      poop_itemization: recurring_cleanup.poop_itemization,
      litter_itemization: recurring_cleanup.litter_itemization,
      note: recurring_cleanup.note,
      next_job_date: recurring_cleanup.next_job_date,
      last_job_generated_at: recurring_cleanup.last_job_generated_at,
      started_at: recurring_cleanup.started_at,
      cancelled_at: recurring_cleanup.cancelled_at,
      created_at: recurring_cleanup.created_at,
      updated_at: recurring_cleanup.updated_at
    }
  end
end
