import { renderHook } from "@testing-library/react";
import { expect, test } from "vitest";
import { useAuth } from "../../hooks/useAuth";

test("throws error when used outside AuthProvider", () => {
  expect(() => renderHook(() => useAuth())).toThrow(
    "useAuth must be used within an AuthProvider",
  );
});
