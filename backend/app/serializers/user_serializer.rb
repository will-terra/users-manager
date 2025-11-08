class UserSerializer
  include JSONAPI::Serializer

  # Public attributes returned to the API consumer. Keep this list minimal
  # — include only the fields the frontend needs to render a user or make
  # authorization decisions.
  attributes :id, :full_name, :email, :role, :created_at, :updated_at

  # Returns a URL to the user's avatar if one is attached. The helper uses
  # `only_path: true` so the frontend can prepend a hostname if necessary
  # (useful in different environments). If no avatar is attached this
  # attribute will be nil and omitted from the JSON output.
  attribute :avatar_url do |user|
    if user.avatar.attached?
      Rails.application.routes.url_helpers.rails_blob_url(user.avatar, only_path: true)
    end
  end
end
