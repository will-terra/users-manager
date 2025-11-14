import { createConsumer } from "@rails/actioncable";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { authService } from "../../services/authService";
import { cableService, createSubscription } from "../../services/cable";

// Mock ActionCable
vi.mock("@rails/actioncable", () => ({
  createConsumer: vi.fn(),
}));

// Mock authService
vi.mock("../../services/authService", () => ({
  authService: {
    getToken: vi.fn(),
  },
}));

describe("cable", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("VITE_ACTION_CABLE_URL", "ws://localhost:3001/cable");
    // Reset the consumer
    (cableService as { consumer: unknown }).consumer = null;
    // Spy on the connect method
    vi.spyOn(cableService, "connect");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("CableService", () => {
    describe("connect", () => {
      test("creates a new consumer when none exists", () => {
        const mockToken = "test.token";
        const mockConsumer = {
          disconnect: vi.fn(),
          subscriptions: { create: vi.fn() },
        };

        createConsumer.mockReturnValue(mockConsumer);
        authService.getToken.mockReturnValue(mockToken);

        const result = cableService.connect();

        expect(createConsumer).toHaveBeenCalledWith(
          "ws://localhost:3001/cable?token=test.token",
        );
        expect(result).toBe(mockConsumer);
        expect(cableService.getConsumer()).toBe(mockConsumer);
      });

      test("returns existing consumer when one exists", () => {
        const mockConsumer = {
          disconnect: vi.fn(),
          subscriptions: { create: vi.fn() },
        };

        createConsumer.mockReturnValue(mockConsumer);
        authService.getToken.mockReturnValue("token");

        // First call creates consumer
        cableService.connect();
        // Second call should return the same consumer
        const result = cableService.connect();

        expect(createConsumer).toHaveBeenCalledTimes(1);
        expect(result).toBe(mockConsumer);
      });

      test("uses provided token over authService token", () => {
        const mockConsumer = {
          disconnect: vi.fn(),
          subscriptions: { create: vi.fn() },
        };

        createConsumer.mockReturnValue(mockConsumer);
        authService.getToken.mockReturnValue("auth.token");

        cableService.connect("provided.token");

        expect(createConsumer).toHaveBeenCalledWith(
          "ws://localhost:3001/cable?token=provided.token",
        );
      });

      test("throws error when no token is available", () => {
        authService.getToken.mockReturnValue(null);

        expect(() => cableService.connect()).toThrow(
          "No token available for ActionCable connection",
        );
      });

      test("throws error when token is undefined", () => {
        authService.getToken.mockReturnValue(undefined);

        expect(() => cableService.connect()).toThrow(
          "No token available for ActionCable connection",
        );
      });

      test("throws error when token is empty string", () => {
        authService.getToken.mockReturnValue("");

        expect(() => cableService.connect()).toThrow(
          "No token available for ActionCable connection",
        );
      });
    });

    describe("disconnect", () => {
      test("disconnects and clears consumer when one exists", () => {
        const mockConsumer = {
          disconnect: vi.fn(),
          subscriptions: { create: vi.fn() },
        };

        createConsumer.mockReturnValue(mockConsumer);
        authService.getToken.mockReturnValue("token");

        cableService.connect();
        cableService.disconnect();

        expect(mockConsumer.disconnect).toHaveBeenCalled();
        expect(cableService.getConsumer()).toBeNull();
      });

      test("does nothing when no consumer exists", () => {
        // Should not throw
        expect(() => cableService.disconnect()).not.toThrow();
        expect(cableService.getConsumer()).toBeNull();
      });
    });

    describe("getConsumer", () => {
      test("returns null when no consumer exists", () => {
        expect(cableService.getConsumer()).toBeNull();
      });

      test("returns consumer when one exists", () => {
        const mockConsumer = {
          disconnect: vi.fn(),
          subscriptions: { create: vi.fn() },
        };

        createConsumer.mockReturnValue(mockConsumer);
        authService.getToken.mockReturnValue("token");

        cableService.connect();

        expect(cableService.getConsumer()).toBe(mockConsumer);
      });
    });
  });

  describe("createSubscription", () => {
    test("creates a subscription with channel name only", () => {
      const mockConsumer = {
        disconnect: vi.fn(),
        subscriptions: {
          create: vi.fn().mockReturnValue({}),
        },
      };
      const mockSubscription = {};

      createConsumer.mockReturnValue(mockConsumer);
      authService.getToken.mockReturnValue("token");
      mockConsumer.subscriptions.create.mockReturnValue(mockSubscription);

      const result = createSubscription("TestChannel");

      expect(cableService.connect).toHaveBeenCalled();
      expect(mockConsumer.subscriptions.create).toHaveBeenCalledWith(
        { channel: "TestChannel" },
        {},
      );
      expect(result).toBe(mockSubscription);
    });

    test("creates a subscription with channel name and params", () => {
      const mockConsumer = {
        disconnect: vi.fn(),
        subscriptions: {
          create: vi.fn().mockReturnValue({}),
        },
      };
      const mockSubscription = {};

      createConsumer.mockReturnValue(mockConsumer);
      authService.getToken.mockReturnValue("token");
      mockConsumer.subscriptions.create.mockReturnValue(mockSubscription);

      const params = { room: "general" };
      const result = createSubscription("ChatChannel", params);

      expect(mockConsumer.subscriptions.create).toHaveBeenCalledWith(
        { channel: "ChatChannel", room: "general" },
        {},
      );
      expect(result).toBe(mockSubscription);
    });

    test("creates a subscription with callbacks", () => {
      const mockConsumer = {
        disconnect: vi.fn(),
        subscriptions: {
          create: vi.fn().mockReturnValue({}),
        },
      };
      const mockSubscription = {};
      const callbacks = {
        connected: vi.fn(),
        received: vi.fn(),
        disconnected: vi.fn(),
      };

      createConsumer.mockReturnValue(mockConsumer);
      authService.getToken.mockReturnValue("token");
      mockConsumer.subscriptions.create.mockReturnValue(mockSubscription);

      const result = createSubscription("TestChannel", {}, callbacks);

      expect(mockConsumer.subscriptions.create).toHaveBeenCalledWith(
        { channel: "TestChannel" },
        callbacks,
      );
      expect(result).toBe(mockSubscription);
    });

    test("creates a subscription with params and callbacks", () => {
      const mockConsumer = {
        disconnect: vi.fn(),
        subscriptions: {
          create: vi.fn().mockReturnValue({}),
        },
      };
      const mockSubscription = {};
      const params = { id: 123 };
      const callbacks = {
        received: vi.fn(),
      };

      createConsumer.mockReturnValue(mockConsumer);
      authService.getToken.mockReturnValue("token");
      mockConsumer.subscriptions.create.mockReturnValue(mockSubscription);

      const result = createSubscription("UserChannel", params, callbacks);

      expect(mockConsumer.subscriptions.create).toHaveBeenCalledWith(
        { channel: "UserChannel", id: 123 },
        callbacks,
      );
      expect(result).toBe(mockSubscription);
    });
  });
});
