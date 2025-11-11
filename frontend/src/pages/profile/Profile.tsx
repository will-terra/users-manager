import React from "react";
import { NotificationBanner } from "../../components/NotificationBanner";
import { useAuth } from "../../hooks/useAuth";
import { useProfileForm } from "../../hooks/useProfileForm";
import { ProfileAvatar } from "./components/ProfileAvatar";
import { ProfileForm } from "./components/ProfileForm";
import { ProfileInfo } from "./components/ProfileInfo";
import "./Profile.scss";

export const Profile: React.FC = () => {
  const {
    currentUser,
    updateProfile,
    globalError,
    globalSuccess,
    setGlobalError,
    setGlobalSuccess,
    clearNotifications,
  } = useAuth();

  const {
    isEditing,
    formData,
    loading,
    localError,
    setIsEditing,
    handleChange,
    handleSubmit,
    handleCancel,
    handleRemoveAvatar,
  } = useProfileForm({
    currentUser,
    updateProfile,
    onSuccess: () => {
      setGlobalSuccess("Profile updated successfully!");
      setIsEditing(false);
    },
    onError: (error: string) => {
      setGlobalError(error);
    },
  });

  if (!currentUser) {
    return (
      <div className="profile-page">
        <div className="loading" role="status" aria-live="polite">
          Loading profile...
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <header className="profile-header">
        <h1>My Profile</h1>
        {!isEditing && (
          <button
            className="btn btn-primary"
            onClick={() => {
              clearNotifications();
              setIsEditing(true);
            }}
            aria-label="Edit profile"
          >
            Edit Profile
          </button>
        )}
      </header>

      <NotificationBanner
        error={globalError || localError}
        success={globalSuccess}
        onDismiss={clearNotifications}
      />

      <div className="profile-card">
        <ProfileAvatar
          user={currentUser}
          removeAvatar={formData.remove_avatar}
        />

        {isEditing ? (
          <ProfileForm
            formData={formData}
            currentUser={currentUser}
            loading={loading}
            onChange={handleChange}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            onRemoveAvatar={handleRemoveAvatar}
          />
        ) : (
          <ProfileInfo user={currentUser} />
        )}
      </div>
    </div>
  );
};
