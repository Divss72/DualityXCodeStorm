"use client";

import { useEffect, useRef } from "react";
import { useAppStore } from "@/lib/state";
import { CameraRole } from "@/types";

interface BackendData {
    [key: string]: {
        risk: string;
        report: string;
        data: Record<string, number>;
    };
}

export function useBackendPolling(intervalMs: number = 1000) {
    const setPerception = useAppStore((state) => state.setPerception);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch('/api/perception');
                if (!res.ok) return;

                const data: BackendData = await res.json();

                // Map backend camera names to our CameraRole type
                const roleMap: Record<string, CameraRole> = {
                    'Front': 'front',
                    'Rear': 'rear',
                    'Left': 'left',
                    'Right': 'right'
                };

                Object.entries(data).forEach(([camName, camData]) => {
                    const role = roleMap[camName];
                    if (!role) return;

                    // Map risk level to severity
                    const riskToSeverity: Record<string, "low" | "medium" | "high" | "critical"> = {
                        'LOW': 'low',
                        'MEDIUM': 'medium',
                        'HIGH': 'high',
                        'CRITICAL': 'critical'
                    };
                    const severity = riskToSeverity[camData.risk] || 'low';

                    // Generate alert if risk is not LOW
                    const parsedAlerts = [{
                        code: `${camName.toUpperCase()}_CAMERA`,
                        message: `Risk: ${camData.risk}`,
                        severity,
                        timestamp: new Date().toISOString()
                    }];

                    // Convert backend format to PerceptionData format
                    const perception = {
                        camera: role,
                        confidence: camData.risk === 'LOW' ? 85 : camData.risk === 'MEDIUM' ? 60 : 30,
                        segmentation: {
                            sand: camData.data.sand || 0,
                            rocks: camData.data.rocks || 0,
                            bushes: camData.data.bushes || 0,
                            plants: camData.data.plants || 0,
                            sky: camData.data.sky || 0,
                            gravel: camData.data.gravel || 0,
                            vegetation: camData.data.vegetation || 0,
                            "offroad path": camData.data.offroad_path || 0,
                            hills: camData.data.hills || 0
                        },
                        summary_text: camData.report,
                        parsedAlerts,
                        timestamp: new Date().toISOString()
                    };

                    setPerception(role, perception);
                });

            } catch (error) {
                // Silently fail - backend.txt may not exist yet
            }
        };

        // Initial fetch
        fetchData();

        // Start polling
        intervalRef.current = setInterval(fetchData, intervalMs);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [intervalMs, setPerception]);
}
