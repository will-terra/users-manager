import React, { useEffect, useState } from "react";
import { useAdminStats } from "../../../hooks/queries";
import "./RealTimeIndicators.scss";

export const RealTimeIndicators: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const { refetch } = useAdminStats();

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Update lastUpdated timestamp periodically or on refetch
    const interval = setInterval(() => {
      setLastUpdated(new Date());
    }, 60000); // Update every minute

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(interval);
    };
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleRefresh = () => {
    refetch();
    setLastUpdated(new Date());
  };

  return (
    <div className="realtime-indicators">
      <div className={`connection-status ${isOnline ? "online" : "offline"}`}>
        <div className="status-dot"></div>
        <span>{isOnline ? "Connected" : "Offline"}</span>
      </div>

      <div className="last-update">
        <span>Last update: {formatTime(lastUpdated)}</span>
      </div>

      <div className="live-indicator">
        <div className="pulse"></div>
        <span>LIVE</span>
      </div>
      <button onClick={handleRefresh} className="refresh-btn">
        Refresh
      </button>
    </div>
  );
};
