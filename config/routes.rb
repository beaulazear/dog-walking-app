Rails.application.routes.draw do
  resources :cancellations
  resources :additional_incomes
  resources :invoices, except: :update
  resources :appointments
  resources :pets
  resources :users

  get '/me', to: 'users#show'
  patch '/change_rates', to: 'users#change_rates'

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

  # Routing logic: fallback requests for React Router.
  # Leave this here to help deploy your app later!

  get '*path', to: 'fallback#index', constraints: ->(req) { !req.xhr? && req.format.html? }
end
