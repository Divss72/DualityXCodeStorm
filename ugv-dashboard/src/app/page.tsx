"use client";

import React, { useEffect, useRef } from "react";
import { useAppStore } from "@/lib/state";
import { MockAIGenerator } from "@/lib/demo";
import { parseAIOutput, logInvalidPayload } from "@/lib/parser";
import { useDashboardStreaming } from "@/lib/streaming";
import { useBackendPolling } from "@/lib/streaming/useBackendPolling";
import {
  CameraGrid,
  PerceptionPanel,
  AlertsPanel,
  NLPSummaryPanel,

  ConnectionStatus,
} from "@/components/dashboard";
import { ShaderBackground } from "@/components/ui/shader-background";
import { CameraRole, Alert } from "@/types";

const CAMERA_ROLES: CameraRole[] = ["front", "rear", "left", "right"];

export default function Dashboard() {
  const isDemoMode = useAppStore((state) => state.isDemoMode);
  const perceptions = useAppStore((state) => state.perceptions);
  const connection = useAppStore((state) => state.connection);
  const setPerception = useAppStore((state) => state.setPerception);

  const mockGeneratorRef = useRef<MockAIGenerator | null>(null);

  // Connect to streaming server for receiving phone camera frames
  const streaming = useDashboardStreaming();

  // Poll backend.txt for perception data (when not in demo mode)
  useBackendPolling(1000);

  useEffect(() => {
    if (!isDemoMode) {
      streaming.connect();
    }
    return () => {
      streaming.disconnect();
    };
  }, [isDemoMode]);

  // Handle demo mode AI generation
  useEffect(() => {
    if (isDemoMode) {
      mockGeneratorRef.current = new MockAIGenerator((data) => {
        const result = parseAIOutput(data);
        if (result.success && result.data) {
          setPerception(result.data.camera, result.data);
        } else if (result.error) {
          logInvalidPayload(data, result.error);
        }
      }, 2000);

      mockGeneratorRef.current.start();
    } else {
      mockGeneratorRef.current?.stop();
      mockGeneratorRef.current = null;
    }

    return () => {
      mockGeneratorRef.current?.stop();
    };
  }, [isDemoMode, setPerception]);


  // Collect all alerts from all perceptions
  const allAlerts: Alert[] = CAMERA_ROLES.flatMap((role) => {
    const p = perceptions[role];
    return p?.parsedAlerts || [];
  });

  // Collect all perceptions for NLP summary
  const allPerceptions = CAMERA_ROLES.map((role) => perceptions[role]);

  return (
    <div className="min-h-screen relative">
      {/* Animated Shader Background */}
      <ShaderBackground />

      {/* Header */}
      <header className="border-b border-orange-500/20 bg-black/60 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold bg-gradient-to-r from-orange-300 via-yellow-400 to-amber-300 bg-clip-text text-transparent flex items-center gap-2">
                <span className="text-2xl">🚗</span>
                UGV Perception Dashboard
              </h1>
              <span className="text-xs px-2 py-1 rounded-full bg-orange-500/20 border border-orange-500/30 text-orange-300">
                by CodeStorm ⚡
              </span>
              <ConnectionStatus connection={connection} />
            </div>

            {/* <DemoModeToggle /> Removed */}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Camera Grid (2/3 width on large screens) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Camera Grid */}
            <section>
              <h2 className="text-sm font-medium bg-gradient-to-r from-orange-300 to-yellow-400 bg-clip-text text-transparent uppercase mb-3 flex items-center gap-2">
                <span>📹</span> Camera Feeds
              </h2>
              <CameraGrid
                streamingFrames={streaming.frames}
                streamingFps={streaming.cameraFps}
                onStopCamera={streaming.pauseCamera}
                onReconnectCamera={streaming.resumeCamera}
              />
            </section>

            {/* Perception Panels Grid */}
            <section>
              <h2 className="text-sm font-medium bg-gradient-to-r from-orange-300 to-yellow-400 bg-clip-text text-transparent uppercase mb-3 flex items-center gap-2">
                <span>📊</span> Perception Data
              </h2>
              <div className="grid grid-cols-2 gap-4">
                {CAMERA_ROLES.map((role) => (
                  <PerceptionPanel
                    key={role}
                    camera={role}
                    data={perceptions[role]}
                  />
                ))}
              </div>
            </section>
          </div>

          {/* Right Column - Alerts & NLP (1/3 width on large screens) */}
          <div className="space-y-6">
            {/* Alerts Panel */}
            <section>
              <h2 className="text-sm font-medium bg-gradient-to-r from-orange-300 to-yellow-400 bg-clip-text text-transparent uppercase mb-3 flex items-center gap-2">
                <span>🔔</span> Active Alerts
              </h2>
              <AlertsPanel alerts={allAlerts} />
            </section>

            {/* NLP Summary Panel */}
            <section>
              <h2 className="text-sm font-medium bg-gradient-to-r from-orange-300 to-yellow-400 bg-clip-text text-transparent uppercase mb-3 flex items-center gap-2">
                <span>🧠</span> Scene Analysis
              </h2>
              <NLPSummaryPanel perceptions={allPerceptions} />
            </section>

            {/* Session Info */}
            <section className="rounded-lg bg-black/40 backdrop-blur-sm border border-orange-500/20 p-4">
              <h3 className="text-sm font-medium bg-gradient-to-r from-orange-300 to-yellow-400 bg-clip-text text-transparent mb-3 flex items-center gap-2">
                <span>📱</span> Mobile Camera Connection
              </h3>
              <p className="text-xs text-orange-100/70 mb-3">
                Connect your phone to the same WiFi/Network and visit:<br />
                <span className="font-mono text-orange-300 font-bold bg-black/50 px-2 py-1 rounded mt-1 inline-block">
                  http://172.22.212.34:3000/camera
                </span>
              </p>
              <a
                href="/camera"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center py-2 px-4 rounded-full bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-black text-sm font-medium transition-all hover:scale-105"
              >
                Open Camera Page (Local)
              </a>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-orange-500/20 mt-8 relative z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between text-xs">
            <div className="text-orange-100/50">UGV Perception Dashboard • Team CodeStorm ⚡ • Hackathon Prototype</div>
            <div>
              {isDemoMode ? (
                <span className="text-yellow-400">⚡ Running in Demo Mode</span>
              ) : (
                <span className="text-orange-100/50">🔴 Live Mode</span>
              )}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
