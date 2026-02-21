Rails.application.routes.draw do
  resources :cancellations
  resources :additional_incomes

  # Custom invoice routes (must come before resources :invoices to match first)
  patch "/invoices/paid", to: "invoices#paid"
  patch "/invoices/pending", to: "invoices#pending"

  resources :invoices
  resources :appointments do
    collection do
      get :for_date
      get :my_earnings
      get :team_financials
    end
  end
  resources :pets

  # Pet Sits
  resources :pet_sits, only: %i[index show create update destroy] do
    collection do
      get :for_date      # GET /pet_sits/for_date?date=2026-01-15
      get :upcoming      # GET /pet_sits/upcoming
      get :current       # GET /pet_sits/current
    end
    member do
      post :complete_day # POST /pet_sits/:id/complete_day
    end
  end

  # User routes - search must be before resources to avoid matching as :id
  get "/users/search", to: "users#search"
  resources :users

  get "/me", to: "users#show"
  patch "/change_rates", to: "users#change_rates"
  patch "/update_profile", to: "users#update_profile"
  post "/users/register_device", to: "users#register_device"
  post "/users/upload_profile_photo", to: "users#upload_profile_photo"

  # Walker Connections (Team Management)
  resources :walker_connections, only: %i[index create destroy] do
    member do
      patch :accept
      patch :decline
      patch :block
    end
  end

  # Appointment Sharing
  resources :appointment_shares, only: %i[index create destroy] do
    collection do
      get :my_shared_appointments
    end
    member do
      patch :accept
      patch :decline
    end
  end

  post "/login", to: "sessions#create"
  delete "/logout", to: "sessions#destroy"

  patch "/appointments/:id/canceled", to: "appointments#canceled"
  get "/pets_appointments", to: "appointments#pet_appointments"
  patch "/pets/:id/active", to: "pets#update_active_status"

  # Training & Certification Routes
  resources :training_sessions, only: %i[index create update destroy] do
    collection do
      get :summary
      get :export
      get :this_week
      get :this_month
      post :sync_from_invoices
    end
  end

  # Blogs
  resources :blogs, only: %i[index create update destroy]

  # Dashboard & Stats
  get "/training/dashboard", to: "training#dashboard"
  get "/training/stats", to: "training#stats"

  # Certification Goal (singular resource)
  resource :certification_goal, only: %i[show create update]

  # Milestones
  resources :milestones, only: [ :index ] do
    member do
      patch :mark_celebrated
    end
  end

  # Books
  resources :books, only: [ :index ] do
    collection do
      get :my_list
      post :custom, to: "books#create_custom"
    end
    member do
      post :add_to_list
    end
  end
  patch "/books/:id", to: "books#update"
  delete "/books/:id", to: "books#destroy"

  # Distance & Geocoding Routes
  post "/distance/calculate", to: "distance#calculate"
  post "/distance/matrix", to: "distance#matrix"
  post "/distance/route", to: "distance#route"
  post "/distance/nearby", to: "distance#nearby"
  get "/distance/appointments/:date", to: "distance#appointments"

  # Walk Grouping Routes
  get "/walk_groups/suggestions", to: "walk_groups#suggestions"
  resources :walk_groups, only: %i[index create destroy]

  # Route Optimization Routes (Phase 4)
  post "/routes/optimize", to: "routes#optimize"
  post "/routes/reorder", to: "routes#reorder"
  get "/routes/:date", to: "routes#show"

  # Client Routes (Pet Owner Portal)
  post "/client/signup", to: "clients#create"
  post "/client/login", to: "client_sessions#create"
  delete "/client/logout", to: "client_sessions#destroy"
  get "/client/me", to: "clients#show"
  patch "/client/me", to: "clients#update"
  patch "/client/push_token", to: "clients#update_push_token"

  # Walker Client Management Routes
  get "/walker/clients", to: "walker_clients#index"
  get "/walker/clients/:id", to: "walker_clients#show"
  post "/walker/clients", to: "walker_clients#create"
  patch "/walker/clients/:id", to: "walker_clients#update"
  delete "/walker/clients/:id", to: "walker_clients#destroy"

  # Waitlist Signups
  get "/waitlist_signups", to: "waitlist_signups#index"
  post "/waitlist_signups", to: "waitlist_signups#create"

  # ===== SCOOP ROUTES =====
  # Hyperlocal dog waste cleanup marketplace

  # Stripe Connect - Scooper onboarding and payment setup
  post "/stripe_connect/onboard", to: "stripe_connect#onboard"
  get "/stripe_connect/status", to: "stripe_connect#status"
  get "/stripe_connect/dashboard", to: "stripe_connect#dashboard"

  # Stripe Webhooks - Handle payment events
  post "/stripe/webhooks", to: "stripe_webhooks#create"

  # Blocks - Geographic blocks for cleanup
  resources :blocks, only: %i[index show] do
    collection do
      get :nearby          # GET /blocks/nearby?latitude=40.7&longitude=-74.0&radius=1000
    end
    member do
      get :stats           # GET /blocks/:id/stats
      post :claim          # POST /blocks/:id/claim
    end
  end

  # Coverage Regions - Scoopers claim blocks with monthly rates
  resources :coverage_regions, only: %i[index show create update destroy]

  # Pledges - Residents pledge money toward blocks
  resources :pledges, only: %i[index show create update destroy] do
    member do
      post :switch_scooper # POST /pledges/:id/switch_scooper
    end
  end

  # Cleanups - GPS-verified cleanup logs
  resources :cleanups, only: %i[index show create update destroy]

  # Poop Reports - Resident-submitted reports
  resources :poop_reports, only: %i[index show create update destroy] do
    collection do
      get :nearby          # GET /poop_reports/nearby?latitude=40.7&longitude=-74.0&radius=500
    end
  end

  # Cleanup Jobs - On-demand job board (new model)
  resources :cleanup_jobs, only: %i[index show create] do
    collection do
      get :my_posted         # GET /cleanup_jobs/my_posted
      get :my_claimed        # GET /cleanup_jobs/my_claimed
    end
    member do
      post :claim            # POST /cleanup_jobs/:id/claim
      post :start            # POST /cleanup_jobs/:id/start
      post :complete         # POST /cleanup_jobs/:id/complete
      post :confirm          # POST /cleanup_jobs/:id/confirm
      post :dispute          # POST /cleanup_jobs/:id/dispute
      post :cancel           # POST /cleanup_jobs/:id/cancel
      post :upload_before_photo  # POST /cleanup_jobs/:id/upload_before_photo
      post :upload_after_photo   # POST /cleanup_jobs/:id/upload_after_photo
    end
  end

  # Recurring Cleanups - Subscription-based cleanup service
  resources :recurring_cleanups, only: %i[index show create update] do
    collection do
      get :my_subscriptions    # GET /recurring_cleanups/my_subscriptions
      get :my_assignments      # GET /recurring_cleanups/my_assignments
    end
    member do
      post :pause              # POST /recurring_cleanups/:id/pause
      post :resume             # POST /recurring_cleanups/:id/resume
      post :cancel             # POST /recurring_cleanups/:id/cancel
      post :assign_scooper     # POST /recurring_cleanups/:id/assign_scooper
    end
  end

  # Scooper Milestones - Achievement tracking
  resources :scooper_milestones, only: %i[index show] do
    collection do
      get :available       # GET /scooper_milestones/available
      post :celebrate_all  # POST /scooper_milestones/celebrate_all
    end
    member do
      patch :celebrate     # PATCH /scooper_milestones/:id/celebrate
    end
  end

  # ===== MVP v3 ROUTES =====
  # Block Sponsorships, Public Map, Dog Walker Profiles

  # Public Map API (NO AUTH REQUIRED)
  namespace :api do
    namespace :map do
      get "stats", to: "map#stats"                    # GET /api/map/stats?lat=40.6782&lng=-73.9442
      get "blocks/:block_id", to: "map#block_detail"  # GET /api/map/blocks/BK-40.6782--73.9442
      get "neighborhoods", to: "map#neighborhoods"     # GET /api/map/neighborhoods
    end
  end

  # Sponsorships - Block sponsorship management
  namespace :api do
    resources :sponsorships, only: %i[index show create] do
      member do
        post :claim          # POST /api/sponsorships/:id/claim (dog walker claims)
        post :pause          # POST /api/sponsorships/:id/pause (sponsor pauses)
        post :resume         # POST /api/sponsorships/:id/resume (sponsor resumes)
        post :cancel         # POST /api/sponsorships/:id/cancel (sponsor cancels)
      end

      # Nested resources under sponsorships
      resources :sweeps, only: %i[index create], controller: "sweeps"            # Maintenance sweeps
      resources :contributions, only: %i[index create destroy], controller: "contributions"  # Neighbor support
      resources :ratings, only: %i[index create], controller: "sponsorship_ratings"  # Monthly ratings
    end
  end

  # Routing logic: fallback requests for React Router.
  # Leave this here to help deploy your app later!

  get "*path", to: "fallback#index", constraints: ->(req) { !req.xhr? && req.format.html? }
end
