"use client";

import React from "react";
import { useAppStore } from "@/lib/state";

export function DemoModeToggle() {
    const isDemoMode = useAppStore((state) => state.isDemoMode);
    const setDemoMode = useAppStore((state) => state.setDemoMode);

    return (
        <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400 uppercase tracking-wider font-medium">Simulation Mode</span>
            <button
                onClick={() => setDemoMode(!isDemoMode)}
                className={`relative w-12 h-6 rounded-full transition-colors ${isDemoMode ? "bg-cyan-600" : "bg-gray-600"
                    }`}
            >
                <div
                    className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${isDemoMode ? "translate-x-7" : "translate-x-1"
                        }`}
                />
            </button>
            {isDemoMode && (
                <span className="text-xs px-2 py-1 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                    ACTIVE
                </span>
            )}
        </div>
    );
}
