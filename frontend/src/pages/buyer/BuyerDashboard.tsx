import { useState } from "react";
import { searchProducts, negotiate } from "../../api/client";
import type { AgentResponse, NegotiationTurn } from "../../types";
import PageTitle from "../../components/PageTitle";
import Card from "../../components/Card";
import Button from "../../components/Button";
import Textarea from "../../components/Textarea";
import LoadingSpinner from "../../components/LoadingSpinner";
import AgentResponseComp from "../../components/AgentResponse";
import TraceTimeline from "../../components/TraceTimeline";
import NegotiationChat from "../../components/NegotiationChat";
import OrderPlacement from "../../components/OrderPlacement";

export default function BuyerDashboard() {
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [negotiating, setNegotiating] = useState(false);
    const [error, setError] = useState("");
    const [result, setResult] = useState<AgentResponse | null>(null);
    const [negotiations, setNegotiations] = useState<NegotiationTurn[]>([]);

    const handleSearch = async () => {
        if (!query.trim()) return;
        setLoading(true);
        setError("");
        setResult(null);
        setNegotiations([]);
        try {
            const res = await searchProducts(query.trim()) as AgentResponse;
            setResult(res);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Search failed");
        } finally {
            setLoading(false);
        }
    };

    const handleNegotiate = async (message: string) => {
        if (!result?.order_id) return;
        setNegotiating(true);
        try {
            const res = await negotiate(result.order_id, message) as { answer: string; created_at?: string };
            setNegotiations((prev) => [
                ...prev,
                { message, response: res.answer, created_at: new Date().toISOString() },
            ]);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Negotiation failed");
        } finally {
            setNegotiating(false);
        }
    };

    return (
        <div className="max-w-4xl">
            <PageTitle title="Find Suppliers" subtitle="Describe what you need in plain English" />

            <Card className="mb-6">
                <Textarea
                    value={query}
                    onChange={setQuery}
                    placeholder='e.g. I need 500 wireless earbuds under $15/unit shipped to Delhi by March 10'
                    rows={4}
                />
                <div className="mt-3 flex items-center gap-3">
                    <Button onClick={handleSearch} disabled={loading || !query.trim()}>
                        {loading ? "Searching..." : "Search"}
                    </Button>
                    {result && (
                        <span className="text-xs text-gray-400">Order ID: {result.order_id}</span>
                    )}
                </div>
            </Card>

            {loading && (
                <Card>
                    <LoadingSpinner text="Agent is searching, comparing, and verifying dealers..." />
                </Card>
            )}

            {error && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3 mb-4">
                    {error}
                </div>
            )}

            {result && !loading && (
                <div className="space-y-4">
                    {result.status === "error" && (
                        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
                            The agent encountered an error. {result.answer}
                        </div>
                    )}
                    {result.answer && <AgentResponseComp answer={result.answer} />}
                    {result.trace && result.trace.length > 0 && <TraceTimeline trace={result.trace} />}

                    <Card>
                        <p className="text-sm font-medium text-gray-900 mb-4">Follow-up Questions</p>
                        <NegotiationChat
                            orderId={result.order_id}
                            negotiations={negotiations}
                            onSend={handleNegotiate}
                            loading={negotiating}
                        />
                    </Card>

                    {result.trace && result.trace.length > 0 && <OrderPlacement trace={result.trace} />}
                </div>
            )}
        </div>
    );
}
