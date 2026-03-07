"use client";

import React, { useRef, useEffect } from "react";
import { CameraRole, StreamHealth } from "@/types";
import { useAppStore } from "@/lib/state";
import { useMockCamera } from "@/lib/demo";

interface CameraPanelProps {
    role: CameraRole;
    stream?: MediaStream | null;
    health: StreamHealth;
    frameData?: string | null; // Base64 frame from streaming
    onStart?: () => void;
    onStop?: () => void;
    onReconnect?: () => void;
    onCapture?: () => void;
}

// Role-specific colors
const ROLE_COLORS: Record<CameraRole, string> = {
    front: "#22c55e",
    rear: "#ef4444",
    left: "#3b82f6",
    right: "#f59e0b",
};

const ROLE_LABELS: Record<CameraRole, string> = {
    front: "FRONT",
    rear: "REAR",
    left: "LEFT",
    right: "RIGHT",
};

export function CameraPanel({
    role,
    stream,
    health,
    frameData,
    onStart,
    onStop,
    onReconnect,
    onCapture,
}: CameraPanelProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const isDemoMode = useAppStore((state) => state.isDemoMode);
    const { canvasRef } = useMockCamera(role);

    // Connect stream to video element
    useEffect(() => {
        if (videoRef.current && stream && !isDemoMode) {
            videoRef.current.srcObject = stream;
        }

        return () => {
            if (videoRef.current) {
                videoRef.current.srcObject = null;
            }
        };
    }, [stream, isDemoMode]);

    const color = ROLE_COLORS[role];
    const isConnected = health.connected || isDemoMode || !!frameData;

    return (
        <div
            className="relative rounded-lg overflow-hidden bg-black border-2 transition-colors"
            style={{ borderColor: isConnected ? color : "#374151" }}
        >
            {/* Header */}
            <div
                className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-3 py-2"
                style={{ backgroundColor: `${color}22` }}
            >
                <div className="flex items-center gap-2">
                    <div
                        className="w-3 h-3 rounded-full"
                        style={{
                            backgroundColor: isConnected ? color : "#6b7280",
                            boxShadow: isConnected ? `0 0 8px ${color}` : "none",
                        }}
                    />
                    <span className="text-white font-bold text-sm">{ROLE_LABELS[role]}</span>
                </div>

                {/* Health indicators */}
                <div className="flex items-center gap-2">
                    {isConnected && (
                        <div className="flex items-center gap-2 bg-black/50 rounded px-2 py-0.5">
                            <span className="text-green-400 font-bold">{health.fps}</span>
                            <span className="text-gray-400 text-xs">FPS</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Video/Canvas display */}
            <div className="aspect-video bg-gray-900 flex items-center justify-center relative overflow-hidden">
                {frameData ? (
                    <img
                        src={frameData}
                        alt={`${role} camera`}
                        className={`w-full h-full ${(role === 'rear' || role === 'right') ? 'object-contain' : 'object-cover'}`}
                        style={(role === 'rear' || role === 'right') ? { transform: 'rotate(-90deg) scale(1.8)' } : undefined}
                    />
                ) : isDemoMode ? (
                    <canvas
                        ref={canvasRef}
                        width={640}
                        height={360}
                        className="w-full h-full object-cover opacity-50"
                    />
                ) : stream ? (
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="text-center text-gray-500">
                        <div className="text-4xl mb-2">📷</div>
                        <div className="text-sm">No stream</div>
                    </div>
                )}

                {/* HUD Overlay */}
                <div className="absolute inset-0 pointer-events-none p-4 opacity-70">
                    <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                        {/* Brackets */}
                        <path d="M2 20 V2 H20" fill="none" stroke={color} strokeWidth="1" vectorEffect="non-scaling-stroke" />
                        <path d="M80 2 H98 V20" fill="none" stroke={color} strokeWidth="1" vectorEffect="non-scaling-stroke" />
                        <path d="M98 80 V98 H80" fill="none" stroke={color} strokeWidth="1" vectorEffect="non-scaling-stroke" />
                        <path d="M20 98 H2 V80" fill="none" stroke={color} strokeWidth="1" vectorEffect="non-scaling-stroke" />
                    </svg>

                    {/* Crosshair */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center opacity-50">
                        <div className="w-full h-[1px]" style={{ backgroundColor: color }} />
                        <div className="h-full w-[1px] absolute" style={{ backgroundColor: color }} />
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="absolute bottom-0 left-0 right-0 z-10 flex items-center justify-center gap-2 p-2 bg-black/30 backdrop-blur-md">
                {!isConnected ? (
                    <button
                        onClick={onStart}
                        className="px-3 py-1 text-xs font-medium rounded bg-green-500/20 hover:bg-green-500/40 border border-green-500/50 text-green-300 backdrop-blur-sm transition-all"
                    >
                        Start
                    </button>
                ) : (
                    <>
                        <button
                            onClick={onStop}
                            className="px-3 py-1 text-xs font-medium rounded bg-red-500/20 hover:bg-red-500/40 border border-red-500/50 text-red-300 backdrop-blur-sm transition-all"
                        >
                            Stop
                        </button>
                        <button
                            onClick={onReconnect}
                            className="px-3 py-1 text-xs font-medium rounded bg-yellow-500/20 hover:bg-yellow-500/40 border border-yellow-500/50 text-yellow-300 backdrop-blur-sm transition-all"
                        >
                            Reconnect
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
