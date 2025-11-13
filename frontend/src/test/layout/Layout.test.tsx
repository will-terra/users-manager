import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, test, vi } from "vitest";
import { Layout } from "../../layout/Layout";

// Mock child components
vi.mock("../../layout/Header", () => ({
  Header: () => <div data-testid="header">Header</div>,
}));

vi.mock("../../layout/Sidebar", () => ({
  Sidebar: () => <div data-testid="sidebar">Sidebar</div>,
}));

vi.mock("react-router-dom", () => ({
  Outlet: () => <div data-testid="outlet">Outlet Content</div>,
  MemoryRouter: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

describe("Layout", () => {
  test("renders header, sidebar, and outlet", () => {
    render(
      <MemoryRouter>
        <Layout />
      </MemoryRouter>,
    );

    expect(screen.getByTestId("header")).toBeInTheDocument();
    expect(screen.getByTestId("sidebar")).toBeInTheDocument();
    expect(screen.getByTestId("outlet")).toBeInTheDocument();
  });

  test("has correct layout structure", () => {
    const { container } = render(
      <MemoryRouter>
        <Layout />
      </MemoryRouter>,
    );

    // Check that the layout div exists
    const layoutDiv = container.querySelector(".layout");
    expect(layoutDiv).toBeInTheDocument();

    const contentDiv = container.querySelector(".layout-content");
    expect(contentDiv).toBeInTheDocument();

    const mainContent = container.querySelector(".main-content");
    expect(mainContent).toBeInTheDocument();
  });
});
