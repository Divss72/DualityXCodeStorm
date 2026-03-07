import { CameraRole } from "./camera";

// Alert severity levels for visual distinction
export type AlertSeverity = "low" | "medium" | "high" | "critical";

// Individual alert
export interface Alert {
    code: string;
    message?: string;
    severity: AlertSeverity;
    timestamp: string;
}

// Segmentation data - dynamic keys, schema-tolerant
// Keys are class names (e.g., "rocks", "logs", "landscape")
// Values are percentages or scores
export type SegmentationData = Record<string, number>;

// AI perception output - schema-tolerant
export interface PerceptionData {
    camera: CameraRole;
    segmentation?: SegmentationData;
    alerts?: string[]; // Raw alert codes from backend
    parsedAlerts?: Alert[]; // Parsed with severity
    summary_text?: string; // NLP scene reasoning
    confidence?: number;
    timestamp: string;
    raw?: unknown; // Original payload for debugging
}

// Perception state for a single camera
export interface CameraPerception {
    role: CameraRole;
    data: PerceptionData | null;
    lastUpdated: string | null;
    isStale: boolean;
}

// Demo fallback indicator
export interface DemoFallback {
    isActive: boolean;
    reason: string;
}

// Parse result for AI output
export interface ParseResult {
    success: boolean;
    data?: PerceptionData;
    error?: string;
    warnings?: string[];
}
