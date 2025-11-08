module Api
  module V1
    # Controller for managing users via the JSON API.
    #
    # Responsibilities:
    # - List, show, update and destroy users (actions protected by Pundit)
    # - Provide a `profile` endpoint that returns the current user's data
    # - Allow role toggling via `toggle_role` (authorization checked separately)
    class UsersController < ApplicationController
      # Load the target user for actions that operate on a specific record
      before_action :set_user, only: [ :show, :update, :destroy, :toggle_role ]

      # GET /api/v1/users
      # Requires authorization; returns a collection scoped by Pundit policies
      def index
        authorize User
        users = policy_scope(User)
        render json: UserSerializer.new(users).serializable_hash
      end

      # GET /api/v1/users/:id
      # Returns a single user (authorization enforced)
      def show
        authorize @user
        render json: UserSerializer.new(@user).serializable_hash
      end

      # GET /api/v1/users/profile
      # Convenience endpoint that returns the currently authenticated user's data
      def profile
          # Authorize the current user using the existing `show?` policy method
          # (Pundit will call `UserPolicy#show?`). This satisfies the
          # `verify_authorized` after_action check without needing a custom
          # `profile?` policy method.
          authorize current_user, :show?
          render json: UserSerializer.new(current_user).serializable_hash
      end

      # PATCH/PUT /api/v1/users/:id
      # Updates attributes permitted by `user_params`. Authorization is enforced.
      def update
        authorize @user
        if @user.update(user_params)
          render json: UserSerializer.new(@user).serializable_hash
        else
          render json: { errors: @user.errors.full_messages }, status: :unprocessable_content
        end
      end

      # DELETE /api/v1/users/:id
      # Destroys the user record. Controllers should ensure only authorized
      # actors (e.g., admins or the user themself) can perform this action.
      def destroy
        authorize @user
        @user.destroy
        head :no_content
      end

      # PATCH /api/v1/users/:id/toggle_role
      # Toggles between 'admin' and 'user' roles for the target user. This
      # action invokes a Pundit check for `toggle_role?` to ensure only
      # permitted actors can change roles.
      def toggle_role
        authorize @user, :toggle_role?
        new_role = @user.admin? ? "user" : "admin"
        if @user.update(role: new_role)
          render json: UserSerializer.new(@user).serializable_hash
        else
          render json: { errors: @user.errors.full_messages }, status: :unprocessable_content
        end
      end

      private

      # Find and assign the user for member actions
      def set_user
        @user = User.find(params[:id])
      end

      # Strong parameters for updates. Only allow attributes that should be
      # mutable by API clients. `avatar` expects an uploaded file; `avatar_url`
      # can be used by clients to point to remote avatars if supported.
      def user_params
        params.require(:user).permit(:full_name, :email, :avatar, :avatar_url)
      end
    end
  end
end
