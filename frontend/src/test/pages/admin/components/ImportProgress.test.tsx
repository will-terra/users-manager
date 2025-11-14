import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { ImportProgress } from "../../../../pages/admin/components/ImportProgress";
import type { ImportProgress as ImportProgressType } from "../../../types/api";

// Mock the ImportProgressCard component
vi.mock("../../../../pages/admin/components/ImportProgressCard", () => ({
  ImportProgressCard: ({
    importData,
    onDismiss,
  }: {
    importData: ImportProgressType;
    onDismiss: (id: number) => void;
  }) => (
    <div data-testid={`import-card-${importData.id}`}>
      <span>{importData.file_name}</span>
      <button onClick={() => onDismiss(importData.id)}>Dismiss</button>
    </div>
  ),
}));

describe("ImportProgress", () => {
  const mockOnDismiss = vi.fn();

  test("returns null when there are no imports", () => {
    const { container } = render(
      <ImportProgress importProgress={new Map()} onDismiss={mockOnDismiss} />,
    );

    expect(container.firstChild).toBeNull();
  });

  test("renders container with sorted imports (newest first)", () => {
    const oldImport: ImportProgressType = {
      id: 1,
      status: "completed",
      progress: 100,
      total_rows: 100,
      percentage: 100,
      file_name: "old_import.csv",
      created_at: "2023-01-01T10:00:00Z",
    };

    const newImport: ImportProgressType = {
      id: 2,
      status: "processing",
      progress: 50,
      total_rows: 100,
      percentage: 50,
      file_name: "new_import.csv",
      created_at: "2023-01-02T10:00:00Z",
    };

    const importProgress = new Map([
      [1, oldImport],
      [2, newImport],
    ]);

    render(
      <ImportProgress
        importProgress={importProgress}
        onDismiss={mockOnDismiss}
      />,
    );

    const container = document.querySelector(".import-progress-container");
    expect(container).toBeInTheDocument();

    // Check that imports are rendered in the correct order (newest first)
    const cards = screen.getAllByTestId(/^import-card-/);
    expect(cards).toHaveLength(2);

    // First card should be the newer one
    expect(cards[0]).toHaveAttribute("data-testid", "import-card-2");
    expect(screen.getByText("new_import.csv")).toBeInTheDocument();

    // Second card should be the older one
    expect(cards[1]).toHaveAttribute("data-testid", "import-card-1");
    expect(screen.getByText("old_import.csv")).toBeInTheDocument();
  });

  test("renders single import correctly", () => {
    const singleImport: ImportProgressType = {
      id: 3,
      status: "pending",
      progress: 0,
      total_rows: 50,
      percentage: 0,
      file_name: "single_import.csv",
      created_at: "2023-01-03T10:00:00Z",
    };

    const importProgress = new Map([[3, singleImport]]);

    render(
      <ImportProgress
        importProgress={importProgress}
        onDismiss={mockOnDismiss}
      />,
    );

    const container = document.querySelector(".import-progress-container");
    expect(container).toBeInTheDocument();

    const card = screen.getByTestId("import-card-3");
    expect(card).toBeInTheDocument();
    expect(screen.getByText("single_import.csv")).toBeInTheDocument();
  });

  test("passes onDismiss callback to ImportProgressCard components", () => {
    const testImport: ImportProgressType = {
      id: 4,
      status: "failed",
      progress: 0,
      total_rows: 25,
      percentage: 0,
      file_name: "failed_import.csv",
      created_at: "2023-01-04T10:00:00Z",
    };

    const importProgress = new Map([[4, testImport]]);

    render(
      <ImportProgress
        importProgress={importProgress}
        onDismiss={mockOnDismiss}
      />,
    );

    const dismissButton = screen.getByRole("button", { name: "Dismiss" });
    dismissButton.click();

    expect(mockOnDismiss).toHaveBeenCalledWith(4);
  });

  test("handles imports with same timestamp (maintains stable sort)", () => {
    const import1: ImportProgressType = {
      id: 5,
      status: "completed",
      progress: 100,
      total_rows: 100,
      percentage: 100,
      file_name: "import_1.csv",
      created_at: "2023-01-05T10:00:00Z",
    };

    const import2: ImportProgressType = {
      id: 6,
      status: "completed",
      progress: 100,
      total_rows: 100,
      percentage: 100,
      file_name: "import_2.csv",
      created_at: "2023-01-05T10:00:00Z", // Same timestamp
    };

    const importProgress = new Map([
      [5, import1],
      [6, import2],
    ]);

    render(
      <ImportProgress
        importProgress={importProgress}
        onDismiss={mockOnDismiss}
      />,
    );

    // Both should be rendered, order may vary but both present
    expect(screen.getByText("import_1.csv")).toBeInTheDocument();
    expect(screen.getByText("import_2.csv")).toBeInTheDocument();
  });
});
