import {
    PerceptionData,
    Alert,
    AlertSeverity,
    ParseResult,
    CameraRole,
    SegmentationData
} from "@/types";

// Known alert codes and their severity (for demo purposes)
// Backend should ideally provide severity, but this is a fallback
const ALERT_SEVERITY_MAP: Record<string, AlertSeverity> = {
    HIGH_HAZARD: "critical",
    OBSTACLE_DETECTED: "high",
    LOW_VISIBILITY: "medium",
    PATH_CLEAR: "low",
    TERRAIN_CHANGE: "medium",
    COLLISION_WARNING: "critical",
    ROUGH_TERRAIN: "medium",
    WATER_DETECTED: "high",
};

// Infer severity from alert code (fallback)
function inferAlertSeverity(code: string): AlertSeverity {
    // Check known codes first
    if (ALERT_SEVERITY_MAP[code]) {
        return ALERT_SEVERITY_MAP[code];
    }

    // Infer from keywords
    const upperCode = code.toUpperCase();
    if (upperCode.includes("CRITICAL") || upperCode.includes("COLLISION") || upperCode.includes("HIGH_HAZARD")) {
        return "critical";
    }
    if (upperCode.includes("HIGH") || upperCode.includes("DANGER") || upperCode.includes("WARNING")) {
        return "high";
    }
    if (upperCode.includes("MEDIUM") || upperCode.includes("CAUTION")) {
        return "medium";
    }

    return "low";
}

// Parse alerts from raw codes
function parseAlerts(rawAlerts: unknown): Alert[] {
    if (!rawAlerts || !Array.isArray(rawAlerts)) {
        return [];
    }

    return rawAlerts
        .filter((alert) => typeof alert === "string")
        .map((code) => ({
            code,
            severity: inferAlertSeverity(code),
            timestamp: new Date().toISOString(),
        }));
}

// Validate and parse segmentation data
function parseSegmentation(raw: unknown): SegmentationData | undefined {
    if (!raw || typeof raw !== "object") {
        return undefined;
    }

    const result: SegmentationData = {};

    for (const [key, value] of Object.entries(raw)) {
        // Accept any string key (dynamic classes)
        // Value must be a number
        if (typeof value === "number") {
            result[key] = value;
        } else if (typeof value === "string") {
            const parsed = parseFloat(value);
            if (!isNaN(parsed)) {
                result[key] = parsed;
            }
        }
    }

    return Object.keys(result).length > 0 ? result : undefined;
}

// Validate camera role
function validateCameraRole(raw: unknown): CameraRole | null {
    if (typeof raw !== "string") return null;

    const validRoles: CameraRole[] = ["front", "rear", "left", "right"];
    return validRoles.includes(raw as CameraRole) ? (raw as CameraRole) : null;
}

// Parse AI output payload - schema-tolerant
export function parseAIOutput(payload: unknown): ParseResult {
    const warnings: string[] = [];

    // Handle null/undefined
    if (!payload) {
        return {
            success: false,
            error: "Empty payload received",
        };
    }

    // Must be an object
    if (typeof payload !== "object") {
        return {
            success: false,
            error: `Invalid payload type: expected object, got ${typeof payload}`,
        };
    }

    const data = payload as Record<string, unknown>;

    // Camera role is required
    const camera = validateCameraRole(data.camera);
    if (!camera) {
        return {
            success: false,
            error: "Missing or invalid camera role",
        };
    }

    // Parse optional fields gracefully
    const segmentation = parseSegmentation(data.segmentation);
    if (data.segmentation && !segmentation) {
        warnings.push("Segmentation data was present but could not be parsed");
    }

    const rawAlerts = data.alerts;
    const parsedAlerts = parseAlerts(rawAlerts);
    if (rawAlerts && parsedAlerts.length === 0) {
        warnings.push("Alerts were present but could not be parsed");
    }

    // Parse confidence
    let confidence: number | undefined;
    if (typeof data.confidence === "number") {
        confidence = data.confidence;
    } else if (typeof data.confidence === "string") {
        const parsed = parseFloat(data.confidence);
        if (!isNaN(parsed)) {
            confidence = parsed;
        }
    }

    // Parse timestamp
    let timestamp: string;
    if (typeof data.timestamp === "string") {
        timestamp = data.timestamp;
    } else {
        timestamp = new Date().toISOString();
        warnings.push("Missing timestamp, using current time");
    }

    // Build result
    const perceptionData: PerceptionData = {
        camera,
        segmentation,
        alerts: Array.isArray(data.alerts) ? data.alerts.filter((a) => typeof a === "string") : undefined,
        parsedAlerts,
        summary_text: typeof data.summary_text === "string" ? data.summary_text : undefined,
        confidence,
        timestamp,
        raw: payload,
    };

    return {
        success: true,
        data: perceptionData,
        warnings: warnings.length > 0 ? warnings : undefined,
    };
}

// Validate payload without parsing (quick check)
export function isValidPayload(payload: unknown): boolean {
    if (!payload || typeof payload !== "object") return false;

    const data = payload as Record<string, unknown>;
    return validateCameraRole(data.camera) !== null;
}

// Log invalid payload for debugging
export function logInvalidPayload(payload: unknown, error: string): void {
    console.warn("Invalid AI payload received:", {
        error,
        payload: JSON.stringify(payload).slice(0, 500),
        timestamp: new Date().toISOString(),
    });
}
