module Api
  module V1
    # Controller responsible for user registration (sign up).
    #
    # - `create` registers a new user, assigns a default role, issues a JWT,
    #   and returns the serialized user plus token on success.
    # - Uses strong parameters to permit only the expected attributes.
    class RegistrationsController < BaseController
      # Allow unauthenticated access to registration
      skip_before_action :authenticate_user_from_token!, only: [ :create ]

      before_action :pundit_skip!

      # POST /api/v1/registrations
      # Params: { user: { full_name, email, password, password_confirmation } }
      # On success returns: { user: { ... }, token: 'jwt', redirect_to: '/profile' }
      def create
        user = User.new(registration_params)
        # Set role: first user is admin, others are user
        user.role = User.exists? ? "user" : "admin"

        if user.save
          # Issue a JWT for the newly created user so the client can authenticate
          token = user.generate_jwt

          # Use the same success response shape as SessionsController so the
          # frontend (which expects { data: { user, token, redirect_to } })
          # can immediately set the token and navigate.
          render_success(
            {
              user: user_serialized(user),
              token: token,
              redirect_to: redirect_path(user)
            },
            status: :created
          )
        else
          # Return structured validation errors using the BaseController helper
          render_validation_errors(user)
        end
      end

      private

      # Strong parameters for registration
      def registration_params
        params.require(:user).permit(:full_name, :email, :password, :password_confirmation)
      end

      # Serialize user data for the response
      def user_serialized(user)
        UserSerializer.new(user).serializable_hash[:data][:attributes]
      end

      # Choose a redirect path based on user role. Mirrors SessionsController.
      def redirect_path(user)
        user.admin? ? "/admin/dashboard" : "/profile"
      end
    end
  end
end
