"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { CameraRole } from "@/types";
import { WEBSOCKET_CONFIG } from "@/config/endpoints";

interface UseStreamingOptions {
    role: CameraRole;
    serverUrl?: string;
    frameInterval?: number; // ms between frames
    onFpsUpdate?: (fps: number) => void;
}

export function useFrameStreaming({
    role,
    serverUrl = WEBSOCKET_CONFIG.url,
    frameInterval = 16, // ~60 FPS for real-time
    onFpsUpdate
}: UseStreamingOptions) {
    const wsRef = useRef<WebSocket | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // FPS Tracking
    const framesCountRef = useRef(0);
    const lastFpsTimeRef = useRef(Date.now());

    useEffect(() => {
        const fpsInterval = setInterval(() => {
            const now = Date.now();
            const elapsed = (now - lastFpsTimeRef.current) / 1000;
            if (elapsed >= 1) {
                const fps = Math.round(framesCountRef.current / elapsed);
                if (onFpsUpdate) onFpsUpdate(fps);
                framesCountRef.current = 0;
                lastFpsTimeRef.current = now;
            }
        }, 1000);
        return () => clearInterval(fpsInterval);
    }, [onFpsUpdate]);

    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const connect = useCallback(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) return;

        try {
            const ws = new WebSocket(serverUrl);

            ws.onopen = () => {
                console.log("Connected to relay server");
                ws.send(JSON.stringify({
                    type: "register",
                    clientType: "camera",
                    role: role
                }));
                setIsConnected(true);
                setError(null);
            };

            ws.onclose = () => {
                console.log("Disconnected from relay server");
                setIsConnected(false);
            };

            ws.onerror = (e) => {
                console.error("WebSocket error:", e);
                setError("Failed to connect to relay server");
                setIsConnected(false);
            };

            wsRef.current = ws;
        } catch (err) {
            setError("Failed to create WebSocket connection");
        }
    }, [serverUrl, role]);

    const startStreaming = useCallback((videoElement: HTMLVideoElement) => {
        videoRef.current = videoElement;

        // Create canvas for frame capture
        if (!canvasRef.current) {
            canvasRef.current = document.createElement("canvas");
        }

        // Start sending frames
        intervalRef.current = setInterval(() => {
            if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
            if (!videoRef.current || videoRef.current.readyState < 2) return;

            const video = videoRef.current;
            const canvas = canvasRef.current!;

            // Cap resolution for faster streaming (max 480p)
            const maxHeight = 480;
            const scale = video.videoHeight > maxHeight ? maxHeight / video.videoHeight : 1;
            canvas.width = Math.round(video.videoWidth * scale);
            canvas.height = Math.round(video.videoHeight * scale);


            const ctx = canvas.getContext("2d");
            if (!ctx) return;

            // Draw full frame
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            // 50% quality JPEG for faster real-time streaming
            const frameData = canvas.toDataURL("image/jpeg", 0.5);

            wsRef.current.send(JSON.stringify({
                type: "frame",
                data: frameData
            }));

            framesCountRef.current++;
        }, 16); // ~60 FPS (16ms) for real-time streaming
    }, [frameInterval, onFpsUpdate]);

    const stopStreaming = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }, []);

    const disconnect = useCallback(() => {
        stopStreaming();
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }
        setIsConnected(false);
    }, [stopStreaming]);

    useEffect(() => {
        return () => {
            disconnect();
        };
    }, [disconnect]);

    return {
        connect,
        disconnect,
        startStreaming,
        stopStreaming,
        isConnected,
        error
    };
}
