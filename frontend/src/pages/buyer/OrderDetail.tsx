import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getOrderDetail, negotiate } from "../../api/client";
import type { OrderDetail, NegotiationTurn } from "../../types";
import PageTitle from "../../components/PageTitle";
import Card from "../../components/Card";
import Badge from "../../components/Badge";
import AgentResponseComp from "../../components/AgentResponse";
import TraceTimeline from "../../components/TraceTimeline";
import NegotiationChat from "../../components/NegotiationChat";
import OrderPlacement from "../../components/OrderPlacement";
import LoadingSpinner from "../../components/LoadingSpinner";

export default function OrderDetailPage() {
    const { orderId } = useParams<{ orderId: string }>();
    const navigate = useNavigate();
    const [order, setOrder] = useState<OrderDetail | null>(null);
    const [negotiations, setNegotiations] = useState<NegotiationTurn[]>([]);
    const [loading, setLoading] = useState(true);
    const [negotiating, setNegotiating] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!orderId) return;
        getOrderDetail(orderId)
            .then((res) => {
                const od = res as OrderDetail;
                setOrder(od);
                setNegotiations(od.negotiations || []);
            })
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false));
    }, [orderId]);

    const handleNegotiate = async (message: string) => {
        if (!orderId) return;
        setNegotiating(true);
        try {
            const res = await negotiate(orderId, message) as { answer: string };
            setNegotiations((prev) => [
                ...prev,
                { message, response: res.answer, created_at: new Date().toISOString() },
            ]);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed");
        } finally {
            setNegotiating(false);
        }
    };

    return (
        <div className="max-w-4xl">
            <button
                onClick={() => navigate("/buyer/history")}
                className="text-sm text-gray-400 hover:text-gray-900 mb-4 inline-block transition-colors"
            >
                ← Back to history
            </button>

            {loading && <LoadingSpinner />}
            {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

            {order && (
                <div className="space-y-4">
                    <div className="flex items-start justify-between gap-4">
                        <PageTitle
                            title={order.query.length > 100 ? order.query.slice(0, 100) + "…" : order.query}
                        />
                        <Badge variant={order.status === "error" ? "error" : "default"}>{order.status}</Badge>
                    </div>

                    {order.answer && <AgentResponseComp answer={order.answer} />}
                    {order.trace && order.trace.length > 0 && <TraceTimeline trace={order.trace} />}

                    <Card>
                        <p className="text-sm font-medium text-gray-900 mb-4">
                            Negotiations {negotiations.length > 0 && `(${negotiations.length})`}
                        </p>
                        <NegotiationChat
                            orderId={orderId!}
                            negotiations={negotiations}
                            onSend={handleNegotiate}
                            loading={negotiating}
                        />
                    </Card>

                    {order.trace && order.trace.length > 0 && <OrderPlacement trace={order.trace} />}
                </div>
            )}
        </div>
    );
}
