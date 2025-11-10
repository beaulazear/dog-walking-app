Rails.application.routes.draw do
  resources :cancellations
  resources :additional_incomes
  resources :invoices, except: :update
  resources :appointments
  resources :pets

  # User routes - search must be before resources to avoid matching as :id
  get '/users/search', to: 'users#search'
  resources :users

  get '/me', to: 'users#show'
  patch '/change_rates', to: 'users#change_rates'

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

  post '/login', to: 'sessions#create'
  delete '/logout', to: 'sessions#destroy'

  patch '/invoices/paid', to: 'invoices#paid'
  patch '/invoices/pending', to: 'invoices#pending'

  patch '/appointments/:id/canceled', to: 'appointments#canceled'
  get '/pets_appointments', to: 'appointments#pet_appointments'
  patch '/pets/:id/active', to: 'pets#update_active_status'

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

  # Dashboard & Stats
  get '/training/dashboard', to: 'training#dashboard'
  get '/training/stats', to: 'training#stats'

  # Certification Goal (singular resource)
  resource :certification_goal, only: %i[show create update]

  # Milestones
  resources :milestones, only: [:index] do
    member do
      patch :mark_celebrated
    end
  end

  # Books
  resources :books, only: [:index] do
    collection do
      get :my_list
      post :custom, to: 'books#create_custom'
    end
    member do
      post :add_to_list
    end
  end
  patch '/books/:id', to: 'books#update'
  delete '/books/:id', to: 'books#destroy'

  # Distance & Geocoding Routes
  post '/distance/calculate', to: 'distance#calculate'
  post '/distance/matrix', to: 'distance#matrix'
  post '/distance/route', to: 'distance#route'
  post '/distance/nearby', to: 'distance#nearby'
  get '/distance/appointments/:date', to: 'distance#appointments'

  # Walk Grouping Routes
  get '/walk_groups/suggestions', to: 'walk_groups#suggestions'
  resources :walk_groups, only: [:index, :create, :destroy]

  # Route Optimization Routes (Phase 4)
  post '/routes/optimize', to: 'routes#optimize'
  post '/routes/reorder', to: 'routes#reorder'
  get '/routes/:date', to: 'routes#show'

  # Routing logic: fallback requests for React Router.
  # Leave this here to help deploy your app later!

  get '*path', to: 'fallback#index', constraints: ->(req) { !req.xhr? && req.format.html? }
end
