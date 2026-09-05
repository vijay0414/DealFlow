import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getOrderHistory } from "../../api/client";
import type { OrderSummary } from "../../types";
import PageTitle from "../../components/PageTitle";
import Card from "../../components/Card";
import Badge from "../../components/Badge";
import EmptyState from "../../components/EmptyState";
import LoadingSpinner from "../../components/LoadingSpinner";

function formatDate(dt: string) {
    try { return new Date(dt).toLocaleDateString([], { year: "numeric", month: "short", day: "numeric" }); }
    catch { return dt; }
}

export default function OrderHistory() {
    const navigate = useNavigate();
    const [orders, setOrders] = useState<OrderSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        getOrderHistory()
            .then((res) => setOrders((res as { orders: OrderSummary[] }).orders || []))
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="max-w-6xl">
            <PageTitle title="Order History" />
            {loading && <LoadingSpinner />}
            {error && <p className="text-sm text-red-600">{error}</p>}
            {!loading && !error && (
                <Card padding="p-0">
                    {orders.length === 0 ? (
                        <EmptyState title="No searches yet" description="Try searching for a product on the Home page" />
                    ) : (
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200">
                                    <th className="text-left px-4 py-3 text-xs uppercase tracking-wide text-gray-500 font-medium">Query</th>
                                    <th className="text-left px-4 py-3 text-xs uppercase tracking-wide text-gray-500 font-medium">Status</th>
                                    <th className="text-left px-4 py-3 text-xs uppercase tracking-wide text-gray-500 font-medium">Date</th>
                                    <th className="text-left px-4 py-3 text-xs uppercase tracking-wide text-gray-500 font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map((o) => (
                                    <tr key={o.order_id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3 text-sm text-gray-700 max-w-xs truncate">
                                            {o.query.length > 60 ? o.query.slice(0, 60) + "…" : o.query}
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge variant={o.status === "error" ? "error" : "default"}>
                                                {o.status}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-gray-400">{formatDate(o.created_at)}</td>
                                        <td className="px-4 py-3">
                                            <button
                                                onClick={() => navigate(`/buyer/history/${o.order_id}`)}
                                                className="text-sm text-gray-500 hover:text-gray-900 underline"
                                            >
                                                View
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </Card>
            )}
        </div>
    );
}
