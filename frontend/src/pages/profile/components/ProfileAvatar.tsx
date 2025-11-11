import React from "react";
import type { User } from "../../../types/user";
import "./ProfileAvatar.scss";

interface ProfileAvatarProps {
  user: User;
  removeAvatar: boolean;
}

export const ProfileAvatar: React.FC<ProfileAvatarProps> = ({
  user,
  removeAvatar,
}) => {
  const apiBaseUrl = "http://localhost:3001";

  const showAvatar = user.has_avatar && user.avatar_urls && !removeAvatar;
  const initials = user.full_name?.trim().charAt(0).toUpperCase() || "?";

  return (
    <div className="profile-avatar-section">
      {showAvatar && user.avatar_urls ? (
        <img
          src={`${apiBaseUrl}${user.avatar_urls.medium}`}
          alt={`${user.full_name}'s avatar`}
          className="profile-avatar"
          loading="lazy"
        />
      ) : (
        <div
          className="profile-avatar-placeholder"
          role="img"
          aria-label={`${user.full_name}'s placeholder avatar with initial ${initials}`}
        >
          {initials}
        </div>
      )}
    </div>
  );
};
