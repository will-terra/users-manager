class User < ApplicationRecord
  # User model
  #
  # Responsibilities:
  # - Authenticate using Devise (database + JWT)
  # - Store profile information (full_name, email, role)
  # - Provide an attachable avatar via Active Storage
  # - Validate attributes and provide a small set of helper predicates
  #
  # Notes:
  # - JWT tokens are produced with `generate_jwt` and use the application's
  #   `devise_jwt_secret_key` from credentials.
  # - `avatar_url` is a virtual attribute: when set, the `after_save` callback
  #   will fetch the image via `AvatarFromUrlService` and attach it to `avatar`.

  # Devise modules (authentication, recoverable, rememberable, validations,
  # tracking, and JWT support). JWT revocation is handled by `JWTBlacklist`.
  devise :database_authenticatable,
         :recoverable, :rememberable, :validatable,
         :trackable, :jwt_authenticatable,
         jwt_revocation_strategy: JWTBlacklist

  # Allowed roles for authorization checks
  ROLES = %w[admin user].freeze

  # ----------------
  # Validations
  # ----------------
  validates :full_name, presence: true, length: { minimum: 2, maximum: 100 }
  validates :email, presence: true,
                    format: { with: URI::MailTo::EMAIL_REGEXP },
                    uniqueness: { case_sensitive: false }
  validates :role, presence: true, inclusion: { in: ROLES }

  # ----------------
  # Active Storage
  # ----------------
  # Stores a single avatar attachment for the user
  has_one_attached :avatar

  # Virtual attribute used to provide a URL for the avatar. When present,
  # the `after_save` callback will attempt to download and attach the image.
  attr_accessor :avatar_url

  # If an external avatar URL is provided, download it after save.
  after_save :download_avatar_from_url, if: -> { avatar_url.present? }

  # ----------------
  # Custom avatar validations
  # ----------------
  # Ensure attached avatars are an allowed image type and within size limits.
  validate :avatar_content_type
  validate :avatar_size

  # ----------------
  # Scopes
  # ----------------
  scope :admins, -> { where(role: "admin") }
  scope :users, -> { where(role: "user") }

  # ----------------
  # Public instance helpers
  # ----------------
  # Predicate helpers for role checks used throughout the app and policies.
  def admin?
    role == "admin"
  end

  def user?
    role == "user"
  end

  # Generate a JSON Web Token that encodes the user's id, email and role.
  # Expiration is set to 7 days from issuance. Uses the app credential key.
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

  # Validate that the attached avatar is an accepted MIME type.
  def avatar_content_type
    return unless avatar.attached?

    unless avatar.content_type.in?(%w[image/jpeg image/png image/gif])
      errors.add(:avatar, "must be a JPEG, PNG, or GIF image")
    end
  end

  # Validate the attachment size to avoid very large uploads.
  def avatar_size
    return unless avatar.attached?

    if avatar.blob.byte_size > 5.megabytes
      errors.add(:avatar, "should be less than 5MB")
    end
  end

  # Delegate avatar download to a service object. Keeping this logic out of
  # the model keeps the model focused and makes the service easy to test.
  def download_avatar_from_url
    AvatarFromUrlService.new(self, avatar_url).call
  end
end
