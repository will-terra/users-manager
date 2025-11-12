import React from "react";
import { useAdminStats } from "../../hooks/useAdminStats";
import { useAuth } from "../../hooks/useAuth";
import { RealTimeIndicators } from "./components/RealTimeIndicators";
import { StatsCards } from "./components/StatsCards";
import "./Dashboard.scss";

export const AdminDashboard: React.FC = () => {
  const { token } = useAuth();
  const { stats, loading, error, refreshStats } = useAdminStats(token || "");

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>Admin Dashboard</h1>
      </div>
      <RealTimeIndicators />
      {error && (
        <div className="error-banner">
          {error.message} <button onClick={refreshStats}>Try Again</button>
        </div>
      )}
      <StatsCards stats={stats} loading={loading} />
    </div>
  );
};
