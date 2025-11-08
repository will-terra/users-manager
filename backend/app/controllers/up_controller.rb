# Health check endpoint for monitoring service availability
class UpController < ApplicationController
  # Allow public access without authentication
  skip_before_action :authenticate_user!

  # Returns service status with timestamp and environment
  def index
    render json: {
      status: "OK",
      timestamp: Time.current.iso8601,
      environment: Rails.env
    }
  end
end
