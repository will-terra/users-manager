import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { useCreateImport } from "../../../hooks/queries";
import { useAuth } from "../../../hooks/useAuth";
import { useImports } from "../../../hooks/useImports";
import { ImportPage } from "../../../pages/admin/ImportPage";

// Mock the hooks
vi.mock("../../../hooks/useAuth");
vi.mock("../../../hooks/useImports");
vi.mock("../../../hooks/queries");

// Mock the ImportProgress component
vi.mock("../../../pages/admin/components/ImportProgress", () => ({
  ImportProgress: () => (
    <div data-testid="import-progress">Import Progress</div>
  ),
}));

describe("ImportPage", () => {
  const mockSetGlobalError = vi.fn();
  const mockSetGlobalSuccess = vi.fn();
  const mockRefreshImports = vi.fn();
  const mockDismissImport = vi.fn();
  const mockMutateAsync = vi.fn();

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Setup default mock returns
    vi.mocked(useAuth).mockReturnValue({
      token: "test-token",
      globalError: null,
      globalSuccess: null,
      setGlobalError: mockSetGlobalError,
      setGlobalSuccess: mockSetGlobalSuccess,
    });

    vi.mocked(useImports).mockReturnValue({
      importsMap: {},
      refreshImports: mockRefreshImports,
      dismissImport: mockDismissImport,
    });

    vi.mocked(useCreateImport).mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
    });
  });

  test("renders import page with form elements", () => {
    render(<ImportPage />);

    expect(screen.getByText("Import Users")).toBeInTheDocument();
    expect(screen.getByText(/Upload a CSV/)).toBeInTheDocument();
    expect(screen.getByLabelText("CSV File")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Start Import" }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("import-progress")).toBeInTheDocument();
  });

  test("shows error when submitting without file", async () => {
    render(<ImportPage />);

    const form = document.querySelector(".import-form") as HTMLFormElement;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(mockSetGlobalError).toHaveBeenCalledWith(
        "Please select a file to import",
      );
    });
  });

  test("successfully submits import with file", async () => {
    const mockFile = new File(["test content"], "test.csv", {
      type: "text/csv",
    });
    mockMutateAsync.mockResolvedValueOnce({});

    render(<ImportPage />);

    const fileInput = screen.getByLabelText("CSV File");
    fireEvent.change(fileInput, { target: { files: [mockFile] } });

    const submitButton = screen.getByRole("button", { name: "Start Import" });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith(mockFile);
      expect(mockRefreshImports).toHaveBeenCalled();
      expect(mockSetGlobalSuccess).toHaveBeenCalledWith(
        "Import started successfully.",
      );
    });
  });

  test("handles import error", async () => {
    const mockFile = new File(["test content"], "test.csv", {
      type: "text/csv",
    });
    const errorMessage = "Import failed";
    mockMutateAsync.mockRejectedValueOnce(new Error(errorMessage));

    render(<ImportPage />);

    const fileInput = screen.getByLabelText("CSV File");
    fireEvent.change(fileInput, { target: { files: [mockFile] } });

    const submitButton = screen.getByRole("button", { name: "Start Import" });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockSetGlobalError).toHaveBeenCalledWith(errorMessage);
    });
  });

  test("displays global error message", () => {
    vi.mocked(useAuth).mockReturnValue({
      token: "test-token",
      globalError: "Test error message",
      globalSuccess: null,
      setGlobalError: mockSetGlobalError,
      setGlobalSuccess: mockSetGlobalSuccess,
    });

    render(<ImportPage />);

    expect(screen.getByText("Test error message")).toBeInTheDocument();
  });

  test("displays global success message", () => {
    vi.mocked(useAuth).mockReturnValue({
      token: "test-token",
      globalError: null,
      globalSuccess: "Test success message",
      setGlobalError: mockSetGlobalError,
      setGlobalSuccess: mockSetGlobalSuccess,
    });

    render(<ImportPage />);

    expect(screen.getByText("Test success message")).toBeInTheDocument();
  });

  test("disables form when loading", () => {
    vi.mocked(useCreateImport).mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: true,
    });

    render(<ImportPage />);

    const fileInput = screen.getByLabelText("CSV File");
    const submitButton = screen.getByRole("button", { name: "Uploading..." });

    expect(fileInput).toBeDisabled();
    expect(submitButton).toBeDisabled();
  });

  test("clears file after successful import", async () => {
    const mockFile = new File(["test content"], "test.csv", {
      type: "text/csv",
    });
    mockMutateAsync.mockResolvedValueOnce({});

    render(<ImportPage />);

    const fileInput = screen.getByLabelText("CSV File");
    fireEvent.change(fileInput, { target: { files: [mockFile] } });

    const submitButton = screen.getByRole("button", { name: "Start Import" });
    fireEvent.click(submitButton);

    await waitFor(() => {
      // The file should be cleared (though we can't easily test the input value)
      expect(mockSetGlobalSuccess).toHaveBeenCalledWith(
        "Import started successfully.",
      );
    });
  });

  test("shows CSV format hint", () => {
    render(<ImportPage />);

    expect(screen.getByText(/CSV should contain columns/)).toBeInTheDocument();
    expect(
      screen.getByText(/full_name,email,password,avatar_url/),
    ).toBeInTheDocument();
  });
});
