import React from "react";
import { useAdminStats } from "../../hooks/queries";
import { RealTimeIndicators } from "./components/RealTimeIndicators";
import { StatsCards } from "./components/StatsCards";
import "./Dashboard.scss";

export const AdminDashboard: React.FC = () => {
  const { data, isLoading, error, refetch } = useAdminStats();

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>Admin Dashboard</h1>
      </div>
      <RealTimeIndicators />
      {error && (
        <div className="error-banner">
          {error.message} <button onClick={() => refetch()}>Try Again</button>
        </div>
      )}
      <StatsCards stats={data?.stats ?? null} loading={isLoading} />
    </div>
  );
};
