"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useAppStore } from "@/lib/state";
import { CameraRole } from "@/types";
import { WEBSOCKET_CONFIG } from "@/config/endpoints";

interface CameraFrame {
    role: CameraRole;
    data: string; // base64 image
    timestamp: number;
}

interface UseDashboardStreamingOptions {
    serverUrl?: string;
}

export function useDashboardStreaming({
    serverUrl = WEBSOCKET_CONFIG.url
}: UseDashboardStreamingOptions = {}) {
    const wsRef = useRef<WebSocket | null>(null);

    const [isConnected, setIsConnected] = useState(false);
    const [frames, setFrames] = useState<Record<CameraRole, string | null>>({
        front: null,
        rear: null,
        left: null,
        right: null
    });
    const [cameraStatus, setCameraStatus] = useState<Record<CameraRole, boolean>>({
        front: false,
        rear: false,
        left: false,
        right: false
    });

    const [cameraFps, setCameraFps] = useState<Record<CameraRole, number>>({
        front: 0,
        rear: 0,
        left: 0,
        right: 0
    });

    // Track which cameras are paused (stopped by user)
    const [pausedCameras, setPausedCameras] = useState<Record<CameraRole, boolean>>({
        front: false,
        rear: false,
        left: false,
        right: false
    });

    // Ref for paused cameras (so WebSocket callback can access latest value)
    const pausedCamerasRef = useRef<Record<CameraRole, boolean>>({ front: false, rear: false, left: false, right: false });

    // FPS tracking refs
    const frameCountRef = useRef<Record<CameraRole, number>>({ front: 0, rear: 0, left: 0, right: 0 });
    const lastTimeRef = useRef<number>(Date.now());

    const connect = useCallback(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) return;

        try {
            const ws = new WebSocket(serverUrl);

            ws.onopen = () => {
                console.log("Dashboard connected to relay server");
                ws.send(JSON.stringify({
                    type: "register",
                    clientType: "dashboard"
                }));
                setIsConnected(true);
            };

            ws.onmessage = (event) => {
                try {
                    const msg = JSON.parse(event.data);

                    if (msg.type === "frame") {
                        const role = msg.role as CameraRole;
                        // Skip if camera is paused
                        if (pausedCamerasRef.current[role]) return;

                        setFrames(prev => ({
                            ...prev,
                            [role]: msg.data
                        }));
                        // Increment frame counter for this role
                        frameCountRef.current[role] = (frameCountRef.current[role] || 0) + 1;
                    }

                    if (msg.type === "camera_connected") {
                        setCameraStatus(prev => ({
                            ...prev,
                            [msg.role]: true
                        }));
                    }

                    if (msg.type === "camera_disconnected") {
                        setCameraStatus(prev => ({
                            ...prev,
                            [msg.role]: false
                        }));
                        setFrames(prev => ({
                            ...prev,
                            [msg.role]: null
                        }));
                        // Reset FPS
                        frameCountRef.current[msg.role as CameraRole] = 0;
                        setCameraFps(prev => ({ ...prev, [msg.role]: 0 }));
                    }

                    if (msg.type === "camera_status") {
                        setCameraStatus(prev => ({
                            ...prev,
                            ...msg.statuses
                        }));
                    }

                    if (msg.type === "scene_analysis") {
                        // Update global perception state from external AI
                        const { role, data } = msg;

                        if (role === "external" && data) {
                            // Handle aggregated data from receiver_app (backend.txt format)
                            // Map capital keys to CameraRole
                            const roleMap: Record<string, CameraRole> = {
                                "Front": "front",
                                "Rear": "rear",
                                "Left": "left",
                                "Right": "right"
                            };

                            Object.entries(data).forEach(([key, value]: [string, any]) => {
                                const targetRole = roleMap[key];
                                if (targetRole && value) {
                                    // Map risk level to severity
                                    const riskToSeverity: Record<string, "low" | "medium" | "high" | "critical"> = {
                                        'LOW': 'low',
                                        'MEDIUM': 'medium',
                                        'HIGH': 'high',
                                        'CRITICAL': 'critical'
                                    };

                                    const risk = value.risk || "LOW";
                                    const severity = riskToSeverity[risk] || 'low';

                                    // Generate structured alerts
                                    const parsedAlerts = [{
                                        code: `${key.toUpperCase()}_CAMERA`,
                                        message: `Risk: ${risk}`,
                                        severity,
                                        timestamp: new Date().toISOString()
                                    }];

                                    // Transform backend format to PerceptionData
                                    const perceptionPayload = {
                                        camera: targetRole,
                                        segmentation: value.data || {},
                                        // Map 'report' to 'summary_text'
                                        summary_text: value.report,
                                        // Store risk text as an alert
                                        alerts: [risk],
                                        parsedAlerts,
                                        // Set confidence based on risk (matching useBackendPolling)
                                        confidence: risk === 'LOW' ? 0.85 : risk === 'MEDIUM' ? 0.60 : 0.30,
                                        timestamp: new Date().toISOString(),
                                        raw: value
                                    };

                                    useAppStore.getState().setPerception(targetRole, perceptionPayload);
                                }
                            });
                        } else if (role && data) {
                            // Standard single camera update (if used in future)
                            useAppStore.getState().setPerception(role as CameraRole, data);
                        }
                    }
                } catch (err) {
                    console.error("Failed to parse message:", err);
                }
            };

            ws.onclose = () => {
                console.log("Dashboard disconnected from relay server");
                setIsConnected(false);
            };

            ws.onerror = () => {
                console.warn("WebSocket connection lost or failed. Retrying...");
                setIsConnected(false);
            };

            wsRef.current = ws;
        } catch (err) {
            console.error("Failed to create WebSocket connection:", err);
        }
    }, [serverUrl]);

    // FPS Calculation Loop
    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();
            const elapsed = (now - lastTimeRef.current) / 1000;

            if (elapsed >= 1) {
                const newFps = { ...cameraFps };
                let changed = false;

                (Object.keys(frameCountRef.current) as CameraRole[]).forEach(role => {
                    const count = frameCountRef.current[role];
                    const fps = Math.round(count / elapsed);

                    if (newFps[role] !== fps) {
                        newFps[role] = fps;
                        changed = true;
                    }

                    // Reset counter
                    frameCountRef.current[role] = 0;
                });

                if (changed) {
                    setCameraFps(newFps);
                }

                lastTimeRef.current = now;
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [cameraFps]);

    const disconnect = useCallback(() => {
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }
        setIsConnected(false);
    }, []);

    useEffect(() => {
        return () => {
            disconnect();
        };
    }, [disconnect]);

    // Pause a specific camera (clear its frames)
    const pauseCamera = useCallback((role: CameraRole) => {
        pausedCamerasRef.current[role] = true;
        setPausedCameras(prev => ({ ...prev, [role]: true }));
        // Don't clear frames -> this makes it "freeze" on the last frame
        // setFrames(prev => ({ ...prev, [role]: null }));
        setCameraFps(prev => ({ ...prev, [role]: 0 }));
    }, []);

    // Resume a specific camera (allow frames again)
    const resumeCamera = useCallback((role: CameraRole) => {
        pausedCamerasRef.current[role] = false;
        setPausedCameras(prev => ({ ...prev, [role]: false }));
    }, []);

    return {
        connect,
        disconnect,
        isConnected,
        frames,
        cameraFps,
        cameraStatus,
        pauseCamera,
        resumeCamera,
        pausedCameras
    };
}
