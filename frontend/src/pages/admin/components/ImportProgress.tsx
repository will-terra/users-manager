import React, { useMemo } from "react";
import type { ImportProgress as ImportProgressType } from "../../../types/api";
import "./ImportProgress.scss";
import { ImportProgressCard } from "./ImportProgressCard";

interface ImportProgressProps {
  importProgress: Map<number, ImportProgressType>;
  onDismiss: (importId: number) => void;
}

export const ImportProgress: React.FC<ImportProgressProps> = ({
  importProgress,
  onDismiss,
}) => {
  const sortedImports = useMemo(() => {
    return Array.from(importProgress.values()).sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  }, [importProgress]);

  if (sortedImports.length === 0) {
    return null;
  }

  return (
    <div className="import-progress-container">
      {sortedImports.map((importData) => (
        <ImportProgressCard
          key={importData.id}
          importData={importData}
          onDismiss={onDismiss}
        />
      ))}
    </div>
  );
};
