import { CameraRole, PerceptionData, SegmentationData } from "@/types";

// Demo terrain classes
const TERRAIN_CLASSES = [
    "sand",
    "rocks",
    "bushes",
    "plants",
    "sky",
    "gravel",
    "vegetation",
    "offroad path",
    "hills"
];

// ... (keep alerts constant)

// Generate zeroed segmentation data
function generateZeroedSegmentation(): SegmentationData {
    const result: SegmentationData = {};
    TERRAIN_CLASSES.forEach(cls => {
        result[cls] = 0;
    });
    return result;
}

// ...

// Generate mock perception data for a camera
export function generateMockPerception(camera: CameraRole): PerceptionData {
    const segmentation = generateZeroedSegmentation(); // All 0
    const alerts: string[] = []; // No alerts by default for clean slate

    return {
        camera,
        segmentation,
        alerts,
        parsedAlerts: [],
        summary_text: "System ready. Waiting for backend AI data...",
        confidence: 0, // 0 confidence
        timestamp: new Date().toISOString(),
    };
}

// Mock AI response generator with configurable latency
export class MockAIGenerator {
    private intervalId: NodeJS.Timeout | null = null;
    private latencyMs: number;
    private onData: (data: PerceptionData) => void;
    private cameras: CameraRole[] = ["front", "rear", "left", "right"];

    constructor(
        onData: (data: PerceptionData) => void,
        latencyMs: number = 2000
    ) {
        this.onData = onData;
        this.latencyMs = latencyMs;
    }

    start(): void {
        if (this.intervalId) return;

        // Generate initial data immediately
        this.cameras.forEach((camera) => {
            this.onData(generateMockPerception(camera));
        });

        // Then periodic updates
        this.intervalId = setInterval(() => {
            // Update one random camera at a time for more realistic feel
            const camera = this.cameras[Math.floor(Math.random() * this.cameras.length)];
            this.onData(generateMockPerception(camera));
        }, this.latencyMs);
    }

    stop(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    setLatency(ms: number): void {
        this.latencyMs = ms;
        if (this.intervalId) {
            this.stop();
            this.start();
        }
    }
}
