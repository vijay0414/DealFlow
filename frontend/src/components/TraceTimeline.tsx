import { useState } from "react";
import type { TraceStep } from "../types";
import Card from "./Card";

interface TraceTimelineProps {
    trace: TraceStep[];
}

function TraceItem({ step }: { step: TraceStep }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="flex gap-3">
            <div className="flex flex-col items-center">
                <div className="w-6 h-6 rounded-full border-2 border-gray-200 bg-white text-xs text-gray-500 flex items-center justify-center font-mono shrink-0">
                    {step.step}
                </div>
                <div className="w-px flex-1 bg-gray-200 mt-1" />
            </div>
            <div className="pb-4 flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900 font-mono">{step.tool}</span>
                    <span className="text-xs text-gray-400">{step.duration_ms}ms</span>
                </div>
                <button
                    onClick={() => setOpen((v) => !v)}
                    className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                >
                    {open ? "Hide details" : "View details"}
                </button>
                {open && (
                    <div className="mt-2 bg-gray-50 border border-gray-100 rounded p-3 space-y-2">
                        <div>
                            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Input</p>
                            <pre className="text-xs font-mono text-gray-600 whitespace-pre-wrap break-all">
                                {JSON.stringify(step.input, null, 2)}
                            </pre>
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Output</p>
                            <pre className="text-xs font-mono text-gray-600 whitespace-pre-wrap break-all">
                                {JSON.stringify(step.output, null, 2)}
                            </pre>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function TraceTimeline({ trace }: TraceTimelineProps) {
    if (!trace || trace.length === 0) return null;
    return (
        <Card>
            <p className="text-sm font-medium text-gray-900 mb-4">Agent Steps ({trace.length})</p>
            <div>
                {trace.map((step) => (
                    <TraceItem key={step.step} step={step} />
                ))}
            </div>
        </Card>
    );
}
