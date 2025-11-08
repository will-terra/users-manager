Rails.application.routes.draw do
  devise_for :users # Devise authentication endpoints

  # Simple health check for uptime monitoring
  get "up" => "rails/health#show", as: :rails_health_check

  namespace :api do
    namespace :v1 do
      # Authentication endpoints (JWT sessions & registration)
      post "sign_in",  to: "sessions#create"
      delete "sign_out", to: "sessions#destroy"
      post "sign_up",  to: "registrations#create"

      # Regular user-facing operations
      resources :users, only: [ :index, :show, :update, :destroy ] do
        member do
          patch :toggle_role # Allow role toggle (may be restricted by policy)
        end
        collection do
          get :profile # Current user profile summary
        end
      end

      # Administrative endpoints
      namespace :admin do
        resources :users, only: [ :index, :show, :create, :update, :destroy ] do
          member do
            patch :toggle_role # Admin toggles another user's role
          end
          collection do
            get :overview # Aggregated overview of users
          end
        end
        get "stats", to: "stats#index" # System or usage statistics
        resources :imports, only: [ :create, :index, :show ] # Data import jobs
      end
    end
  end
end
