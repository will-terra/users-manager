import React from "react";
import type { User } from "../../../types/user";
import "./ProfileInfo.scss";

interface ProfileInfoProps {
  user: User;
}

export const ProfileInfo: React.FC<ProfileInfoProps> = ({ user }) => {
  const formatDate = (dateString?: string): string => {
    if (!dateString) return "N/A";

    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return "Invalid date";
    }
  };

  return (
    <dl className="profile-info">
      <div className="info-item">
        <dt>Full Name:</dt>
        <dd>{user.full_name}</dd>
      </div>

      <div className="info-item">
        <dt>Email:</dt>
        <dd>{user.email}</dd>
      </div>

      <div className="info-item">
        <dt>Role:</dt>
        <dd>
          <span
            className={`role-badge ${user.role}`}
            role="status"
            aria-label={`User role: ${user.role}`}
          >
            {user.role}
          </span>
        </dd>
      </div>

      <div className="info-item">
        <dt>Member Since:</dt>
        <dd>
          <time dateTime={user.created_at}>{formatDate(user.created_at)}</time>
        </dd>
      </div>
    </dl>
  );
};
