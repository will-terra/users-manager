import React, { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import "./Profile.scss";

export const Profile: React.FC = () => {
  const { currentUser, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: currentUser?.full_name || "",
    email: currentUser?.email || "",
    avatar: null as File | null,
    avatar_url: "",
    remove_avatar: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (currentUser && !isEditing) {
      setFormData({
        full_name: currentUser.full_name,
        email: currentUser.email,
        avatar: null,
        avatar_url: "",
        remove_avatar: false,
      });
    }
  }, [currentUser, isEditing]);

  if (!currentUser) {
    return <div className="loading">Loading...</div>;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, files } = e.target;

    if (name === "avatar" && files) {
      setFormData((prev) => ({ ...prev, avatar: files[0] }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const updateData = {
        full_name: formData.full_name,
        email: formData.email,
        avatar_url: formData.avatar_url,
        remove_avatar: formData.remove_avatar,
        ...(formData.avatar && { avatar: formData.avatar }),
      };
      await updateProfile(updateData);
      setSuccess("Profile updated successfully!");
      setIsEditing(false);
      setFormData({
        full_name: formData.full_name,
        email: formData.email,
        avatar: null,
        avatar_url: "",
        remove_avatar: false,
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      full_name: currentUser.full_name,
      email: currentUser.email,
      avatar: null,
      avatar_url: "",
      remove_avatar: false,
    });
    setError("");
  };

  const handleRemoveAvatar = () => {
    setFormData((prev) => ({ ...prev, remove_avatar: true }));
  };

  return (
    <div className="profile-page">
      <div className="profile-header">
        <h1>My Profile</h1>
        {!isEditing && (
          <button
            className="btn btn-primary"
            onClick={() => setIsEditing(true)}
          >
            Edit Profile
          </button>
        )}
      </div>

      {error && <div className="error-banner">{error}</div>}
      {success && <div className="success-banner">{success}</div>}

      <div className="profile-card">
        <div className="profile-avatar-section">
          {currentUser.has_avatar &&
          currentUser.avatar_urls &&
          !formData.remove_avatar ? (
            <img
              src={`http://localhost:3001${currentUser.avatar_urls.medium}`}
              className="profile-avatar"
            />
          ) : (
            <div className="profile-avatar-placeholder">
              {currentUser.full_name?.trim().charAt(0).toUpperCase() ?? ""}
            </div>
          )}

          {isEditing && (
            <div className="avatar-actions">
              <div className="form-group">
                <label htmlFor="avatar">Upload New Avatar</label>
                <input
                  type="file"
                  id="avatar"
                  name="avatar"
                  accept="image/*"
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label htmlFor="avatar_url">Or enter image URL</label>
                <input
                  type="url"
                  id="avatar_url"
                  name="avatar_url"
                  value={formData.avatar_url}
                  onChange={handleChange}
                  placeholder="https://example.com/avatar.jpg"
                />
              </div>
              {currentUser.has_avatar && (
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleRemoveAvatar}
                >
                  Remove Avatar
                </button>
              )}
            </div>
          )}
        </div>

        {isEditing ? (
          <form onSubmit={handleSubmit} className="profile-form">
            <div className="form-group">
              <label htmlFor="full_name">Full Name</label>
              <input
                type="text"
                id="full_name"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? "Saving..." : "Save Changes"}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleCancel}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="profile-info">
            <div className="info-item">
              <label>Full Name:</label>
              <span>{currentUser.full_name}</span>
            </div>
            <div className="info-item">
              <label>Email:</label>
              <span>{currentUser.email}</span>
            </div>
            <div className="info-item">
              <label>Role:</label>
              <span className={`role-badge ${currentUser.role}`}>
                {currentUser.role}
              </span>
            </div>
            <div className="info-item">
              <label>Member Since:</label>
              <span>
                {currentUser.created_at
                  ? new Date(currentUser.created_at).toLocaleDateString()
                  : "N/A"}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
