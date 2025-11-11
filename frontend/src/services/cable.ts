/**
 * Cable service for managing ActionCable WebSocket connections to the Rails backend.
 * Handles connection lifecycle and provides a singleton consumer instance.
 */

import { Consumer, createConsumer, Subscription } from "@rails/actioncable";
import { authService } from "./authService";

class CableService {
  private consumer: Consumer | null = null;
  private url: string;

  constructor() {
    this.url =
      import.meta.env.VITE_ACTION_CABLE_URL || "ws://localhost:3000/cable";
  }

  /**
   * Create or return an existing ActionCable consumer connected to the backend.
   * The token is appended to the connection URL for server-side authentication.
   * @param token - JWT or session token used for authenticating the websocket connection
   * @returns a connected ActionCable Consumer
   */
  connect(token?: string): Consumer {
    if (this.consumer) {
      return this.consumer;
    }

    const authToken = token || authService.getToken();
    if (!authToken) {
      throw new Error("No token available for ActionCable connection");
    }

    const connectUrl = `${this.url}?token=${encodeURIComponent(authToken)}`;
    this.consumer = createConsumer(connectUrl);

    return this.consumer;
  }

  disconnect(): void {
    if (this.consumer) {
      // Close the websocket connection and clear the cached consumer.
      this.consumer.disconnect();
      this.consumer = null;
    }
  }

  /**
   * Return the cached Consumer instance if one exists.
   * Useful when other modules need to inspect the consumer without creating a new connection.
   */
  getConsumer(): Consumer | null {
    return this.consumer;
  }
}

export const cableService = new CableService();

/**
 * Helper function to create a subscription to a specific channel
 * @param channelName - The name of the channel to subscribe to
 * @param params - Parameters to pass to the channel
 * @param callbacks - Callbacks for subscription events
 * @returns The subscription instance
 */
export function createSubscription(
  channelName: string,
  params: Record<string, unknown> = {},
  callbacks: {
    connected?: () => void;
    disconnected?: () => void;
    received?: (data: unknown) => void;
    rejected?: () => void;
  } = {},
): Subscription {
  const consumer = cableService.connect();
  return consumer.subscriptions.create(
    { channel: channelName, ...params },
    callbacks,
  );
}
