/**
 * Chibi Bot Dashboard - WebSocket Server
 * Real-time event streaming for moderation logs, bot stats, and config changes.
 *
 * Architecture:
 *   Bot features → Redis pub/sub → WebSocket server → Dashboard clients
 *
 * Channels:
 *   chibi:ws:moderation  — new moderation cases
 *   chibi:ws:config      — guild config changes
 *   chibi:ws:stats       — bot health/statistics updates
 */

import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';
import type { Redis } from 'ioredis';

// ==================== Types ====================

export interface WSMessage {
  event: string;
  payload: unknown;
}

export interface LogStreamMessage {
  type: 'log' | 'error' | 'stats' | 'ping';
  timestamp: string;
  data: unknown;
}

interface ConnectedClient {
  ws: WebSocket;
  id: string;
  subscribedGuilds: Set<string>;
  isDeveloper: boolean;
  isAlive: boolean;
}

// ==================== WebSocket Server Class ====================

export class DashboardWSServer {
  private wss: WebSocketServer;
  private clients: Map<string, ConnectedClient> = new Map();
  private redisSubscriber: Redis | null = null;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private statsInterval: ReturnType<typeof setInterval> | null = null;

  constructor(server: Server) {
    this.wss = new WebSocketServer({
      server,
      path: '/ws',
      // Verify client origin
      verifyClient: (info: { origin: string; req: { headers: { origin?: string } } }) => {
        const origin = info.origin || info.req.headers.origin;
        const allowedOrigin = process.env.DASHBOARD_URL || 'http://localhost:5173';
        return origin === allowedOrigin;
      },
    });

    this.setupConnectionHandler();
    this.startHeartbeat();
  }

  // ==================== Connection Handling ====================

