"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { CameraRole } from "@/types";
import { useCamera } from "@/lib/camera/useCamera";
import { useFrameStreaming } from "@/lib/streaming/useFrameStreaming";
import { useAppStore } from "@/lib/state";
import { ShaderBackground } from "@/components/ui/shader-background";

const CAMERA_ROLES: { role: CameraRole; label: string; color: string }[] = [
    { role: "front", label: "Front Camera", color: "#22c55e" },
    { role: "rear", label: "Rear Camera", color: "#ef4444" },
    { role: "left", label: "Left Camera", color: "#3b82f6" },
    { role: "right", label: "Right Camera", color: "#f59e0b" },
];

export default function CameraPage() {
    const [selectedRole, setSelectedRole] = useState<CameraRole | null>(null);
    const [sessionCode, setSessionCode] = useState<string>("");
    const [isJoined, setIsJoined] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);

    // Generate a random session code on mount
    useEffect(() => {
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
        setSessionCode(code);
    }, []);

    // Use the camera hook when role is selected
    const camera = useCamera({
        role: selectedRole || "front",
        autoStart: false
    });

    // Memoize the update function
    const updateHealth = useAppStore(useCallback(state => state.updateCameraHealth, []));

    // Stable callback for FPS updates from streaming
    const handleFpsUpdate = useCallback((fps: number) => {
        if (selectedRole) {
            updateHealth(selectedRole, { fps });
        }
    }, [selectedRole, updateHealth]);

    // Use streaming hook
    const streaming = useFrameStreaming({
        role: selectedRole || "front",
        onFpsUpdate: handleFpsUpdate
    });

    // Start streaming when video is ready
    useEffect(() => {
        if (camera.stream && videoRef.current && streaming.isConnected) {
            streaming.startStreaming(videoRef.current);
        }
        return () => {
            streaming.stopStreaming();
        };
    }, [camera.stream, streaming.isConnected]);

    // Ensure video element has stream source
    useEffect(() => {
        if (videoRef.current && camera.stream) {
            videoRef.current.srcObject = camera.stream;
        }
    }, [camera.stream, isJoined]);

    const handleJoinSession = () => {
        if (selectedRole && sessionCode) {
            setIsJoined(true);
            camera.startStream();
            streaming.connect();
        }
    };

    const handleLeaveSession = () => {
        streaming.disconnect();
        camera.stopStream();
        setIsJoined(false);
        setSelectedRole(null);
    };

    // Show camera stream view when joined
    if (isJoined && selectedRole) {
        const roleConfig = CAMERA_ROLES.find((r) => r.role === selectedRole)!;

        return (
            <div className="min-h-screen bg-black flex flex-col">
                {/* Header */}
                <header
                    className="p-4 flex items-center justify-between"
                    style={{ backgroundColor: `${roleConfig.color}22` }}
                >
                    <div className="flex items-center gap-3">
                        <div
                            className="w-3 h-3 rounded-full animate-pulse"
                            style={{ backgroundColor: roleConfig.color }}
                        />
                        <span className="text-white font-bold">{roleConfig.label}</span>
                        {streaming.isConnected && (
                            <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">
                                📡 Streaming
                            </span>
                        )}
                    </div>
                    <div className="text-xs text-gray-400">
                        Session: <span className="text-white font-mono">{sessionCode}</span>
                    </div>
                </header>

                {/* Camera View */}
                <div className="flex-1 relative flex items-center justify-center">
                    {camera.stream ? (
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="max-w-full max-h-full w-auto h-auto object-contain rounded-lg shadow-2xl"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center p-6">
                            <div className="text-center max-w-sm">
                                {camera.error ? (
                                    <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-left">
                                        <div className="flex items-center gap-2 text-red-500 mb-2 font-bold">
                                            <span>⚠️</span> Camera Error
                                        </div>
                                        <p className="text-red-400 text-sm mb-4">{camera.error}</p>

                                        <div className="bg-black/40 rounded p-3 text-xs text-gray-300 space-y-2">
                                            {camera.error.includes("Secure context") ? (
                                                <>
                                                    <p className="font-bold text-white">How to fix (HTTPS issue):</p>
                                                    <ol className="list-decimal pl-4 space-y-1">
                                                        <li>Open <code>chrome://flags</code></li>
                                                        <li>Search for <span className="text-yellow-400">"insecure origins"</span></li>
                                                        <li>Enable <b>"Insecure origins treated as secure"</b></li>
                                                        <li>Add: <span className="font-mono text-white">http://172.22.212.34:3000</span></li>
                                                        <li>Relaunch Chrome</li>
                                                    </ol>
                                                </>
                                            ) : (
                                                <>
                                                    <p className="font-bold text-white">How to fix:</p>
                                                    <ul className="list-disc pl-4 space-y-1">
                                                        <li>Close other apps using the camera</li>
                                                        <li>Check Android Settings &gt; Apps &gt; Chrome &gt; Permissions</li>
                                                        <li>Tap lock icon 🔒 in address bar &gt; Reset permissions</li>
                                                        <li>Refresh this page</li>
                                                    </ul>
                                                    <div className="pt-2">
                                                        <button
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                if (camera.toggleCamera) camera.toggleCamera();
                                                            }}
                                                            className="w-full py-2 bg-blue-500/30 hover:bg-blue-500/50 text-blue-200 text-xs font-bold rounded border border-blue-500/50 transition-all flex items-center justify-center gap-2"
                                                        >
                                                            <span>🔄 Try Switching Camera</span>
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="text-4xl mb-2">📷</div>
                                        <div className="text-gray-500">Starting camera...</div>
                                    </>
                                )}
                            </div>
                        </div>
                    )
                    }

                    {/* Health indicators overlay */}
                    <div className="absolute top-4 right-4 bg-black/70 rounded-lg p-3 text-white border border-green-500/30">
                        <div className="flex items-center gap-3">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-green-400">{camera.health.fps}</div>
                                <div className="text-xs text-gray-400">FPS</div>
                            </div>
                            <div className={`w-3 h-3 rounded-full ${camera.health.connected ? "bg-green-400 animate-pulse" : "bg-red-400"}`} />
                        </div>
                    </div>
                </div >

                {/* Controls */}
                < div className="p-4 bg-gray-900 flex items-center justify-between" >
                    <button
                        onClick={() => camera.reconnect()}
                        className="px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/40 border border-yellow-500/50 text-yellow-300 rounded-lg text-sm font-medium transition-all"
                    >
                        Reconnect
                    </button>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => camera.toggleCamera()}
                            className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/40 border border-blue-500/50 text-blue-300 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
                        >
                            <span>Switch Cam</span>
                            <span>🔄</span>
                        </button>
                    </div>

                    <button
                        onClick={handleLeaveSession}
                        className="px-4 py-2 bg-red-500/20 hover:bg-red-500/40 border border-red-500/50 text-red-300 rounded-lg text-sm font-medium transition-all"
                    >
                        Leave
                    </button>
                </div >
            </div >
        );
    }

    // Show role selection view with shader background
    return (
        <div className="min-h-screen relative flex items-center justify-center p-4">
            {/* Animated Shader Background */}
            <ShaderBackground />

            <div className="w-full max-w-md relative z-10">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-300 via-yellow-400 to-amber-300 bg-clip-text text-transparent mb-2 flex items-center justify-center gap-2">
                        <span className="text-3xl">📱</span>
                        Camera Setup
                    </h1>
                    <p className="text-orange-100/70 text-sm">
                        Select your camera role and join the session
                    </p>
                </div>

                {/* Role Selection */}
                <div className="space-y-3 mb-6">
                    <label className="block text-xs text-orange-300/70 mb-2">Select Camera Role</label>
                    {CAMERA_ROLES.map(({ role, label, color }) => (
                        <button
                            key={role}
                            onClick={() => setSelectedRole(role)}
                            className={`w-full p-4 rounded-lg border-2 transition-all flex items-center gap-4 backdrop-blur-sm ${selectedRole === role
                                ? "bg-black/50"
                                : "bg-black/30 hover:bg-black/40"
                                }`}
                            style={{
                                borderColor: selectedRole === role ? color : "rgba(249, 115, 22, 0.2)",
                            }}
                        >
                            <div
                                className="w-4 h-4 rounded-full"
                                style={{ backgroundColor: color }}
                            />
                            <span className="text-orange-100 font-medium">{label}</span>
                            {selectedRole === role && (
                                <span className="ml-auto text-green-400">✓</span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Join Button */}
                <button
                    onClick={handleJoinSession}
                    disabled={!selectedRole || !sessionCode}
                    className={`w-full py-4 rounded-full font-medium text-lg transition-all ${selectedRole && sessionCode
                        ? "bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-black hover:scale-105"
                        : "bg-gray-700/50 text-gray-500 cursor-not-allowed"
                        }`}
                >
                    Join Session
                </button>

                {/* Back link */}
                <a
                    href="/"
                    className="block text-center mt-4 text-sm text-orange-300/70 hover:text-orange-100 transition-colors"
                >
                    ← Back to Dashboard
                </a>
            </div>
        </div>
    );
}
