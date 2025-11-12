import React, { useEffect, useState } from "react";
import { useAdminStats } from "../../../hooks/useAdminStats";
import { useAuth } from "../../../hooks/useAuth";
import "./RealTimeIndicators.scss";

export const RealTimeIndicators: React.FC = () => {
  const { token } = useAuth();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { refreshStats, lastUpdated } = useAdminStats(token || "");

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
    });
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
      <button onClick={refreshStats} className="refresh-btn">
        Refresh
      </button>
    </div>
  );
};
