module Api
  module V1
    # Controller responsible for user registration (sign up).
    #
    # - `create` registers a new user, assigns a default role, issues a JWT,
    #   and returns the serialized user plus token on success.
    # - Uses strong parameters to permit only the expected attributes.
    class RegistrationsController < ApplicationController
      # Skip Pundit authorization checks since registration is a public,
      # unauthenticated endpoint that doesn't call `authorize` or `policy_scope`.
      skip_before_action :verify_authorized, raise: false
      skip_before_action :verify_policy_scoped, raise: false
      before_action :pundit_skip!

      # Allow unauthenticated access to registration
      skip_before_action :authenticate_user!, only: [ :create ]

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
            user: UserSerializer.new(user).serializable_hash[:data][:attributes],
            token: token,
            redirect_to: "/profile"
          }, status: :created
        else
          # Return validation errors to the client
          render json: { errors: user.errors.full_messages }, status: :unprocessable_entity
        end
      end

      private

      # Strong parameters for registration
      def registration_params
        params.require(:user).permit(:full_name, :email, :password, :password_confirmation)
      end
    end
  end
end
