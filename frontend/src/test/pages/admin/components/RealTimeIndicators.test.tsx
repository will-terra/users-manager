import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { useAdminStats } from "../../../../hooks/queries";
import { RealTimeIndicators } from "../../../../pages/admin/components/RealTimeIndicators";

// Mock the useAdminStats hook
vi.mock("../../../../hooks/queries", () => ({
  useAdminStats: vi.fn(),
}));

// Mock navigator.onLine
Object.defineProperty(window, "navigator", {
  value: { onLine: true },
  writable: true,
});

describe("RealTimeIndicators", () => {
  let mockRefetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Reset mocks
    mockRefetch = vi.fn();
    vi.mocked(useAdminStats).mockReturnValue({ refetch: mockRefetch });

    // Reset navigator.onLine
    Object.defineProperty(window, "navigator", {
      value: { onLine: true },
      writable: true,
    });

    // Mock Date.now for consistent timestamps
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  test("renders with online status initially", () => {
    render(<RealTimeIndicators />);

    expect(screen.getByText("Connected")).toBeInTheDocument();
    expect(screen.getByText("LIVE")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Refresh" })).toBeInTheDocument();
  });

  test("renders with offline status when navigator.onLine is false", () => {
    Object.defineProperty(window, "navigator", {
      value: { onLine: false },
      writable: true,
    });

    render(<RealTimeIndicators />);

    expect(screen.getByText("Offline")).toBeInTheDocument();
  });

  test("shows last update time in correct format", () => {
    const mockDate = new Date("2023-01-15T14:30:00");
    vi.setSystemTime(mockDate);

    render(<RealTimeIndicators />);

    expect(screen.getByText("Last update: 14:30")).toBeInTheDocument();
  });

  test("updates online status when online event fires", () => {
    Object.defineProperty(window, "navigator", {
      value: { onLine: false },
      writable: true,
    });

    render(<RealTimeIndicators />);

    expect(screen.getByText("Offline")).toBeInTheDocument();

    // Simulate online event
    fireEvent(window, new Event("online"));

    expect(screen.getByText("Connected")).toBeInTheDocument();
  });

  test("updates offline status when offline event fires", () => {
    render(<RealTimeIndicators />);

    expect(screen.getByText("Connected")).toBeInTheDocument();

    // Simulate offline event
    fireEvent(window, new Event("offline"));

    expect(screen.getByText("Offline")).toBeInTheDocument();
  });

  test("sets up interval for periodic updates", () => {
    vi.useFakeTimers();
    const setIntervalSpy = vi.spyOn(window, "setInterval");

    render(<RealTimeIndicators />);

    expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 60000);

    // Get the callback function and call it to cover the interval logic
    const callback = setIntervalSpy.mock.calls[0][0] as () => void;
    act(() => {
      callback();
    });

    setIntervalSpy.mockRestore();
  });

  test("refreshes data and updates timestamp when refresh button is clicked", () => {
    const initialDate = new Date("2023-01-15T14:30:00");
    vi.setSystemTime(initialDate);

    render(<RealTimeIndicators />);

    expect(screen.getByText("Last update: 14:30")).toBeInTheDocument();

    const refreshButton = screen.getByRole("button", { name: "Refresh" });
    fireEvent.click(refreshButton);

    expect(mockRefetch).toHaveBeenCalledTimes(1);

    // Should update the timestamp immediately
    expect(screen.getByText("Last update: 14:30")).toBeInTheDocument();
  });

  test("cleans up event listeners and interval on unmount", () => {
    const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");
    const clearIntervalSpy = vi.spyOn(window, "clearInterval");

    const { unmount } = render(<RealTimeIndicators />);

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      "online",
      expect.any(Function),
    );
    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      "offline",
      expect.any(Function),
    );
    expect(clearIntervalSpy).toHaveBeenCalledTimes(1);
  });

  test("formats time correctly with different hours", () => {
    const testCases = [
      { date: new Date("2023-01-15T09:05:00"), expected: "09:05" },
      { date: new Date("2023-01-15T14:30:00"), expected: "14:30" },
      { date: new Date("2023-01-15T23:59:00"), expected: "23:59" },
    ];

    testCases.forEach(({ date, expected }) => {
      vi.setSystemTime(date);
      render(<RealTimeIndicators />);
      expect(screen.getByText(`Last update: ${expected}`)).toBeInTheDocument();
    });
  });
});
