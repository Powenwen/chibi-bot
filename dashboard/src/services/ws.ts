/**
 * Simple WebSocket client for the dashboard.
 * Connects to backend WebSocket at /ws and exposes event handlers.
 */

type Handler = (data: any) => void;

const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
const WS_URL = BASE.replace(/^http/, 'ws') + '/ws';

class DashboardWS {
  private ws: WebSocket | null = null;
  private reconnectTimer = 1000;
  private handlers: Record<string, Handler[]> = {};
  private globalHandlers: Handler[] = [];

  connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) return;

    try {
      this.ws = new WebSocket(WS_URL);
    } catch (err) {
      console.error('Failed to create WebSocket:', err);
      this.scheduleReconnect();
      return;
    }

    this.ws.onopen = () => {
      console.info('[WS] Connected to', WS_URL);
      this.reconnectTimer = 1000;
    };

    this.ws.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data);
        this.dispatch(msg.event || msg.type || 'message', msg.payload ?? msg.data ?? msg);
      } catch (err) {
        console.warn('[WS] Failed to parse message', err);
      }
    };

    this.ws.onclose = () => {
      console.info('[WS] Disconnected, scheduling reconnect');
      this.scheduleReconnect();
    };

    this.ws.onerror = (err) => {
      console.warn('[WS] Error', err);
      try { this.ws?.close(); } catch {};
    };
  }

  private scheduleReconnect() {
    setTimeout(() => this.connect(), this.reconnectTimer);
    this.reconnectTimer = Math.min(30000, this.reconnectTimer * 1.5);
  }

  on(event: string, handler: Handler) {
    this.handlers[event] = this.handlers[event] || [];
    this.handlers[event].push(handler);
    // lazy connect
    this.connect();
    return () => { this.off(event, handler); };
  }

  send(event: string, payload: any) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      // connect and send after open
      this.connect();
      const trySend = () => {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({ event, payload }));
        } else {
          setTimeout(trySend, 250);
        }
      };
      trySend();
      return;
    }

    try {
      this.ws.send(JSON.stringify({ event, payload }));
    } catch (err) {
      console.error('[WS] send error', err);
    }
  }

  off(event: string, handler: Handler) {
    if (!this.handlers[event]) return;
    this.handlers[event] = this.handlers[event].filter((h) => h !== handler);
  }

  onAny(handler: Handler) {
    this.globalHandlers.push(handler);
    this.connect();
    return () => { this.globalHandlers = this.globalHandlers.filter((h) => h !== handler); };
  }

  private dispatch(event: string, data: any) {
    const list = this.handlers[event] || [];
    for (const h of list) {
      try { h(data); } catch (err) { console.error('WS handler error', err); }
    }
    for (const gh of this.globalHandlers) {
      try { gh({ event, data }); } catch (err) { console.error('WS global handler error', err); }
    }
  }
}

const wsClient = new DashboardWS();

export default wsClient;
