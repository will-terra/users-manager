module Api
  module V1
    module Admin
      # Admin controller for managing users in the system
      # Provides CRUD operations and role management functionality
      # Requires admin authorization for all actions
      class UsersController < ApplicationController
        before_action :set_user, only: [ :show, :update, :destroy, :toggle_role ]

        # GET /api/v1/admin/users
        # Lists all users with pagination
        # Returns overview statistics when overview=true parameter is present
        def index
          authorize User

          users = policy_scope(User)
          users = UserSearchService.new(users, params).call
          users = users.order(created_at: :desc)
                       .page(params[:page])
                       .per(params[:per_page] || 20)

          if params[:overview] == "true"
            render_overview(users)
          else
            render json: {
              users: UserSerializer.new(users).serializable_hash,
              pagination: pagination_meta(users)
            }
          end
        end

        # GET /api/v1/admin/users/:id
        # Returns details for a specific user
        def show
          authorize @user
          render json: UserSerializer.new(@user).serializable_hash
        end

        # POST /api/v1/admin/users
        # Creates a new user (password is required)
        def create
          authorize User

          # Require password to be explicitly provided
          if admin_user_params[:password].blank?
            return render json: { errors: [ "Password is required" ] }, status: :unprocessable_content
          end

          user = User.new(admin_user_params)

          if user.save
            # UserMailer.with(user: user, temp_password: user.password).welcome_email.deliver_later
            render json: UserSerializer.new(user).serializable_hash, status: :created
          else
            render json: { errors: user.errors.full_messages }, status: :unprocessable_content
          end
        end

        # PATCH/PUT /api/v1/admin/users/:id
        # Updates user information (password is optional)
        def update
          authorize @user

          # Remove password fields if blank
          if admin_user_params[:password].blank?
            admin_user_params.delete(:password)
            admin_user_params.delete(:password_confirmation)
          end

          if @user.update(admin_user_params)
            render json: UserSerializer.new(@user).serializable_hash
          else
            render json: { errors: @user.errors.full_messages }, status: :unprocessable_content
          end
        end

        # DELETE /api/v1/admin/users/:id
        # Deletes a user (admins cannot delete themselves)
        def destroy
          authorize @user

          # Prevent admin from deleting themselves
          if @user == current_user
            render json: { errors: [ "You cannot delete your own account" ] }, status: :unprocessable_content
          else
            @user.destroy
            head :no_content
          end
        end

        # PATCH /api/v1/admin/users/:id/toggle_role
        # Toggles user role between 'admin' and 'user'
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

        # Finds and sets the user from the :id parameter
        def set_user
          @user = User.find(params[:id])
        end

        # Strong parameters for user creation/update
        def admin_user_params
          params.require(:user).permit(
            :full_name, :email, :role, :password, :password_confirmation,
            :avatar, :avatar_url
          )
        end

        # Renders user statistics overview (total users, admins, recent signups, etc.)
        def render_overview(users = policy_scope(User))
          overview = {
            total_users: users.count,
            admin_count: users.admins.count,
            user_count: users.users.count,
            recent_signups: users.where("created_at >= ?", 7.days.ago).count,
            active_today: users.where("last_sign_in_at >= ?", 1.day.ago).count
          }

          render json: { overview: overview }
        end

        # Generates pagination metadata for paginated collections
        def pagination_meta(collection)
          {
            current_page: collection.current_page,
            next_page: collection.next_page,
            prev_page: collection.prev_page,
            total_pages: collection.total_pages,
            total_count: collection.total_count,
            per_page: collection.limit_value
          }
        end
      end
    end
  end
end
