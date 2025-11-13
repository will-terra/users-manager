import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import "./Sidebar.scss";

export const Sidebar: React.FC = () => {
  const { currentUser } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const navItems = [{ path: "/profile", label: "My Profile", icon: "👤" }];

  const adminNavItems =
    currentUser?.role === "admin"
      ? [
          { path: "/admin/dashboard", label: "Dashboard", icon: "📊" },
          { path: "/admin/users", label: "Users", icon: "👥" },
          { path: "/admin/imports", label: "Imports", icon: "📥" },
        ]
      : [];

  return (
    <nav className="sidebar">
      <ul className="nav-list">
        {navItems.map((item) => (
          <li key={item.path}>
            <Link
              to={item.path}
              className={`nav-link ${isActive(item.path) ? "active" : ""}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </Link>
          </li>
        ))}

        {adminNavItems.length > 0 && (
          <>
            <li className="nav-divider">Administration</li>
            {adminNavItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`nav-link ${isActive(item.path) ? "active" : ""}`}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-label">{item.label}</span>
                </Link>
              </li>
            ))}
          </>
        )}
      </ul>
    </nav>
  );
};
