"use client";

import React from "react";
import { ConnectionState } from "@/types";

interface ConnectionStatusProps {
    connection: ConnectionState;
}

export function ConnectionStatus({ connection }: ConnectionStatusProps) {
    const getStatusColor = (status: string) => {
        switch (status) {
            case "connected":
                return "bg-green-500";
            case "connecting":
                return "bg-yellow-500";
            case "disconnected":
                return "bg-gray-500";
            case "error":
                return "bg-red-500";
            default:
                return "bg-gray-500";
        }
    };

    return (
        <div className="flex items-center gap-4 text-xs">
            {/* API Status */}
            <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${getStatusColor(connection.api)}`} />
                <span className="text-gray-400">API</span>
            </div>

            {/* WebSocket Status */}
            <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${getStatusColor(connection.websocket)}`} />
                <span className="text-gray-400">WS</span>
            </div>

            {/* Last health check */}
            {connection.lastHealthCheck && (
                <span className="text-gray-500">
                    Last check: {new Date(connection.lastHealthCheck).toLocaleTimeString()}
                </span>
            )}
        </div>
    );
}
