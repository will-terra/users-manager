class ApplicationController < ActionController::API
  # Include Pundit for authorization helpers and policies
  include Pundit::Authorization

  # Ensure requests are authenticated before any controller action runs.
  # authenticate_user! will set `@current_user` when a valid JWT is provided.
  before_action :authenticate_user!

  # After actions help enforce that controllers call Pundit authorization
  # methods. Use lambda-based conditionals to avoid Rails raising when a
  # controller doesn't implement the referenced action (Rails >= 7.1 will
  # raise for missing callback actions if configured to do so).
  # - `verify_authorized` should run for every action except `index`.
  # - `verify_policy_scoped` should run only for `index` actions.
  after_action :verify_authorized, unless: -> { action_name == "index" || pundit_skipped? }
  after_action :verify_policy_scoped, if: -> { action_name == "index" && !pundit_skipped? }

  # Map common exceptions to JSON error responses with appropriate HTTP
  # statuses so API clients get consistent error shapes.
  rescue_from Pundit::NotAuthorizedError, with: :user_not_authorized
  rescue_from ActiveRecord::RecordNotFound, with: :record_not_found

  private

  # Track whether Pundit verification should be skipped. Subclasses
  # (e.g. public authentication controllers) call `pundit_skip!` to set this.
  def pundit_skipped?
    @pundit_skipped == true
  end

  # Mark this controller as having Pundit verification explicitly skipped
  # (for public endpoints like login/registration).
  def pundit_skip!
    @pundit_skipped = true
  end

  # Authenticate the request using a Bearer JWT sent in the
  # `Authorization` header. If present, the token is decoded using the
  # secret key stored in Rails credentials (`config/credentials.yml.enc`)
  # under `devise_jwt_secret_key` and the corresponding
  # User is loaded into `@current_user`.
  #
  # Responses:
  # - 200 (implicit) when @current_user is set and the request continues
  # - 401 with { errors: ['Invalid token'] } when the token is invalid or
  #   the user cannot be found
  # - 401 with { errors: ['Not authenticated'] } when no Authorization
  #   header is provided
  def authenticate_user!
    header = request.headers["Authorization"]
    header = header.split(" ").last if header

    if header
      begin
  # Decode JWT and find the user by id inside the token payload.
  # Use the secret from Rails credentials; fall back to ENV if needed.
  secret = Rails.application.credentials.devise_jwt_secret_key || ENV["DEVISE_JWT_SECRET_KEY"]
  decoded = JWT.decode(header, secret, true, { algorithm: "HS256" })
        @current_user = User.find(decoded[0]["id"])
      rescue JWT::DecodeError, ActiveRecord::RecordNotFound
        # Token was invalid or the referenced user does not exist
        render json: { errors: [ "Invalid token" ] }, status: :unauthorized
      end
    else
      # No Authorization header present
      render json: { errors: [ "Not authenticated" ] }, status: :unauthorized
    end
  end

  # Returns the currently authenticated user (if any).
  def current_user
    @current_user
  end

  # Render a consistent JSON response for authorization failures.
  def user_not_authorized
    render json: { errors: [ "Not authorized" ] }, status: :forbidden
  end

  # Render a consistent JSON response for ActiveRecord::RecordNotFound.
  def record_not_found
    render json: { errors: [ "Record not found" ] }, status: :not_found
  end
end
