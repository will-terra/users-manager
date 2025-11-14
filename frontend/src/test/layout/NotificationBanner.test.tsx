import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { NotificationBanner } from "../../layout/NotificationBanner";

test("does not render when no error or success", () => {
  const { container } = render(<NotificationBanner />);
  expect(container.firstChild).toBeNull();
});

test("renders error banner", () => {
  render(<NotificationBanner error="Test error" />);
  expect(screen.getByRole("alert")).toBeInTheDocument();
  expect(screen.getByText("Test error")).toBeInTheDocument();
});
