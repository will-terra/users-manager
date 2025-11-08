module Api
  module V1
    # Controller responsible for user sessions (login/logout) using JWTs.
    #
    # - `create` authenticates a user and returns a JWT token plus basic user
    #   attributes on success.
    # - `destroy` is a no-op for stateless JWTs (clients discard the token).
    class SessionsController < ApplicationController
      # Skip Pundit authorization checks since these endpoints don't call
      # `authorize` or `policy_scope`. Login/logout are public actions that
      # don't need Pundit verification.
      skip_before_action :verify_authorized, raise: false
      skip_before_action :verify_policy_scoped, raise: false
      before_action :pundit_skip!

      # Allow unauthenticated access to login
      skip_before_action :authenticate_user!, only: [ :create ]

      # POST /api/v1/sessions
      # Params: { user: { email: string, password: string } }
      # On success returns: { user: { ... }, token: 'jwt', redirect_to: '/path' }
      def create
        # Find the user by email (Devise helper)
        user = User.find_for_database_authentication(email: session_params[:email])

        # Verify password and, if valid, issue a JWT for client use
        if user&.valid_password?(session_params[:password])
          token = user.generate_jwt
          render json: {
            user: UserSerializer.new(user).serializable_hash[:data][:attributes],
            token: token,
            redirect_to: redirect_path(user)
          }, status: :created
        else
          # Generic error to avoid leaking whether email exists
          render json: { errors: [ "Invalid email or password" ] }, status: :unauthorized
        end
      end

      # DELETE /api/v1/sessions
      # For stateless JWT authentication, logout is normally handled on the
      # client by deleting the stored token. If you need server-side
      # invalidation (a token blacklist), implement that logic here (e.g.
      # create a blacklist record for the token or its jti claim).
      def destroy
        head :no_content
      end

      private

      # Strong parameters for the session endpoints
      def session_params
        params.require(:user).permit(:email, :password)
      end

      # Choose a redirect path based on user role. This is returned in the
      # JSON response so the frontend can navigate appropriately after login.
      def redirect_path(user)
        user.admin? ? "/admin/dashboard" : "/profile"
      end
    end
  end
end
