import { useEffect, useState } from "react";
import { getBuyerPurchases } from "../../api/client";
import type { PurchaseOrder } from "../../types";
import PageTitle from "../../components/PageTitle";
import Card from "../../components/Card";
import Badge from "../../components/Badge";
import EmptyState from "../../components/EmptyState";
import LoadingSpinner from "../../components/LoadingSpinner";

export default function BuyerPurchases() {
    const [orders, setOrders] = useState<PurchaseOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        getBuyerPurchases()
            .then((res) => setOrders(res as PurchaseOrder[]))
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false));
    }, []);

    const formatDate = (dt: string) => {
        try {
            return new Date(dt).toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
        } catch {
            return dt;
        }
    };

    const getStatusVariant = (status: string) => {
        switch (status) {
            case "pending": return "default";
            case "accepted": return "success";
            case "rejected": return "error";
            case "shipped": return "success";
            case "delivered": return "muted";
            default: return "default";
        }
    };

    return (
        <div className="max-w-6xl">
            <PageTitle title="My Orders" subtitle="Track your placed purchase orders" />
            {loading && <LoadingSpinner />}
            {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded">{error}</p>}
            {!loading && !error && (
                <Card padding="p-0">
                    {orders.length === 0 ? (
                        <EmptyState title="No orders placed yet" description="Find products through AI search to place orders." />
                    ) : (
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200">
                                    <th className="text-left px-4 py-3 text-xs uppercase tracking-wide text-gray-500 font-medium">Product</th>
                                    <th className="text-left px-4 py-3 text-xs uppercase tracking-wide text-gray-500 font-medium">Dealer</th>
                                    <th className="text-left px-4 py-3 text-xs uppercase tracking-wide text-gray-500 font-medium">QTY</th>
                                    <th className="text-left px-4 py-3 text-xs uppercase tracking-wide text-gray-500 font-medium">Total Price</th>
                                    <th className="text-left px-4 py-3 text-xs uppercase tracking-wide text-gray-500 font-medium">Status</th>
                                    <th className="text-left px-4 py-3 text-xs uppercase tracking-wide text-gray-500 font-medium">Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map((o) => (
                                    <tr key={o.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3 text-sm text-gray-900 font-medium">{o.product_name}</td>
                                        <td className="px-4 py-3 text-sm text-gray-700">{o.dealer_name}</td>
                                        <td className="px-4 py-3 text-sm text-gray-700">{o.quantity}</td>
                                        <td className="px-4 py-3 text-sm text-gray-700">${Number(o.total_price).toFixed(2)}</td>
                                        <td className="px-4 py-3">
                                            <Badge variant={getStatusVariant(o.status)}>
                                                {o.status}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-gray-400">{formatDate(o.created_at)}</td>
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
