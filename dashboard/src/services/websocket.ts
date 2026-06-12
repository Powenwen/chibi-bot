/**
 * Chibi Bot Dashboard - WebSocket Service
 * Real-time communication for logs, stats, and alerts
 */

import type { LogStreamMessage, WebSocketEvent } from '../types/api';

export type WebSocketStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting';

export interface WebSocketCallbacks {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onMessage?: (message: LogStreamMessage) => void;
  onError?: (error: Event) => void;
}

/**
 * WebSocket client for real-time dashboard features
 */
export class DashboardWebSocket {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private callbacks: WebSocketCallbacks;
  private status: WebSocketStatus = 'disconnected';
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(url: string, callbacks: WebSocketCallbacks = {}) {
    this.url = url;
    this.callbacks = callbacks;
  }

  getConnectionStatus(): WebSocketStatus {
    return this.status;
  }

  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) return;

    this.status = 'connecting';
    
    try {
      this.ws = new WebSocket(this.url);
      
      this.ws.onopen = () => {
        this.status = 'connected';
        this.reconnectAttempts = 0;
        this.startHeartbeat();
        this.callbacks.onConnect?.();
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as LogStreamMessage;
          this.callbacks.onMessage?.(message);
        } catch {
          console.warn('Received non-JSON websocket message:', event.data);
        }
      };

      this.ws.onclose = () => {
        this.status = 'disconnected';
        this.stopHeartbeat();
        this.callbacks.onDisconnect?.();
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        this.callbacks.onError?.(error);
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.attemptReconnect();
    }
  }

  disconnect(): void {
    this.stopHeartbeat();
    this.clearReconnectTimeout();
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    this.status = 'disconnected';
  }

  send(event: string, payload: unknown): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      const message: WebSocketEvent = { event, payload };
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, message not sent');
    }
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.send('ping', { timestamp: Date.now() });
    }, 30000);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max WebSocket reconnect attempts reached');
      return;
    }

    this.status = 'reconnecting';
    this.reconnectAttempts++;
    
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    this.reconnectTimeout = setTimeout(() => {
      console.log(`WebSocket reconnecting... attempt ${this.reconnectAttempts}`);
      this.connect();
    }, delay);
  }

  private clearReconnectTimeout(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }
}

/**
 * Create a log stream WebSocket connection
 */
export function createLogStream(callbacks: WebSocketCallbacks): DashboardWebSocket {
  const wsUrl = `${import.meta.env.VITE_API_BASE_URL?.replace('http', 'ws') || 'ws://localhost:3000'}/ws/dev/logs`;
  return new DashboardWebSocket(wsUrl, callbacks);
}

/**
 * Create a stats broadcast WebSocket connection
 */
export function createStatsStream(callbacks: WebSocketCallbacks): DashboardWebSocket {
  const wsUrl = `${import.meta.env.VITE_API_BASE_URL?.replace('http', 'ws') || 'ws://localhost:3000'}/ws/stats`;
  return new DashboardWebSocket(wsUrl, callbacks);
}
