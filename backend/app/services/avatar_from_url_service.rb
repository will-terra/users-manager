# Service object to download an avatar image from a remote URL and
# attach it to a user's ActiveStorage `avatar` attachment.
#
# Usage:
# AvatarFromUrlService.new(user, url).call
#
# Notes / behavior:
# - If `url` is blank, the service is a no-op.
# - The remote resource is fetched via Net::HTTP. Only successful
#   HTTP responses (2xx) will be written to a tempfile and attached.
# - The downloaded file is written to a Tempfile (binary mode),
#   attached via `user.avatar.attach`, then the tempfile is closed
#   and unlinked to avoid leaving temporary files on disk.
# - Any exception during download/attach is caught and logged. The
#   service does not raise so callers can use it safely in background
#   jobs or controllers without crashing the request flow.
class AvatarFromUrlService
  # Initialize with the user (model instance that responds to `avatar`)
  # and the remote URL to download (string).
  def initialize(user, url)
    @user = user
    @url = url
  end

  # Perform the download and attach. Returns truthy when attachment
  # happened (response was successful), otherwise nil/false.
  def call
    # No-op if url is blank or nil
    return unless @url.present?

    begin
      # Parse the URL and perform an HTTP GET
      uri = URI.parse(@url)
      response = Net::HTTP.get_response(uri)

      # Only proceed on successful responses (HTTP 2xx)
      if response.is_a?(Net::HTTPSuccess)
        # Create a tempfile with the same extension as the remote path
        file = Tempfile.new([ "avatar", File.extname(uri.path) ])
        file.binmode
        file.write(response.body)
        file.rewind

        # Attach to the user's avatar (ActiveStorage). We provide the
        # IO, a filename, and the content type from the response so
        # ActiveStorage stores metadata properly.
        @user.avatar.attach(
          io: file,
          filename: File.basename(uri.path),
          content_type: response.content_type
        )

        # Clean up the tempfile: close and unlink removes it from disk
        file.close
        file.unlink
        true
      end
    rescue => e
      # Log the error for diagnostics but don't re-raise so callers can
      # continue (e.g., background job should not crash the whole run).
      Rails.logger.error "Error downloading avatar from URL: #{e.message}"
      nil
    end
  end
end
