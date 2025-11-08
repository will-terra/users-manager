class User < ApplicationRecord
  # Devise modules
  devise :database_authenticatable,
         :recoverable, :rememberable, :validatable,
         :trackable, :jwt_authenticatable,
         jwt_revocation_strategy: JWTBlacklist

  # Constants
  ROLES = %w[admin user].freeze

  # Validations
  validates :full_name, presence: true, length: { minimum: 2, maximum: 100 }
  validates :email, presence: true,
                    format: { with: URI::MailTo::EMAIL_REGEXP },
                    uniqueness: { case_sensitive: false }
  validates :role, presence: true, inclusion: { in: ROLES }

  # Active Storage
  has_one_attached :avatar

  # Avatar validations
  validate :avatar_content_type
  validate :avatar_size

  # Scopes
  scope :admins, -> { where(role: "admin") }
  scope :users, -> { where(role: "user") }

  # Instance methods
  def admin?
    role == "admin"
  end

  def user?
    role == "user"
  end

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

  def avatar_content_type
    return unless avatar.attached?

    unless avatar.content_type.in?(%w[image/jpeg image/png image/gif])
      errors.add(:avatar, "must be a JPEG, PNG, or GIF image")
    end
  end

  def avatar_size
    return unless avatar.attached?

    if avatar.blob.byte_size > 5.megabytes
      errors.add(:avatar, "should be less than 5MB")
    end
  end
end
