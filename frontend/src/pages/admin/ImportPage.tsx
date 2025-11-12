import React, { useState } from "react";
import { useCreateImport } from "../../hooks/queries";
import { useAuth } from "../../hooks/useAuth";
import { useImports } from "../../hooks/useImports";
import { ImportProgress } from "./components/ImportProgress";
import "./ImportPage.scss";

export const ImportPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const {
    token,
    globalError,
    globalSuccess,
    setGlobalError,
    setGlobalSuccess,
  } = useAuth();

  const { importsMap, refreshImports, dismissImport } = useImports(token);
  const createImportMutation = useCreateImport();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files && e.target.files[0] ? e.target.files[0] : null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError(null);
    setGlobalSuccess(null);

    if (!file) {
      setGlobalError("Please select a file to import");
      return;
    }

    try {
      await createImportMutation.mutateAsync(file);
      await refreshImports();
      setGlobalSuccess("Import started successfully.");
      setFile(null);
    } catch (err) {
      const errorObj = err as Error;
      setGlobalError(errorObj.message || "Import failed");
    }
  };

  const loading = createImportMutation.isPending;

  return (
    <div className="import-page">
      <div className="import-header">
        <h1>Import Users</h1>
        <p>
          Upload a CSV to bulk-create users. The import runs in the background.
        </p>
      </div>

      <div className="import-card">
        {globalError && <div className="error-message">{globalError}</div>}
        {globalSuccess && (
          <div className="success-message">{globalSuccess}</div>
        )}

        <form onSubmit={handleSubmit} className="import-form">
          <div className="form-group">
            <label htmlFor="import_file">CSV File</label>
            <input
              id="import_file"
              type="file"
              accept=",.csv,text/csv"
              onChange={handleFileChange}
              disabled={loading}
              value=""
            />
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !file}
            >
              {loading ? "Uploading..." : "Start Import"}
            </button>
          </div>
        </form>

        <div className="hint">
          <strong>Tip:</strong> CSV should contain columns like{" "}
          <code>full_name,email,password</code>.
        </div>
        <div style={{ marginTop: "1rem" }}>
          <ImportProgress
            importProgress={importsMap}
            onDismiss={dismissImport}
          />
        </div>
      </div>
    </div>
  );
};
