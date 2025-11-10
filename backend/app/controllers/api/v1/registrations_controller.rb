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
        # Set a sensible default role for new signups
        user.role = "user"

        if user.save
          # Issue a JWT for the newly created user so the client can authenticate
          token = user.generate_jwt
          render json: {
            user: user_serialized(user),
            token: token,
            redirect_to: "/profile"
          }, status: :created
        else
          # Return validation errors to the client
          render json: { errors: user.errors.full_messages }, status: :unprocessable_content
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
    end
  end
end
