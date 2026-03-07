// Camera role types
export type CameraRole = "front" | "rear" | "left" | "right";

// Camera stream information
export interface CameraStream {
    device_id: string;
    camera_role: CameraRole;
    timestamp: string;
    connection_status: "connected" | "disconnected" | "connecting" | "error";
    stream?: MediaStream;
}

// Stream health indicators
export interface StreamHealth {
    fps: number;
    latency: number; // approximate, in ms
    connected: boolean;
    lastFrameTime?: number;
}

// Frame metadata for capture
export interface FrameMetadata {
    frame_id: string;
    camera_role: CameraRole;
    timestamp: string;
}

// Captured frame with data
export interface CapturedFrame extends FrameMetadata {
    data: string | Blob; // base64 or blob
    format: "base64" | "blob";
}

// Camera device info
export interface CameraDevice {
    deviceId: string;
    label: string;
    kind: "videoinput";
    facing?: "user" | "environment"; // front or rear camera
}

// Camera panel state
export interface CameraPanelState {
    role: CameraRole;
    stream: CameraStream | null;
    health: StreamHealth;
    isCapturing: boolean;
}
