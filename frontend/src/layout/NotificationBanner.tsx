import React from "react";

interface NotificationBannerProps {
  error?: string | null;
  success?: string | null;
  onDismiss?: () => void;
}

export const NotificationBanner: React.FC<NotificationBannerProps> = ({
  error,
  success,
  onDismiss,
}) => {
  if (!error && !success) return null;

  return (
    <div className="notification-container">
      {error && (
        <div className="error-banner" role="alert" aria-live="assertive">
          <span>{error}</span>
          {onDismiss && (
            <button
              type="button"
              className="dismiss-btn"
              onClick={onDismiss}
              aria-label="Dismiss error message"
            >
              ×
            </button>
          )}
        </div>
      )}

      {success && (
        <div className="success-banner" role="status" aria-live="polite">
          <span>{success}</span>
          {onDismiss && (
            <button
              type="button"
              className="dismiss-btn"
              onClick={onDismiss}
              aria-label="Dismiss success message"
            >
              ×
            </button>
          )}
        </div>
      )}
    </div>
  );
};
