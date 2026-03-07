import { CapturedFrame } from "./camera";
import { PerceptionData } from "./perception";

// API configuration
export interface APIConfig {
    baseUrl: string;
    timeout: number;
    retryAttempts: number;
    retryDelay: number;
}

// API endpoints
export interface APIEndpoints {
    sendFrame: string;
    sceneAnalysis: string;
    healthCheck: string;
}

// API request for sending frame
export interface SendFrameRequest {
    frame: CapturedFrame;
}

// API response for frame submission
export interface SendFrameResponse {
    success: boolean;
    frame_id: string;
    message?: string;
}

// API response for scene analysis
export interface SceneAnalysisResponse {
    success: boolean;
    data?: PerceptionData;
    error?: string;
}

// Health check response
export interface HealthCheckResponse {
    status: "healthy" | "degraded" | "unhealthy";
    timestamp: string;
    services?: Record<string, boolean>;
}

// WebSocket message types
export type WSMessageType = "perception" | "alert" | "status" | "error";

// WebSocket message
export interface WSMessage {
    type: WSMessageType;
    payload: unknown;
    timestamp: string;
}

// Connection state
export interface ConnectionState {
    api: "connected" | "disconnected" | "error";
    websocket: "connected" | "disconnected" | "connecting" | "error";
    lastHealthCheck: string | null;
}