  private setupConnectionHandler(): void {
    this.wss.on('connection', (ws, req) => {
      const clientId = this.generateClientId();
      const client: ConnectedClient = {
        ws,
        id: clientId,
        subscribedGuilds: new Set(),
        isDeveloper: false,
        isAlive: true,
      };

      this.clients.set(clientId, client);
      console.log(`[WS] Client connected: ${clientId} (total: ${this.clients.size})`);

      // Send welcome message
      this.sendToClient(client, {
        event: 'connected',
        payload: { clientId, message: 'Connected to Chibi Bot WebSocket' },
      });

      // Handle incoming messages
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString()) as WSMessage;
          this.handleClientMessage(client, message);
        } catch {
          // Ignore non-JSON messages
        }
      });

      // Handle pong (heartbeat response)
      ws.on('pong', () => {
        client.isAlive = true;
      });

      // Handle disconnect
      ws.on('close', () => {
        this.clients.delete(clientId);
        console.log(`[WS] Client disconnected: ${clientId} (total: ${this.clients.size})`);
      });

      ws.on('error', (err) => {
        console.error(`[WS] Client error ${clientId}:`, err.message);
      });
    });
  }

  // ==================== Message Handling ====================

  private handleClientMessage(client: ConnectedClient, message: WSMessage): void {
    switch (message.event) {
      case 'ping':
        this.sendToClient(client, { event: 'pong', payload: { timestamp: Date.now() } });
        break;

      case 'subscribe:guild': {
        const { guildId } = message.payload as { guildId: string };
        client.subscribedGuilds.add(guildId);
        this.sendToClient(client, {
          event: 'subscribed',
          payload: { guildId },
        });
        break;
      }

      case 'unsubscribe:guild': {
        const { guildId } = message.payload as { guildId: string };
        client.subscribedGuilds.delete(guildId);
        break;
      }

      case 'setDeveloper': {
        const { isDeveloper } = message.payload as { isDeveloper: boolean };
        client.isDeveloper = isDeveloper;
        break;
      }

      default:
        break;
    }
  }

  // ==================== Redis Pub/Sub ====================

  /**
   * Subscribe to Redis channels and forward events to connected clients.
   * Uses a separate Redis connection for pub/sub (required by ioredis).
   */
  async setupRedisSubscription(redisClient: Redis): Promise<void> {
    // Create a duplicate connection for pub/sub (ioredis requires this)
    this.redisSubscriber = redisClient.duplicate();

    await this.redisSubscriber.subscribe(
      'chibi:ws:moderation',
      'chibi:ws:config',
      'chibi:ws:stats'
    );

    this.redisSubscriber.on('message', (channel: string, message: string) => {
      try {
        const data = JSON.parse(message);
        this.broadcastFromRedis(channel, data);
      } catch {
        console.error(`[WS] Failed to parse Redis message on ${channel}`);
      }
    });

    console.log('[WS] Subscribed to Redis pub/sub channels');
  }

  /**
   * Broadcast a Redis pub/sub message to relevant connected clients.
   */
  private broadcastFromRedis(channel: string, data: { guildId?: string; [key: string]: unknown }): void {
    const eventMap: Record<string, string> = {
      'chibi:ws:moderation': 'moderation',
      'chibi:ws:config': 'config',
      'chibi:ws:stats': 'stats',
    };

    const event = eventMap[channel];
    if (!event) return;

    const logMessage: LogStreamMessage = {
      type: event === 'stats' ? 'stats' : event === 'moderation' ? 'log' : 'log',
      timestamp: new Date().toISOString(),
      data,
    };

    for (const client of this.clients.values()) {
      // For moderation/config events, only send to clients subscribed to that guild
      if (data.guildId && !client.subscribedGuilds.has(data.guildId as string)) {
        continue;
      }

      // For stats events, only send to developers
      if (event === 'stats' && !client.isDeveloper) {
        continue;
      }

      this.sendToClient(client, { event, payload: logMessage });
    }
  }

  // ==================== Broadcasting ====================

  /**
   * Send a message to a specific client.
   */
  private sendToClient(client: ConnectedClient, message: WSMessage): void {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(message));
    }
  }

  /**
   * Broadcast a message to all connected clients.
   */
  broadcast(message: WSMessage): void {
    for (const client of this.clients.values()) {
      this.sendToClient(client, message);
    }
  }

  /**
   * Broadcast to clients subscribed to a specific guild.
   */
  broadcastToGuild(guildId: string, message: WSMessage): void {
    for (const client of this.clients.values()) {
      if (client.subscribedGuilds.has(guildId)) {
        this.sendToClient(client, message);
      }
    }
  }

  /**
   * Broadcast to all developer clients.
   */
  broadcastToDevelopers(message: WSMessage): void {
    for (const client of this.clients.values()) {
      if (client.isDeveloper) {
        this.sendToClient(client, message);
      }
    }
  }

  // ==================== Heartbeat ====================

  /**
   * Start periodic heartbeat to detect and clean up dead connections.
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      for (const [id, client] of this.clients) {
        if (!client.isAlive) {
          client.ws.terminate();
          this.clients.delete(id);
          continue;
        }

        client.isAlive = false;
        client.ws.ping();
      }
    }, 30000);
  }

  /**
   * Start periodic stats broadcast to developer clients.
   */
  startStatsBroadcast(getStats: () => Record<string, unknown>): void {
    this.statsInterval = setInterval(() => {
      const stats = getStats();
      this.broadcastToDevelopers({
        event: 'stats',
        payload: {
          type: 'stats',
          timestamp: new Date().toISOString(),
          data: stats,
        },
      });
    }, 10000); // Every 10 seconds
  }

  // ==================== Cleanup ====================

  /**
   * Stop the WebSocket server and clean up resources.
   */
  stop(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    if (this.statsInterval) {
      clearInterval(this.statsInterval);
    }
    if (this.redisSubscriber) {
      this.redisSubscriber.unsubscribe();
      this.redisSubscriber.disconnect();
    }
    this.wss.close();
    console.log('[WS] Server stopped');
  }

  // ==================== Helpers ====================

  private generateClientId(): string {
    return `ws_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Get current connection count.
   */
  getConnectionCount(): number {
    return this.clients.size;
  }
}
