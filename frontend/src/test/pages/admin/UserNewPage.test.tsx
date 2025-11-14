import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { UserNewPage } from "../../../pages/admin/UserNewPage";

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

// Mock the UserForm component
vi.mock("../../../pages/admin/components/UserForm", () => ({
  UserForm: ({
    onSave,
    onCancel,
  }: {
    onSave: () => void;
    onCancel: () => void;
  }) => (
    <div>
      <button onClick={onSave}>Save</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  ),
}));

describe("UserNewPage", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  test("renders UserForm with save and cancel handlers", () => {
    render(<UserNewPage />);

    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  });

  test("navigates to users list when save is successful", () => {
    render(<UserNewPage />);

    const saveButton = screen.getByRole("button", { name: "Save" });
    fireEvent.click(saveButton);

    expect(mockNavigate).toHaveBeenCalledWith("/admin/users");
  });

  test("navigates to users list when cancel is clicked", () => {
    render(<UserNewPage />);

    const cancelButton = screen.getByRole("button", { name: "Cancel" });
    fireEvent.click(cancelButton);

    expect(mockNavigate).toHaveBeenCalledWith("/admin/users");
  });
});
