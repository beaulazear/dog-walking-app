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

  # Routing logic: fallback requests for React Router.
  # Leave this here to help deploy your app later!

  get "*path", to: "fallback#index", constraints: ->(req) { !req.xhr? && req.format.html? }
end
