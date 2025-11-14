import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { ImportProgressCard } from "../../../../pages/admin/components/ImportProgressCard";
import type { ImportProgress } from "../../../types/api";

describe("ImportProgressCard", () => {
  const mockOnDismiss = vi.fn();

  const baseImportData: ImportProgress = {
    id: 1,
    status: "processing",
    progress: 50,
    total_rows: 100,
    percentage: 50,
    file_name: "test_import.csv",
    created_at: "2023-01-01T10:00:00Z",
  };

  test("renders basic import information", () => {
    render(
      <ImportProgressCard
        importData={baseImportData}
        onDismiss={mockOnDismiss}
      />,
    );

    expect(screen.getByText("Import: test_import.csv")).toBeInTheDocument();
    expect(screen.getByText("processing")).toBeInTheDocument();
    expect(screen.getByText("Progress: 50 / 100")).toBeInTheDocument();
    expect(screen.getByText("50%")).toBeInTheDocument();
  });

  test("applies correct status color classes", () => {
    const { rerender } = render(
      <ImportProgressCard
        importData={baseImportData}
        onDismiss={mockOnDismiss}
      />,
    );

    // Processing status should have warning class
    expect(document.querySelector(".import-progress")).toHaveClass("warning");

    // Test completed status
    const completedData = { ...baseImportData, status: "completed" as const };
    rerender(
      <ImportProgressCard
        importData={completedData}
        onDismiss={mockOnDismiss}
      />,
    );
    expect(document.querySelector(".import-progress")).toHaveClass("success");

    // Test failed status
    const failedData = { ...baseImportData, status: "failed" as const };
    rerender(
      <ImportProgressCard importData={failedData} onDismiss={mockOnDismiss} />,
    );
    expect(document.querySelector(".import-progress")).toHaveClass("error");

    // Test unknown status (should default to info)
    const unknownData = {
      ...baseImportData,
      status: "unknown" as ImportProgress["status"],
    };
    rerender(
      <ImportProgressCard importData={unknownData} onDismiss={mockOnDismiss} />,
    );
    expect(document.querySelector(".import-progress")).toHaveClass("info");
  });

  test("renders progress bar with correct width", () => {
    render(
      <ImportProgressCard
        importData={baseImportData}
        onDismiss={mockOnDismiss}
      />,
    );

    const progressFill = document.querySelector(".progress-fill");
    expect(progressFill).toHaveStyle({ width: "50%" });
  });

  test("dismiss button calls onDismiss with correct id", () => {
    render(
      <ImportProgressCard
        importData={baseImportData}
        onDismiss={mockOnDismiss}
      />,
    );

    const dismissButton = screen.getByRole("button", {
      name: "Dismiss import",
    });
    fireEvent.click(dismissButton);

    expect(mockOnDismiss).toHaveBeenCalledWith(1);
  });

  test("renders import statistics when available", () => {
    const dataWithStats = {
      ...baseImportData,
      successful_imports: 45,
      failed_imports: 5,
    };

    render(
      <ImportProgressCard
        importData={dataWithStats}
        onDismiss={mockOnDismiss}
      />,
    );

    expect(screen.getByText("Successful:")).toBeInTheDocument();
    expect(screen.getByText("45")).toBeInTheDocument();
    expect(screen.getByText("Failed:")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  test("renders only successful imports when failed_imports is undefined", () => {
    const dataWithPartialStats = {
      ...baseImportData,
      successful_imports: 50,
      failed_imports: undefined,
    };

    render(
      <ImportProgressCard
        importData={dataWithPartialStats}
        onDismiss={mockOnDismiss}
      />,
    );

    expect(screen.getByText("Successful:")).toBeInTheDocument();
    expect(screen.getByText("50")).toBeInTheDocument();
    expect(screen.queryByText("Failed:")).not.toBeInTheDocument();
  });

  test("does not render import statistics when successful_imports is undefined", () => {
    render(
      <ImportProgressCard
        importData={baseImportData}
        onDismiss={mockOnDismiss}
      />,
    );

    expect(screen.queryByText("Successful:")).not.toBeInTheDocument();
    expect(screen.queryByText("Failed:")).not.toBeInTheDocument();
  });

  test("renders recent errors when available", () => {
    const dataWithErrors = {
      ...baseImportData,
      recent_errors: ["Error 1", "Error 2", "Error 3", "Error 4"],
    };

    render(
      <ImportProgressCard
        importData={dataWithErrors}
        onDismiss={mockOnDismiss}
      />,
    );

    expect(screen.getByText("Recent Errors:")).toBeInTheDocument();
    expect(screen.getByText("Error 1")).toBeInTheDocument();
    expect(screen.getByText("Error 2")).toBeInTheDocument();
    expect(screen.getByText("Error 3")).toBeInTheDocument();
    // Should only show first 3 errors
    expect(screen.queryByText("Error 4")).not.toBeInTheDocument();
  });

  test("does not render recent errors section when no errors", () => {
    render(
      <ImportProgressCard
        importData={baseImportData}
        onDismiss={mockOnDismiss}
      />,
    );

    expect(screen.queryByText("Recent Errors:")).not.toBeInTheDocument();
  });

  test("renders error message when available", () => {
    const dataWithErrorMessage = {
      ...baseImportData,
      error_message: "Import failed due to invalid file format",
    };

    render(
      <ImportProgressCard
        importData={dataWithErrorMessage}
        onDismiss={mockOnDismiss}
      />,
    );

    expect(
      screen.getByText("Import failed due to invalid file format"),
    ).toBeInTheDocument();
    expect(screen.getByText("Error:")).toBeInTheDocument();
  });

  test("does not render error message when not available", () => {
    render(
      <ImportProgressCard
        importData={baseImportData}
        onDismiss={mockOnDismiss}
      />,
    );

    expect(screen.queryByText(/^Error:/)).not.toBeInTheDocument();
  });

  test("renders all sections together", () => {
    const completeData = {
      ...baseImportData,
      successful_imports: 80,
      failed_imports: 20,
      recent_errors: ["Validation error", "Duplicate entry"],
      error_message: "Some imports failed",
    };

    render(
      <ImportProgressCard
        importData={completeData}
        onDismiss={mockOnDismiss}
      />,
    );

    // Basic info
    expect(screen.getByText("Import: test_import.csv")).toBeInTheDocument();

    // Progress
    expect(screen.getByText("Progress: 50 / 100")).toBeInTheDocument();

    // Stats
    expect(screen.getByText("Successful:")).toBeInTheDocument();
    expect(screen.getByText("80")).toBeInTheDocument();
    expect(screen.getByText("Failed:")).toBeInTheDocument();
    expect(screen.getByText("20")).toBeInTheDocument();

    // Errors
    expect(screen.getByText("Recent Errors:")).toBeInTheDocument();
    expect(screen.getByText("Validation error")).toBeInTheDocument();

    // Error message
    expect(screen.getByText("Some imports failed")).toBeInTheDocument();
    expect(screen.getByText("Error:")).toBeInTheDocument();
  });
});
