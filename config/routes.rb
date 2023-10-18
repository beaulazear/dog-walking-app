Rails.application.routes.draw do
  
  resources :invoices
  resources :appointments
  resources :pets
  resources :users

  get "/me", to: "users#show"
  
  post "/login", to: "sessions#create"
  delete "/logout", to: "sessions#destroy"

  get "/invoices/:id/paid", to: "invoices#paid"

  get '/appointments/:id/canceled', to: 'appointments#canceled'

  # Routing logic: fallback requests for React Router.
  # Leave this here to help deploy your app later!

  get "*path", to: "fallback#index", constraints: ->(req) { !req.xhr? && req.format.html? }
end
