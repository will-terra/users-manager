import React from "react";
import { useAuth } from "../../hooks/useAuth";
import "./Header.scss";

export const Header: React.FC = () => {
  const { currentUser, logout } = useAuth();

  return (
    <header className="header">
      <div className="header-brand">
        <h1>Users Manager</h1>
      </div>

      <div className="header-actions">
        {currentUser && (
          <div className="user-menu">
            <span className="user-greeting">
              Hello, {currentUser.full_name}
            </span>
            <button onClick={logout} className="logout-btn">
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
