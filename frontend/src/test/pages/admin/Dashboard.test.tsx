import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { useAdminStats } from "../../../hooks/queries";
import { AdminDashboard } from "../../../pages/admin/Dashboard";

// Mock the hooks
vi.mock("../../../hooks/queries");
vi.mock("../../../pages/admin/components/RealTimeIndicators", () => ({
  RealTimeIndicators: () => (
    <div data-testid="realtime-indicators">RealTime Indicators</div>
  ),
}));
vi.mock("../../../pages/admin/components/StatsCards", () => ({
  StatsCards: ({ loading }: { loading: boolean }) => (
    <div data-testid="stats-cards">
      Stats Cards - Loading: {loading ? "true" : "false"}
    </div>
  ),
}));

describe("AdminDashboard", () => {
  test("renders dashboard with real-time indicators and stats cards", () => {
    vi.mocked(useAdminStats).mockReturnValue({
      data: { stats: { totalUsers: 100, activeUsers: 50 } },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<AdminDashboard />);

    expect(screen.getByText("Admin Dashboard")).toBeInTheDocument();
    expect(screen.getByTestId("realtime-indicators")).toBeInTheDocument();
    expect(screen.getByTestId("stats-cards")).toBeInTheDocument();
    expect(
      screen.getByText("Stats Cards - Loading: false"),
    ).toBeInTheDocument();
  });

  test("displays error banner with refetch button when there is an error", () => {
    const mockRefetch = vi.fn();
    vi.mocked(useAdminStats).mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error("Failed to load stats"),
      refetch: mockRefetch,
    });

    render(<AdminDashboard />);

    expect(screen.getByText("Failed to load stats")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Try Again" }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Try Again" }));
    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  test("passes loading state to StatsCards", () => {
    vi.mocked(useAdminStats).mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    });

    render(<AdminDashboard />);

    expect(screen.getByText("Stats Cards - Loading: true")).toBeInTheDocument();
  });

  test("passes null stats when data is not available", () => {
    vi.mocked(useAdminStats).mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<AdminDashboard />);

    expect(screen.getByTestId("stats-cards")).toBeInTheDocument();
  });
});
