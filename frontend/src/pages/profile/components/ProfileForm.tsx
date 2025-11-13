import React from "react";
import type { ProfileFormData } from "../../../types/profile";
import type { User } from "../../../types/user";
import "./ProfileForm.scss";

interface ProfileFormProps {
  formData: ProfileFormData;
  currentUser: User;
  loading: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  onRemoveAvatar: () => void;
}

export const ProfileForm: React.FC<ProfileFormProps> = ({
  formData,
  currentUser,
  loading,
  onChange,
  onSubmit,
  onCancel,
  onRemoveAvatar,
}) => {
  return (
    <form onSubmit={onSubmit} className="profile-form" noValidate>
      <div className="form-group">
        <label htmlFor="avatar">Upload New Avatar</label>
        <input
          type="file"
          id="avatar"
          name="avatar"
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={onChange}
          disabled={loading}
          aria-describedby="avatar-help"
        />
        <small id="avatar-help" className="form-text">
          Accepted formats: JPEG, PNG, GIF, WebP. Maximum size: 5MB.
        </small>
      </div>

      <div className="form-group">
        <label htmlFor="avatar_url">Or Enter Image URL</label>
        <input
          type="url"
          id="avatar_url"
          name="avatar_url"
          value={formData.avatar_url}
          onChange={onChange}
          placeholder="https://example.com/avatar.jpg"
          disabled={loading}
          aria-describedby="avatar-url-help"
        />
        <small id="avatar-url-help" className="form-text">
          Provide a direct link to an image file.
        </small>
      </div>

      {currentUser.has_avatar && !formData.remove_avatar && (
        <button
          type="button"
          className="btn btn-danger"
          onClick={onRemoveAvatar}
          disabled={loading}
          aria-label="Remove current avatar"
        >
          Remove Avatar
        </button>
      )}

      {formData.remove_avatar && (
        <p className="text-warning" role="alert">
          Avatar will be removed when you save changes.
        </p>
      )}

      <div className="form-group">
        <label htmlFor="full_name">
          Full Name{" "}
          <span className="required" aria-label="required">
            *
          </span>
        </label>
        <input
          type="text"
          id="full_name"
          name="full_name"
          value={formData.full_name}
          onChange={onChange}
          required
          minLength={2}
          maxLength={100}
          disabled={loading}
          aria-required="true"
        />
      </div>

      <div className="form-group password-section">
        <label>Change Password (Optional)</label>
        <p className="form-text">
          Leave blank if you don't want to change your password.
        </p>

        <div className="form-group">
          <label htmlFor="current_password">Current Password</label>
          <input
            type="password"
            id="current_password"
            name="current_password"
            value={formData.current_password}
            onChange={onChange}
            disabled={loading}
            autoComplete="current-password"
            aria-describedby="current-password-help"
          />
          <small id="current-password-help" className="form-text">
            Required only if changing password.
          </small>
        </div>

        <div className="form-group">
          <label htmlFor="password">New Password</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={onChange}
            minLength={6}
            disabled={loading}
            autoComplete="new-password"
            aria-describedby="password-help"
          />
        </div>

        <div className="form-group">
          <label htmlFor="password_confirmation">Confirm New Password</label>
          <input
            type="password"
            id="password_confirmation"
            name="password_confirmation"
            value={formData.password_confirmation}
            onChange={onChange}
            minLength={6}
            disabled={loading}
            autoComplete="new-password"
            aria-describedby="password-confirmation-help"
          />
          <small id="password-confirmation-help" className="form-text">
            Must match new password.
          </small>
        </div>
      </div>

      <div className="form-actions">
        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading}
          aria-busy={loading}
        >
          {loading ? "Saving..." : "Save Changes"}
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </button>
      </div>
    </form>
  );
};
