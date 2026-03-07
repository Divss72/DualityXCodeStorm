"use client";

import React from "react";
import { Alert, AlertSeverity } from "@/types";

interface AlertsPanelProps {
    alerts: Alert[];
}

// Severity colors and icons
const SEVERITY_CONFIG: Record<AlertSeverity, { color: string; bgColor: string; icon: string }> = {
    critical: {
        color: "#ef4444",
        bgColor: "#ef444422",
        icon: "🚨",
    },
    high: {
        color: "#f97316",
        bgColor: "#f9731622",
        icon: "⚠️",
    },
    medium: {
        color: "#eab308",
        bgColor: "#eab30822",
        icon: "⚡",
    },
    low: {
        color: "#22c55e",
        bgColor: "#22c55e22",
        icon: "ℹ️",
    },
};

function AlertItem({ alert }: { alert: Alert }) {
    const config = SEVERITY_CONFIG[alert.severity];

    return (
        <div
            className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${alert.severity === "critical" || alert.severity === "high"
                ? "shadow-[0_0_15px_rgba(239,68,68,0.4)] border-red-500"
                : ""
                }`}
            style={{
                backgroundColor: config.bgColor,
                borderColor: config.color,
            }}
        >
            <span className="text-lg">{config.icon}</span>
            <div className="flex-1 min-w-0">
                <div className="font-medium text-sm" style={{ color: config.color }}>
                    {alert.code.replace(/_/g, " ")}
                </div>
                {alert.message && (
                    <div className="text-xs text-gray-400 truncate">{alert.message}</div>
                )}
            </div>
            <div className="text-xs text-gray-500">
                {new Date(alert.timestamp).toLocaleTimeString()}
            </div>
        </div >
    );
}

export function AlertsPanel({ alerts }: AlertsPanelProps) {
    // Sort by severity (critical first)
    const sortedAlerts = [...alerts].sort((a, b) => {
        const order: AlertSeverity[] = ["critical", "high", "medium", "low"];
        return order.indexOf(a.severity) - order.indexOf(b.severity);
    });

    return (
        <div className="rounded-lg bg-gray-800/50 border border-gray-700 p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <span className="text-lg">🔔</span>
                    <span className="text-sm font-medium text-white">Alerts</span>
                </div>
                <div className="text-xs text-gray-400">
                    {alerts.length} active
                </div>
            </div>

            {/* Alerts list */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
                {sortedAlerts.length > 0 ? (
                    sortedAlerts.map((alert, index) => (
                        <AlertItem key={`${alert.code}-${index}`} alert={alert} />
                    ))
                ) : (
                    <div className="text-center py-4">
                        <div className="text-2xl mb-1">✅</div>
                        <div className="text-sm text-gray-500">No active alerts</div>
                    </div>
                )}
            </div>
        </div>
    );
}
