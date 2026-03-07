"use client";

import React from "react";
import { CameraRole } from "@/types";
import { useAppStore } from "@/lib/state";
import { CameraPanel } from "./CameraPanel";

const CAMERA_ROLES: CameraRole[] = ["front", "rear", "left", "right"];

interface CameraGridProps {
    streamingFrames?: Record<CameraRole, string | null>;
    streamingFps?: Record<CameraRole, number>;
    onStopCamera?: (role: CameraRole) => void;
    onReconnectCamera?: (role: CameraRole) => void;
}

export function CameraGrid({ streamingFrames, streamingFps, onStopCamera, onReconnectCamera }: CameraGridProps) {
    const cameras = useAppStore((state) => state.cameras);
    const isDemoMode = useAppStore((state) => state.isDemoMode);

    return (
        <div className="grid grid-cols-2 gap-4" suppressHydrationWarning>
            {CAMERA_ROLES.map((role) => {
                const camera = cameras[role];
                // Merge streaming FPS if available
                const health = {
                    ...camera.health,
                    fps: streamingFps?.[role] || camera.health.fps
                };

                return (
                    <CameraPanel
                        key={role}
                        role={role}
                        stream={camera.stream?.stream}
                        health={health}
                        frameData={streamingFrames?.[role]}
                        onStart={() => {
                            console.log(`Start ${role} camera`);
                        }}
                        onStop={() => onStopCamera?.(role)}
                        onReconnect={() => onReconnectCamera?.(role)}
                    />
                );
            })}
        </div>
    );
}


