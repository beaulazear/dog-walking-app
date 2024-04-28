Rails.application.routes.draw do
  
  resources :additional_incomes
  resources :invoices, except: :update
  resources :appointments
  resources :pets
  resources :users

  get "/me", to: "users#show"
  
  post "/login", to: "sessions#create"
  delete "/logout", to: "sessions#destroy"

  patch "/invoices/paid", to: "invoices#paid"
  patch "/invoices/pending", to: "invoices#pending"

  patch '/appointments/:id/canceled', to: 'appointments#canceled'
  get '/pets_appointments', to: 'appointments#pet_appointments'

  # Routing logic: fallback requests for React Router.
  # Leave this here to help deploy your app later!

  get "*path", to: "fallback#index", constraints: ->(req) { !req.xhr? && req.format.html? }
end
