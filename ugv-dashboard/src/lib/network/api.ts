import { API_CONFIG, ENDPOINTS, buildUrl } from "@/config/endpoints";
import {
    SendFrameRequest,
    SendFrameResponse,
    SceneAnalysisResponse,
    HealthCheckResponse,
    CapturedFrame
} from "@/types";

// Retry wrapper for API calls
async function withRetry<T>(
    fn: () => Promise<T>,
    attempts: number = API_CONFIG.retryAttempts,
    delay: number = API_CONFIG.retryDelay
): Promise<T> {
    let lastError: Error | null = null;

    for (let i = 0; i < attempts; i++) {
        try {
            return await fn();
        } catch (err) {
            lastError = err instanceof Error ? err : new Error(String(err));
            console.warn(`API call failed (attempt ${i + 1}/${attempts}):`, lastError.message);

            if (i < attempts - 1) {
                await new Promise((resolve) => setTimeout(resolve, delay));
            }
        }
    }

    throw lastError;
}

// Timeout wrapper
function withTimeout<T>(promise: Promise<T>, ms: number = API_CONFIG.timeout): Promise<T> {
    return Promise.race([
        promise,
        new Promise<T>((_, reject) =>
            setTimeout(() => reject(new Error("Request timeout")), ms)
        ),
    ]);
}

// Send frame to backend (non-blocking)
export async function sendFrame(frame: CapturedFrame): Promise<SendFrameResponse> {
    const formData = new FormData();

    if (frame.format === "blob" && frame.data instanceof Blob) {
        formData.append("frame", frame.data, `${frame.frame_id}.jpg`);
    } else {
        formData.append("frame_data", frame.data as string);
    }

    formData.append("frame_id", frame.frame_id);
    formData.append("camera_role", frame.camera_role);
    formData.append("timestamp", frame.timestamp);

    try {
        const response = await withRetry(() =>
            withTimeout(
                fetch(buildUrl(ENDPOINTS.sendFrame), {
                    method: "POST",
                    body: formData,
                })
            )
        );

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
    } catch (err) {
        console.error("Failed to send frame:", err);
        return {
            success: false,
            frame_id: frame.frame_id,
            message: err instanceof Error ? err.message : "Unknown error",
        };
    }
}

// Request scene analysis
export async function requestSceneAnalysis(cameraRole: string): Promise<SceneAnalysisResponse> {
    try {
        const response = await withRetry(() =>
            withTimeout(
                fetch(buildUrl(ENDPOINTS.sceneAnalysis), {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ camera: cameraRole }),
                })
            )
        );

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
    } catch (err) {
        console.error("Failed to request scene analysis:", err);
        return {
            success: false,
            error: err instanceof Error ? err.message : "Unknown error",
        };
    }
}

// Health check
export async function healthCheck(): Promise<HealthCheckResponse | null> {
    try {
        const response = await withTimeout(
            fetch(buildUrl(ENDPOINTS.healthCheck), { method: "GET" }),
            5000 // Shorter timeout for health check
        );

        if (!response.ok) {
            return {
                status: "unhealthy",
                timestamp: new Date().toISOString(),
            };
        }

        return await response.json();
    } catch (err) {
        console.error("Health check failed:", err);
        return null;
    }
}

// Non-blocking frame sender (fire and forget)
export function sendFrameAsync(frame: CapturedFrame): void {
    sendFrame(frame).catch((err) => {
        console.error("Async frame send failed:", err);
    });
}
