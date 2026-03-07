"use client";

import { useCallback, useRef, useState, useEffect } from "react";
import { CameraRole, CameraStream, StreamHealth, CameraDevice } from "@/types";
import { useAppStore } from "@/lib/state";

interface UseCameraOptions {
    role: CameraRole;
    autoStart?: boolean;
}

interface UseCameraReturn {
    stream: MediaStream | null;
    health: StreamHealth;
    isConnecting: boolean;
    error: string | null;
    availableCameras: CameraDevice[];
    selectedCamera: string | null;
    startStream: (deviceId?: string) => Promise<void>;
    stopStream: () => void;
    reconnect: () => Promise<void>;
    selectCamera: (deviceId: string) => void;
    toggleCamera: () => Promise<void>;
    captureFrame: () => Promise<string | null>;
}

export function useCamera({ role, autoStart = false }: UseCameraOptions): UseCameraReturn {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const fpsCounterRef = useRef({ frames: 0, lastTime: Date.now() });

    const [stream, setStream] = useState<MediaStream | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [availableCameras, setAvailableCameras] = useState<CameraDevice[]>([]);
    const [selectedCamera, setSelectedCamera] = useState<string | null>(null);
    const [health, setHealth] = useState<StreamHealth>({
        fps: 0,
        latency: 0,
        connected: false,
    });

    const { setCameraStream, updateCameraHealth, isDemoMode } = useAppStore();

    // Get available cameras
    const getAvailableCameras = useCallback(async () => {
        if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
            setError("Secure context required (HTTPS). See troubleshooting below.");
            return [];
        }

        try {
            // Request permission first
            await navigator.mediaDevices.getUserMedia({ video: true });

            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices
                .filter((device) => device.kind === "videoinput")
                .map((device) => ({
                    deviceId: device.deviceId,
                    label: device.label || `Camera ${device.deviceId.slice(0, 8)}`,
                    kind: "videoinput" as const,
                    facing: device.label.toLowerCase().includes("front")
                        ? "user" as const
                        : device.label.toLowerCase().includes("back") || device.label.toLowerCase().includes("rear")
                            ? "environment" as const
                            : undefined,
                }));

            setAvailableCameras(videoDevices);
            return videoDevices;
        } catch (err) {
            console.error("Failed to enumerate cameras:", err);
            setError("Failed to access cameras. Please check permissions.");
            return [];
        }
    }, []);

    // Start camera stream
    const startStream = useCallback(async (deviceId?: string) => {
        if (isDemoMode) {
            // In demo mode, don't start real camera
            return;
        }

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            setError("Secure context required (HTTPS). See troubleshooting below.");
            return;
        }

        setIsConnecting(true);
        setError(null);

        try {
            // Use specified device or environment (back) camera - don't switch cameras
            const constraints: MediaStreamConstraints = {
                video: deviceId
                    ? {
                        deviceId: { exact: deviceId },
                        width: { ideal: 1920 },
                        height: { ideal: 1080 },
                        frameRate: { ideal: 60, max: 60 }
                    }
                    : {
                        facingMode: "environment",
                        width: { ideal: 1920 },
                        height: { ideal: 1080 },
                        frameRate: { ideal: 60, max: 60 }
                    }, // Back camera for UGV
                audio: false,
            };

            const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);

            streamRef.current = mediaStream;
            setStream(mediaStream);
            setSelectedCamera(deviceId || mediaStream.getVideoTracks()[0]?.getSettings().deviceId || null);

            // Update store
            const cameraStream: CameraStream = {
                device_id: deviceId || mediaStream.getVideoTracks()[0]?.getSettings().deviceId || "unknown",
                camera_role: role,
                timestamp: new Date().toISOString(),
                connection_status: "connected",
                stream: mediaStream,
            };
            setCameraStream(role, cameraStream);

            setHealth((prev) => ({ ...prev, connected: true }));
            updateCameraHealth(role, { connected: true });

        } catch (err: unknown) {
            console.error("Failed to start camera:", err);

            let errorMessage = "Failed to start camera";
            if (err instanceof Error) {
                if (err.name === "NotReadableError" || err.message.includes("Could not start video source")) {
                    errorMessage = "Camera is busy. Close other apps using camera and try again.";
                } else if (err.name === "NotAllowedError") {
                    errorMessage = "Camera permission denied. Please allow camera access.";
                } else if (err.name === "NotFoundError") {
                    errorMessage = "No camera found on this device.";
                } else if (err.name === "OverconstrainedError") {
                    errorMessage = "Back camera not available. Try selecting a different camera.";
                } else {
                    errorMessage = err.message;
                }
                // Append error type for debugging
                errorMessage += ` (${err.name})`;
            }

            setError(errorMessage);
            setCameraStream(role, null);
        } finally {
            setIsConnecting(false);
        }
    }, [role, isDemoMode, setCameraStream, updateCameraHealth]);

    // Stop camera stream
    const stopStream = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }
        setStream(null);
        setHealth((prev) => ({ ...prev, connected: false, fps: 0 }));
        setCameraStream(role, null);
        updateCameraHealth(role, { connected: false, fps: 0 });
    }, [role, setCameraStream, updateCameraHealth]);

    // Reconnect stream
    const reconnect = useCallback(async () => {
        stopStream();
        await new Promise((resolve) => setTimeout(resolve, 500));
        await startStream(selectedCamera || undefined);
    }, [stopStream, startStream, selectedCamera]);

    // Select camera
    const selectCamera = useCallback((deviceId: string) => {
        setSelectedCamera(deviceId);
        if (stream) {
            // Restart with new camera
            stopStream();
            startStream(deviceId);
        }
    }, [stream, stopStream, startStream]);

    // Capture frame as base64
    const captureFrame = useCallback(async (): Promise<string | null> => {
        if (!stream) return null;

        try {
            const video = document.createElement("video");
            video.srcObject = stream;
            video.muted = true;
            await video.play();

            const canvas = document.createElement("canvas");
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            const ctx = canvas.getContext("2d");
            if (!ctx) return null;

            ctx.drawImage(video, 0, 0);
            const base64 = canvas.toDataURL("image/jpeg", 0.8);

            video.pause();
            video.srcObject = null;

            return base64;
        } catch (err) {
            console.error("Failed to capture frame:", err);
            return null;
        }
    }, [stream]);

    // Toggle between available cameras
    const toggleCamera = useCallback(async () => {
        if (availableCameras.length < 2) {
            console.log("No other cameras available to toggle");
            return;
        }

        const currentIndex = availableCameras.findIndex(c => c.deviceId === selectedCamera);
        const nextIndex = (currentIndex + 1) % availableCameras.length;
        const nextCamera = availableCameras[nextIndex];

        if (nextCamera) {
            selectCamera(nextCamera.deviceId);
        }
    }, [availableCameras, selectedCamera, selectCamera]);

    // Monitor FPS
    useEffect(() => {
        if (!stream) return;

        const interval = setInterval(() => {
            const track = stream.getVideoTracks()[0];
            if (track) {
                const settings = track.getSettings();
                const fps = settings.frameRate || 30; // Default to 30 if not reported

                setHealth(prev => ({ ...prev, fps: Math.round(fps) }));
                updateCameraHealth(role, { fps: Math.round(fps) });
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [stream, role, updateCameraHealth]);

    // Initialize cameras on mount
    useEffect(() => {
        getAvailableCameras();

        if (autoStart && !isDemoMode) {
            startStream();
        }

        return () => {
            stopStream();
        };
    }, []);

    return {
        stream,
        health,
        isConnecting,
        error,
        availableCameras,
        selectedCamera,
        startStream,
        stopStream,
        reconnect,
        selectCamera,
        toggleCamera,
        captureFrame,
    };
}
