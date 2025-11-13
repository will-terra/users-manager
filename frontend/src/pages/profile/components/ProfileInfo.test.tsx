import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import type { User } from "../../../types/user";
import { ProfileInfo } from "./ProfileInfo";

// Mock user data
const mockUser: User = {
  id: 1,
  email: "john@example.com",
  full_name: "John Doe",
  role: "admin",
  has_avatar: false,
  avatar_urls: null,
  created_at: "2023-01-15T10:30:00Z",
  updated_at: "2023-06-15T14:20:00Z",
};

const mockUserWithInvalidDate: User = {
  ...mockUser,
  created_at: "invalid-date",
};

const mockUserWithNullDate: User = {
  id: 3,
  email: "test@example.com",
  full_name: "Test User",
  role: "user",
  has_avatar: false,
  avatar_urls: null,
  // created_at is omitted to test undefined case
  updated_at: "2023-06-15T14:20:00Z",
};

describe("ProfileInfo", () => {
  test("renders user information correctly", () => {
    render(<ProfileInfo user={mockUser} />);

    expect(screen.getByText("Full Name:")).toBeInTheDocument();
    expect(screen.getByText("John Doe")).toBeInTheDocument();

    expect(screen.getByText("Email:")).toBeInTheDocument();
    expect(screen.getByText("john@example.com")).toBeInTheDocument();

    expect(screen.getByText("Role:")).toBeInTheDocument();
    expect(screen.getByText("admin")).toBeInTheDocument();

    expect(screen.getByText("Member Since:")).toBeInTheDocument();
  });

  test("formats valid date correctly", () => {
    render(<ProfileInfo user={mockUser} />);

    // Should format "2023-01-15T10:30:00Z" to "January 15, 2023"
    const timeElement = screen.getByRole("time");
    expect(timeElement).toHaveAttribute("datetime", "2023-01-15T10:30:00Z");
    expect(timeElement).toHaveTextContent("January 15, 2023");
  });

  test("handles invalid date string", () => {
    render(<ProfileInfo user={mockUserWithInvalidDate} />);

    const timeElement = screen.getByRole("time");
    expect(timeElement).toHaveAttribute("datetime", "invalid-date");
    expect(timeElement).toHaveTextContent("Invalid Date");
  });

  test("handles null/undefined date", () => {
    render(<ProfileInfo user={mockUserWithNullDate} />);

    const timeElement = screen.getByRole("time");
    expect(timeElement).not.toHaveAttribute("datetime");
    expect(timeElement).toHaveTextContent("N/A");
  });

  test("renders role badge with correct styling and accessibility", () => {
    render(<ProfileInfo user={mockUser} />);

    const roleBadge = screen.getByRole("status", { name: "User role: admin" });
    expect(roleBadge).toHaveClass("role-badge", "admin");
    expect(roleBadge).toHaveTextContent("admin");
  });

  test("handles date formatting error that throws", () => {
    // Mock Date constructor to throw an error
    const originalDate = global.Date;
    global.Date = class extends originalDate {
      constructor(...args: any[]) {
        super(...args);
        if (args[0] === "throw-error") {
          throw new Error("Date construction failed");
        }
      }
    } as any;

    const userWithThrowingDate = {
      ...mockUser,
      created_at: "throw-error",
    };

    render(<ProfileInfo user={userWithThrowingDate} />);

    const timeElement = screen.getByRole("time");
    expect(timeElement).toHaveTextContent("Invalid date");

    // Restore original Date
    global.Date = originalDate;
  });
});
