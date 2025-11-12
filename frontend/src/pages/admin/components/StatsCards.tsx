import React from "react";
import type { AdminStats } from "../../../types/api";
import "./StatsCards.scss";

interface StatsCardsProps {
  stats: AdminStats | null;
  loading: boolean;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ stats, loading }) => {
  if (loading) {
    return (
      <div className="stats-cards loading">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="stat-card skeleton"></div>
        ))}
      </div>
    );
  }

  if (!stats) {
    return <div className="stats-cards error">No stats available</div>;
  }

  return (
    <div className="stats-cards">
      <div className="stat-card primary">
        <div className="stat-value">{stats.total_users}</div>
        <div className="stat-label">Total Users</div>
        <div className="stat-trend">All Time</div>
      </div>

      <div className="stat-card success">
        <div className="stat-value">{stats.admin_count}</div>
        <div className="stat-label">Administrators</div>
        <div className="stat-trend">System Roles</div>
      </div>

      <div className="stat-card info">
        <div className="stat-value">{stats.user_count}</div>
        <div className="stat-label">Regular Users</div>
        <div className="stat-trend">Standard Accounts</div>
      </div>

      <div className="stat-card warning">
        <div className="stat-value">{stats.recent_signups}</div>
        <div className="stat-label">Recent Signups</div>
        <div className="stat-trend">Last 7 Days</div>
      </div>

      <div className="stat-card danger">
        <div className="stat-value">{stats.active_today}</div>
        <div className="stat-label">Active Today</div>
        <div className="stat-trend">Daily Activity</div>
      </div>
    </div>
  );
};
