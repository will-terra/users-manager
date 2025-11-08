class User < ApplicationRecord
  # User model
  # - Handles authentication via Devise (including JWT handling)
  # - Stores a single attached avatar and supports downloading via an URL
  # - Tracks simple roles (admin, user) and broadcasts app-wide stats when
  #   user records change

  # Devise modules enabled for this app. jwt_revocation_strategy uses the
  # `JWTBlacklist` model to handle revoked tokens.
  devise :database_authenticatable,
         :recoverable, :rememberable, :validatable,
         :trackable, :jwt_authenticatable,
         jwt_revocation_strategy: JWTBlacklist

  # Supported roles for authorization checks
  ROLES = %w[admin user].freeze

  # Basic attribute validations
  validates :full_name, presence: true, length: { minimum: 2, maximum: 100 }
  validates :email, presence: true,
                    format: { with: URI::MailTo::EMAIL_REGEXP },
                    uniqueness: { case_sensitive: false }
  validates :role, presence: true, inclusion: { in: ROLES }

  # Active Storage attachment for a user's avatar
  has_one_attached :avatar

  # Virtual attribute used to provide an avatar URL which will be downloaded
  # after save when present.
  attr_accessor :avatar_url

  # If `avatar_url` is set, download and attach the file after saving the
  # record.
  after_save :download_avatar_from_url, if: -> { avatar_url.present? }

  # Broadcast stats updates whenever users change in ways the frontend cares
  # about (create, destroy, or role changes).
  after_create :broadcast_stats_update
  after_update :broadcast_stats_update, if: -> { saved_change_to_role? }
  after_destroy :broadcast_stats_update

  # Custom validations for the attached avatar
  validate :avatar_content_type
  validate :avatar_size

  # Convenience scopes for querying by role
  scope :admins, -> { where(role: "admin") }
  scope :users, -> { where(role: "user") }

  # Role predicate helpers used throughout the app/policies
  def admin?
    role == "admin"
  end

  def user?
    role == "user"
  end

  # Generate a simple JWT for the user. This duplicates Devise JWT behavior
  # in places where an explicit token is required (e.g. API responses).
  def generate_jwt
    JWT.encode(
      {
        id: id,
        exp: 7.days.from_now.to_i,
        email: email,
        role: role
      },
      Rails.application.credentials.devise_jwt_secret_key
    )
  end

  private

  # Validate avatar MIME type
  def avatar_content_type
    return unless avatar.attached?

    unless avatar.content_type.in?(%w[image/jpeg image/png image/gif])
      errors.add(:avatar, "must be a JPEG, PNG, or GIF image")
    end
  end

  # Validate avatar file size (limit to 5 MB)
  def avatar_size
    return unless avatar.attached?

    if avatar.blob.byte_size > 5.megabytes
      errors.add(:avatar, "should be less than 5MB")
    end
  end

  # Use the AvatarFromUrlService to fetch and attach an avatar from a URL
  def download_avatar_from_url
    AvatarFromUrlService.new(self, avatar_url).call
  end

  # Queue a job to broadcast updated user stats to admin dashboards/clients
  def broadcast_stats_update
    StatsBroadcastJob.perform_later
  end
end
