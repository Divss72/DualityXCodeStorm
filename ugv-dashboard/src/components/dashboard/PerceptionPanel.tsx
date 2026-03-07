"use client";

import React from "react";
import { PerceptionData, SegmentationData, CameraRole } from "@/types";

interface PerceptionPanelProps {
    data: PerceptionData | null;
    camera: CameraRole;
}

// Role-specific colors
const ROLE_COLORS: Record<CameraRole, string> = {
    front: "#22c55e",
    rear: "#ef4444",
    left: "#3b82f6",
    right: "#f59e0b",
};

function SegmentationBar({ label, value, maxValue = 100 }: { label: string; value: number; maxValue?: number }) {
    const percentage = Math.min((value / maxValue) * 100, 100);

    // Color based on value
    const getColor = () => {
        if (value > 50) return "#ef4444"; // red
        if (value > 25) return "#f59e0b"; // orange
        return "#22c55e"; // green
    };

    return (
        <div className="mb-2">
            <div className="flex justify-between text-xs text-gray-300 mb-1">
                <span className="capitalize">{label}</span>
                <span>{value.toFixed(1)}%</span>
            </div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                        width: `${percentage}%`,
                        backgroundColor: getColor(),
                    }}
                />
            </div>
        </div>
    );
}

export function PerceptionPanel({ data, camera }: PerceptionPanelProps) {
    const color = ROLE_COLORS[camera];

    if (!data) {
        return (
            <div className="rounded-lg bg-gray-800/50 border border-gray-700 p-4">
                <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 rounded-full bg-gray-500" />
                    <span className="text-sm font-medium text-gray-400 uppercase">{camera} Perception</span>
                </div>
                <div className="text-center text-gray-500 py-4">
                    <div className="text-2xl mb-1">📊</div>
                    <div className="text-xs">Awaiting data...</div>
                </div>
            </div>
        );
    }

    const segmentation = data.segmentation || {};
    const sortedEntries = Object.entries(segmentation).sort((a, b) => b[1] - a[1]);

    return (
        <div
            className="rounded-lg bg-gray-800/50 border p-4 transition-colors"
            style={{ borderColor: `${color}66` }}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: color }}
                    />
                    <span className="text-sm font-medium text-white uppercase">{camera}</span>
                </div>

                {data.confidence !== undefined && (
                    <div className="text-xs text-gray-400">
                        Conf: <span className="text-white">{(data.confidence * 100).toFixed(0)}%</span>
                    </div>
                )}
            </div>

            {/* Segmentation data */}
            <div className="space-y-1">
                {sortedEntries.length > 0 ? (
                    sortedEntries.map(([key, value]) => (
                        <SegmentationBar key={key} label={key} value={value} />
                    ))
                ) : (
                    <div className="text-xs text-gray-500 text-center py-2">No segmentation data</div>
                )}
            </div>

            {/* Timestamp */}
            <div className="mt-3 pt-2 border-t border-gray-700">
                <div className="text-xs text-gray-500" suppressHydrationWarning>
                    Updated: {new Date(data.timestamp).toLocaleTimeString()}
                </div>
            </div>
        </div>
    );
}
