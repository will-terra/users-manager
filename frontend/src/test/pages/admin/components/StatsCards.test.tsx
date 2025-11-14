import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { StatsCards } from "../../../../pages/admin/components/StatsCards";
import type { AdminStats } from "../../../types/api";

// Mock stats data
const mockStats: AdminStats = {
  total_users: 150,
  admin_count: 5,
  user_count: 145,
  recent_signups: 12,
  active_today: 23,
};

describe("StatsCards", () => {
  test("renders loading skeleton when loading is true", () => {
    render(<StatsCards stats={null} loading={true} />);

    const loadingContainer = document.querySelector(".stats-cards.loading");
    expect(loadingContainer).toBeInTheDocument();

    // Should have 5 skeleton cards
    const skeletonCards = document.querySelectorAll(".stat-card.skeleton");
    expect(skeletonCards).toHaveLength(5);
  });

  test("renders error message when stats is null and not loading", () => {
    render(<StatsCards stats={null} loading={false} />);

    expect(screen.getByText("No stats available")).toBeInTheDocument();
    const errorContainer = screen.getByText("No stats available");
    expect(errorContainer).toHaveClass("stats-cards", "error");
  });

  test("renders all stat cards with correct data", () => {
    render(<StatsCards stats={mockStats} loading={false} />);

    // Check Total Users card
    expect(screen.getByText("150")).toBeInTheDocument();
    expect(screen.getByText("Total Users")).toBeInTheDocument();
    expect(screen.getByText("All Time")).toBeInTheDocument();

    // Check Administrators card
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("Administrators")).toBeInTheDocument();
    expect(screen.getByText("System Roles")).toBeInTheDocument();

    // Check Regular Users card
    expect(screen.getByText("145")).toBeInTheDocument();
    expect(screen.getByText("Regular Users")).toBeInTheDocument();
    expect(screen.getByText("Standard Accounts")).toBeInTheDocument();

    // Check Recent Signups card
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("Recent Signups")).toBeInTheDocument();
    expect(screen.getByText("Last 7 Days")).toBeInTheDocument();

    // Check Active Today card
    expect(screen.getByText("23")).toBeInTheDocument();
    expect(screen.getByText("Active Today")).toBeInTheDocument();
    expect(screen.getByText("Daily Activity")).toBeInTheDocument();
  });

  test("renders stat cards with correct CSS classes", () => {
    render(<StatsCards stats={mockStats} loading={false} />);

    const statCards = document.querySelectorAll(".stat-card");
    expect(statCards).toHaveLength(5);

    // Check that cards have the correct color classes
    expect(statCards[0]).toHaveClass("primary");
    expect(statCards[1]).toHaveClass("success");
    expect(statCards[2]).toHaveClass("info");
    expect(statCards[3]).toHaveClass("warning");
    expect(statCards[4]).toHaveClass("danger");
  });

  test("renders zero values correctly", () => {
    const zeroStats: AdminStats = {
      total_users: 0,
      admin_count: 0,
      user_count: 0,
      recent_signups: 0,
      active_today: 0,
    };

    render(<StatsCards stats={zeroStats} loading={false} />);

    const zeroElements = screen.getAllByText("0");
    expect(zeroElements).toHaveLength(5); // All five stat values should be 0
  });
});
