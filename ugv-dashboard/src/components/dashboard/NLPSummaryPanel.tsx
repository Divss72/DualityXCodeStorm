"use client";

import React, { useState, useEffect } from "react";
import { PerceptionData } from "@/types";

function TypewriterText({ text }: { text: string }) {
    const [displayed, setDisplayed] = useState("");

    useEffect(() => {
        setDisplayed("");
        let i = 0;
        const timer = setInterval(() => {
            setDisplayed(text.slice(0, i + 1));
            i++;
            if (i >= text.length) clearInterval(timer);
        }, 30); // 30ms typing speed
        return () => clearInterval(timer);
    }, [text]);

    return <span>{displayed}<span className="text-cyan-400">▍</span></span>;
}

interface NLPSummaryPanelProps {
    perceptions: (PerceptionData | null)[];
}

export function NLPSummaryPanel({ perceptions }: NLPSummaryPanelProps) {
    // Get all summaries with text
    const summaries = perceptions
        .filter((p): p is PerceptionData => p !== null && !!p.summary_text);

    const isDemoFallback = summaries.some(s => s.summary_text?.includes("[DEMO FALLBACK]"));

    return (
        <div className="rounded-lg bg-gray-800/50 border border-gray-700 p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <span className="text-lg">🧠</span>
                    <span className="text-sm font-medium text-white">Scene Analysis</span>
                </div>

                <div className="flex items-center gap-1.5 min-w-[100px] justify-end">
                    <span className="text-gray-600">🕒</span>
                    <span suppressHydrationWarning>{new Date().toLocaleTimeString()}</span>
                </div>

                {isDemoFallback && (
                    <span className="text-xs px-2 py-1 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                        SIMULATION ACTIVE
                    </span>
                )}
            </div>

            {/* All camera reports */}
            <div className="space-y-3 max-h-64 overflow-y-auto">
                {summaries.length > 0 ? (
                    summaries.map((s, i) => (
                        <div key={i} className="p-2 bg-gray-900/50 rounded border border-gray-700">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="uppercase text-xs font-bold text-orange-400">{s.camera}</span>
                                <span className="text-xs text-gray-500">Camera</span>
                            </div>
                            <p className="text-sm text-gray-200 leading-relaxed">
                                {s.summary_text?.replace("[DEMO FALLBACK] ", "")}
                            </p>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-4">
                        <div className="text-2xl mb-1">💭</div>
                        <div className="text-sm text-gray-500">Awaiting scene analysis...</div>
                    </div>
                )}
            </div>
        </div>
    );
}
