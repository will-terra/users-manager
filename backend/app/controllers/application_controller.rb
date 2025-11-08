class ApplicationController < ActionController::API
  include Pundit::Authorization

  before_action :authenticate_user!
  after_action :verify_authorized, except: :index
  after_action :verify_policy_scoped, only: :index

  rescue_from Pundit::NotAuthorizedError, with: :user_not_authorized
  rescue_from ActiveRecord::RecordNotFound, with: :record_not_found

  private

  def authenticate_user!
    header = request.headers["Authorization"]
    header = header.split(" ").last if header

    if header
      begin
        @current_user = User.find_by(id: decoded_token[:id]) if decoded_token
      rescue JWT::DecodeError => e
        render json: { errors: [ "Invalid token" ] }, status: :unauthorized
      end
    end

    render json: { errors: [ "Not authenticated" ] }, status: :unauthorized unless @current_user
  end

  def current_user
    @current_user
  end

  def decoded_token
    header = request.headers["Authorization"]
    header = header.split(" ").last if header

    return unless header

    @decoded_token ||= JWT.decode(
      header,
      Rails.application.credentials.devise_jwt_secret_key,
      true,
      { algorithm: "HS256" }
    ).first.with_indifferent_access
  end

  def user_not_authorized
    render json: { errors: [ "Not authorized" ] }, status: :forbidden
  end

  def record_not_found
    render json: { errors: [ "Record not found" ] }, status: :not_found
  end
end
