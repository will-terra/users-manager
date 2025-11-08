Rails.application.routes.draw do
  devise_for :users
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  # Defines the root path route ("/")
  # root "posts#index"

  # API namespace (versioned)
  # We expose a JSON API under /api/v1. Versioning allows us to introduce
  # breaking changes in the future without disrupting existing clients.
  namespace :api do
    namespace :v1 do
      # Authentication routes (public)
      # - POST /api/v1/sign_in  => sessions#create  (login, returns JWT)
      # - DELETE /api/v1/sign_out => sessions#destroy (logout — client should drop token)
      # - POST /api/v1/sign_up  => registrations#create (create account and return token)
      post "sign_in", to: "sessions#create"
      delete "sign_out", to: "sessions#destroy"
      post "sign_up", to: "registrations#create"

      # User management endpoints (protected by authentication middleware)
      # - index/show/update/destroy for allowed operations
      # - member route `toggle_role` for changing a user's role (admin-only in policy)
      # - collection route `profile` to fetch the current user's profile
      resources :users, only: [ :index, :show, :update, :destroy ] do
        member do
          patch :toggle_role
        end
        collection do
          get :profile
        end
      end

      # Admin namespace for admin-specific operations. Controllers here
      # should enforce admin-only access via policies or before_actions.
      namespace :admin do
        # Typical CRUD for user management by admins
        resources :users, only: [ :index, :show, :create, :update, :destroy ]

        # Admin-level statistics endpoint
        get "stats", to: "stats#index"

        # Import-related endpoints (e.g., CSV imports)
        resources :imports, only: [ :create, :index, :show ]
      end
    end
  end
end
