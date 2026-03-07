// Configurable API endpoints
// All URLs can be overridden via environment variables

export const API_CONFIG = {
    // Base URL for API calls
    baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",

    // Request timeout in milliseconds
    timeout: parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || "10000"),

    // Retry configuration
    retryAttempts: parseInt(process.env.NEXT_PUBLIC_API_RETRY_ATTEMPTS || "3"),
    retryDelay: parseInt(process.env.NEXT_PUBLIC_API_RETRY_DELAY || "1000"),
};

export const ENDPOINTS = {
    // POST - Send captured frame to backend
    sendFrame: process.env.NEXT_PUBLIC_ENDPOINT_SEND_FRAME || "/send-frame",

    // POST - Request scene analysis
    sceneAnalysis: process.env.NEXT_PUBLIC_ENDPOINT_SCENE_ANALYSIS || "/scene-analysis",

    // GET - Health check
    healthCheck: process.env.NEXT_PUBLIC_ENDPOINT_HEALTH_CHECK || "/health-check",
};

export const WEBSOCKET_CONFIG = {
    // WebSocket URL for real-time AI outputs
    url: process.env.NEXT_PUBLIC_WS_URL || "ws://172.22.212.34:8080",

    // Reconnection settings
    reconnectAttempts: parseInt(process.env.NEXT_PUBLIC_WS_RECONNECT_ATTEMPTS || "5"),
    reconnectDelay: parseInt(process.env.NEXT_PUBLIC_WS_RECONNECT_DELAY || "2000"),
};

// Build full API URL
export const buildUrl = (endpoint: string): string => {
    return `${API_CONFIG.baseUrl}${endpoint}`;
};
