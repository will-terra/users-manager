import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import type { User } from "../../../types/user";
import { ProfileAvatar } from "./ProfileAvatar";

// Mock user data
const mockUserWithAvatar: User = {
  id: 1,
  email: "john@example.com",
  full_name: "John Doe",
  has_avatar: true,
  avatar_urls: {
    small: "/avatars/small.jpg",
    medium: "/avatars/medium.jpg",
    large: "/avatars/large.jpg",
  },
  created_at: "2023-01-01T00:00:00Z",
  updated_at: "2023-01-01T00:00:00Z",
};

const mockUserWithoutAvatar: User = {
  id: 2,
  email: "jane@example.com",
  full_name: "Jane Smith",
  has_avatar: false,
  avatar_urls: null,
  created_at: "2023-01-01T00:00:00Z",
  updated_at: "2023-01-01T00:00:00Z",
};

const mockUserWithEmptyName: User = {
  id: 3,
  email: "test@example.com",
  full_name: "",
  has_avatar: false,
  avatar_urls: null,
  created_at: "2023-01-01T00:00:00Z",
  updated_at: "2023-01-01T00:00:00Z",
};

describe("ProfileAvatar", () => {
  test("renders avatar image when user has avatar and removeAvatar is false", () => {
    render(<ProfileAvatar user={mockUserWithAvatar} removeAvatar={false} />);

    const avatarImg = screen.getByAltText("John Doe's avatar");
    expect(avatarImg).toBeInTheDocument();
    expect(avatarImg).toHaveAttribute(
      "src",
      "http://localhost:3001/avatars/medium.jpg",
    );
    expect(avatarImg).toHaveAttribute("loading", "lazy");
  });

  test("renders placeholder when user has no avatar", () => {
    render(<ProfileAvatar user={mockUserWithoutAvatar} removeAvatar={false} />);

    const placeholder = screen.getByRole("img", {
      name: "Jane Smith's placeholder avatar with initial J",
    });
    expect(placeholder).toBeInTheDocument();
    expect(placeholder).toHaveTextContent("J");
  });

  test("renders placeholder when removeAvatar is true", () => {
    render(<ProfileAvatar user={mockUserWithAvatar} removeAvatar={true} />);

    const placeholder = screen.getByRole("img", {
      name: "John Doe's placeholder avatar with initial J",
    });
    expect(placeholder).toBeInTheDocument();
    expect(placeholder).toHaveTextContent("J");
  });

  test("renders placeholder with question mark when user has empty name", () => {
    render(<ProfileAvatar user={mockUserWithEmptyName} removeAvatar={false} />);

    const placeholder = screen.getByRole("img", {
      name: "'s placeholder avatar with initial ?",
    });
    expect(placeholder).toBeInTheDocument();
    expect(placeholder).toHaveTextContent("?");
  });

  test("renders placeholder with uppercase initial", () => {
    const userWithLowercaseName: User = {
      ...mockUserWithoutAvatar,
      full_name: "jane smith",
    };

    render(<ProfileAvatar user={userWithLowercaseName} removeAvatar={false} />);

    const placeholder = screen.getByRole("img", {
      name: "jane smith's placeholder avatar with initial J",
    });
    expect(placeholder).toBeInTheDocument();
    expect(placeholder).toHaveTextContent("J");
  });
});
