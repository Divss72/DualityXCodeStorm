import { WEBSOCKET_CONFIG } from "@/config/endpoints";
import { WSMessage, PerceptionData } from "@/types";

type MessageHandler = (data: PerceptionData) => void;
type StatusHandler = (status: "connected" | "disconnected" | "connecting" | "error") => void;

export class WebSocketClient {
    private ws: WebSocket | null = null;
    private url: string;
    private reconnectAttempts: number;
    private reconnectDelay: number;
    private currentAttempt: number = 0;
    private isIntentionalClose: boolean = false;
    private reconnectTimer: NodeJS.Timeout | null = null;

    private messageHandlers: Set<MessageHandler> = new Set();
    private statusHandlers: Set<StatusHandler> = new Set();

    constructor(
        url: string = WEBSOCKET_CONFIG.url,
        reconnectAttempts: number = WEBSOCKET_CONFIG.reconnectAttempts,
        reconnectDelay: number = WEBSOCKET_CONFIG.reconnectDelay
    ) {
        this.url = url;
        this.reconnectAttempts = reconnectAttempts;
        this.reconnectDelay = reconnectDelay;
    }

    connect(): void {
        if (this.ws?.readyState === WebSocket.OPEN) {
            return;
        }

        this.isIntentionalClose = false;
        this.notifyStatus("connecting");

        try {
            this.ws = new WebSocket(this.url);

            this.ws.onopen = () => {
                console.log("WebSocket connected");
                this.currentAttempt = 0;
                this.notifyStatus("connected");
            };

            this.ws.onmessage = (event) => {
                this.handleMessage(event.data);
            };

            this.ws.onclose = (event) => {
                console.log("WebSocket closed:", event.code, event.reason);
                this.notifyStatus("disconnected");

                if (!this.isIntentionalClose) {
                    this.attemptReconnect();
                }
            };

            this.ws.onerror = (error) => {
                console.error("WebSocket error:", error);
                this.notifyStatus("error");
            };
        } catch (err) {
            console.error("Failed to create WebSocket:", err);
            this.notifyStatus("error");
            this.attemptReconnect();
        }
    }

    disconnect(): void {
        this.isIntentionalClose = true;

        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }

        if (this.ws) {
            this.ws.close(1000, "Client disconnect");
            this.ws = null;
        }

        this.notifyStatus("disconnected");
    }

    private attemptReconnect(): void {
        if (this.currentAttempt >= this.reconnectAttempts) {
            console.log("Max reconnection attempts reached");
            return;
        }

        this.currentAttempt++;
        console.log(`Reconnecting (attempt ${this.currentAttempt}/${this.reconnectAttempts})...`);

        this.reconnectTimer = setTimeout(() => {
            this.connect();
        }, this.reconnectDelay);
    }

    private handleMessage(data: string): void {
        try {
            const message: WSMessage = JSON.parse(data);

            if (message.type === "perception" && message.payload) {
                const perceptionData = message.payload as PerceptionData;
                this.messageHandlers.forEach((handler) => handler(perceptionData));
            }
        } catch (err) {
            console.error("Failed to parse WebSocket message:", err);
            // Log invalid payload but don't crash
        }
    }

    private notifyStatus(status: "connected" | "disconnected" | "connecting" | "error"): void {
        this.statusHandlers.forEach((handler) => handler(status));
    }

    onMessage(handler: MessageHandler): () => void {
        this.messageHandlers.add(handler);
        return () => this.messageHandlers.delete(handler);
    }

    onStatus(handler: StatusHandler): () => void {
        this.statusHandlers.add(handler);
        return () => this.statusHandlers.delete(handler);
    }

    send(data: unknown): void {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
        } else {
            console.warn("WebSocket not connected, cannot send message");
        }
    }

    get isConnected(): boolean {
        return this.ws?.readyState === WebSocket.OPEN;
    }
}

// Singleton instance
let wsClient: WebSocketClient | null = null;

export function getWebSocketClient(): WebSocketClient {
    if (!wsClient) {
        wsClient = new WebSocketClient();
    }
    return wsClient;
}
