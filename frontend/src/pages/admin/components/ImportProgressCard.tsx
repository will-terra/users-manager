import React from "react";
import type { ImportProgress } from "../../../types/api";

interface ImportProgressCardProps {
  importData: ImportProgress;
  onDismiss: (importId: number) => void;
}

const getStatusColor = (status: string): string => {
  const colorMap: Record<string, string> = {
    completed: "success",
    processing: "warning",
    failed: "error",
  };
  return colorMap[status] || "info";
};

export const ImportProgressCard: React.FC<ImportProgressCardProps> = ({
  importData,
  onDismiss,
}) => {
  const statusColor = getStatusColor(importData.status);

  return (
    <div className={`import-progress ${statusColor}`}>
      <div className="import-header">
        <button
          className="dismiss-btn"
          onClick={() => onDismiss(importData.id)}
          aria-label="Dismiss import"
          title="Dismiss this import"
        >
          ×
        </button>
        <h3>Import: {importData.file_name}</h3>
        <span className={`status-badge ${importData.status}`}>
          {importData.status}
        </span>
      </div>

      <div className="progress-container">
        <div className="progress-info">
          <span>
            Progress: {importData.progress} / {importData.total_rows}
          </span>
          <span>{importData.percentage}%</span>
        </div>

        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${importData.percentage}%` }}
          />
        </div>
      </div>

      {importData.successful_imports !== undefined && (
        <div className="import-stats">
          <div className="stat">
            <span className="label">Successful:</span>
            <span className="value success">
              {importData.successful_imports}
            </span>
          </div>
          {importData.failed_imports !== undefined && (
            <div className="stat">
              <span className="label">Failed:</span>
              <span className="value error">{importData.failed_imports}</span>
            </div>
          )}
        </div>
      )}

      {importData.recent_errors && importData.recent_errors.length > 0 && (
        <div className="recent-errors">
          <h4>Recent Errors:</h4>
          <ul>
            {importData.recent_errors.slice(0, 3).map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {importData.error_message && (
        <div className="error-message">
          <strong>Error:</strong> {importData.error_message}
        </div>
      )}
    </div>
  );
};
