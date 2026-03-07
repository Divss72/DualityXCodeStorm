"use client";

import { useRef, useEffect, useCallback } from "react";
import { CameraRole } from "@/types";

// Mock camera feed using canvas animation
export function useMockCamera(role: CameraRole): {
    canvasRef: React.RefObject<HTMLCanvasElement | null>;
    isActive: boolean;
} {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const animationRef = useRef<number | null>(null);
    const isActiveRef = useRef(true);

    const draw = useCallback((ctx: CanvasRenderingContext2D, time: number) => {
        const { width, height } = ctx.canvas;

        // Dark background with gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, "#1a1a2e");
        gradient.addColorStop(1, "#0f0f1a");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // Role-specific color
        const colors: Record<CameraRole, string> = {
            front: "#22c55e",
            rear: "#ef4444",
            left: "#3b82f6",
            right: "#f59e0b",
        };

        // Draw grid lines (simulating terrain)
        ctx.strokeStyle = `${colors[role]}33`;
        ctx.lineWidth = 1;

        const gridSize = 40;
        const offset = (time * 0.02) % gridSize;

        // Horizontal lines
        for (let y = offset; y < height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }

        // Vertical lines with perspective
        for (let x = 0; x < width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }

        // Draw some "obstacles" (circles)
        const numObstacles = 5;
        for (let i = 0; i < numObstacles; i++) {
            const x = (Math.sin(time * 0.001 + i * 1.5) * 0.5 + 0.5) * width;
            const y = (Math.cos(time * 0.0008 + i * 2) * 0.5 + 0.5) * height;
            const radius = 10 + Math.sin(time * 0.002 + i) * 5;

            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fillStyle = `${colors[role]}66`;
            ctx.fill();
            ctx.strokeStyle = colors[role];
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        // Draw camera label
        ctx.font = "bold 24px monospace";
        ctx.fillStyle = colors[role];
        ctx.textAlign = "center";
        ctx.fillText(`[${role.toUpperCase()}]`, width / 2, 40);

        // Draw "DEMO" watermark
        ctx.font = "12px monospace";
        ctx.fillStyle = "#ffffff44";
        ctx.textAlign = "right";
        ctx.fillText("DEMO MODE", width - 10, height - 10);

        // Draw timestamp
        ctx.textAlign = "left";
        ctx.fillText(new Date().toLocaleTimeString(), 10, height - 10);
    }, [role]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const animate = (time: number) => {
            if (!isActiveRef.current) return;

            draw(ctx, time);
            animationRef.current = requestAnimationFrame(animate);
        };

        isActiveRef.current = true;
        animationRef.current = requestAnimationFrame(animate);

        return () => {
            isActiveRef.current = false;
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [draw]);

    return {
        canvasRef,
        isActive: isActiveRef.current,
    };
}
