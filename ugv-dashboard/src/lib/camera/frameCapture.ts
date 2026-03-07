import { CameraRole, CapturedFrame, FrameMetadata } from "@/types";

// Generate unique frame ID
const generateFrameId = (): string => {
    return `frame_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Capture frame from video element as base64
export async function captureFrameAsBase64(
    videoElement: HTMLVideoElement,
    role: CameraRole,
    quality: number = 0.8
): Promise<CapturedFrame | null> {
    try {
        const canvas = document.createElement("canvas");
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
            console.error("Failed to get canvas context");
            return null;
        }

        ctx.drawImage(videoElement, 0, 0);
        const base64Data = canvas.toDataURL("image/jpeg", quality);

        const metadata: FrameMetadata = {
            frame_id: generateFrameId(),
            camera_role: role,
            timestamp: new Date().toISOString(),
        };

        return {
            ...metadata,
            data: base64Data,
            format: "base64",
        };
    } catch (err) {
        console.error("Failed to capture frame:", err);
        return null;
    }
}

// Capture frame from video element as Blob
export async function captureFrameAsBlob(
    videoElement: HTMLVideoElement,
    role: CameraRole,
    quality: number = 0.8
): Promise<CapturedFrame | null> {
    try {
        const canvas = document.createElement("canvas");
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
            console.error("Failed to get canvas context");
            return null;
        }

        ctx.drawImage(videoElement, 0, 0);

        return new Promise((resolve) => {
            canvas.toBlob(
                (blob) => {
                    if (!blob) {
                        resolve(null);
                        return;
                    }

                    const metadata: FrameMetadata = {
                        frame_id: generateFrameId(),
                        camera_role: role,
                        timestamp: new Date().toISOString(),
                    };

                    resolve({
                        ...metadata,
                        data: blob,
                        format: "blob",
                    });
                },
                "image/jpeg",
                quality
            );
        });
    } catch (err) {
        console.error("Failed to capture frame as blob:", err);
        return null;
    }
}

// Capture frame from MediaStream
export async function captureFrameFromStream(
    stream: MediaStream,
    role: CameraRole,
    format: "base64" | "blob" = "base64",
    quality: number = 0.8
): Promise<CapturedFrame | null> {
    const video = document.createElement("video");
    video.srcObject = stream;
    video.muted = true;

    try {
        await video.play();

        // Wait for video to be ready
        await new Promise<void>((resolve) => {
            if (video.readyState >= 2) {
                resolve();
            } else {
                video.onloadeddata = () => resolve();
            }
        });

        const result = format === "base64"
            ? await captureFrameAsBase64(video, role, quality)
            : await captureFrameAsBlob(video, role, quality);

        video.pause();
        video.srcObject = null;

        return result;
    } catch (err) {
        console.error("Failed to capture frame from stream:", err);
        video.srcObject = null;
        return null;
    }
}

// Periodic frame capture
export class PeriodicFrameCapture {
    private intervalId: NodeJS.Timeout | null = null;
    private stream: MediaStream | null = null;
    private role: CameraRole;
    private onCapture: (frame: CapturedFrame) => void;
    private intervalMs: number;

    constructor(
        role: CameraRole,
        onCapture: (frame: CapturedFrame) => void,
        intervalMs: number = 1000
    ) {
        this.role = role;
        this.onCapture = onCapture;
        this.intervalMs = intervalMs;
    }

    start(stream: MediaStream) {
        this.stream = stream;

        this.intervalId = setInterval(async () => {
            if (!this.stream) return;

            const frame = await captureFrameFromStream(this.stream, this.role);
            if (frame) {
                this.onCapture(frame);
            }
        }, this.intervalMs);
    }

    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.stream = null;
    }

    setInterval(ms: number) {
        this.intervalMs = ms;
        if (this.stream && this.intervalId) {
            this.stop();
            this.start(this.stream);
        }
    }
}
