import { useState } from "react";
import type { NegotiationTurn } from "../types";
import Button from "./Button";
import Textarea from "./Textarea";

interface NegotiationChatProps {
    negotiations: NegotiationTurn[];
    onSend: (message: string) => Promise<void>;
    loading?: boolean;
    orderId: string;
}

function formatDate(dt: string) {
    try {
        return new Date(dt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
        return dt;
    }
}

export default function NegotiationChat({ negotiations, onSend, loading }: NegotiationChatProps) {
    const [message, setMessage] = useState("");

    const handleSend = async () => {
        if (!message.trim() || loading) return;
        const msg = message.trim();
        setMessage("");
        await onSend(msg);
    };

    return (
        <div className="space-y-4">
            {negotiations.length > 0 && (
                <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                    {negotiations.map((turn, i) => (
                        <div key={i} className="space-y-2">
                            {/* User bubble */}
                            <div className="flex justify-end">
                                <div className="max-w-[70%]">
                                    <div className="bg-gray-900 text-white text-sm px-4 py-2.5 rounded-l-lg rounded-br-lg">
                                        {turn.message}
                                    </div>
                                    <p className="text-xs text-gray-400 text-right mt-1">{formatDate(turn.created_at)}</p>
                                </div>
                            </div>
                            {/* Agent bubble */}
                            <div className="flex justify-start">
                                <div className="max-w-[70%]">
                                    <div className="bg-white border border-gray-200 text-gray-800 text-sm px-4 py-2.5 rounded-r-lg rounded-bl-lg">
                                        {turn.response}
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1">{formatDate(turn.created_at)}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            <div className="flex gap-2 items-end border-t border-gray-100 pt-4">
                <Textarea
                    value={message}
                    onChange={setMessage}
                    placeholder="Ask a follow-up question about this order..."
                    rows={2}
                    disabled={loading}
                    className="flex-1"
                />
                <Button onClick={handleSend} disabled={loading || !message.trim()}>
                    {loading ? "..." : "Send"}
                </Button>
            </div>
        </div>
    );
}
