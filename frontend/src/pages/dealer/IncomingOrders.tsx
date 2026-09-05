import { useEffect, useState } from "react";
import { getDealerPurchases, updatePurchaseStatus } from "../../api/client";
import type { PurchaseOrder } from "../../types";
import PageTitle from "../../components/PageTitle";
import Card from "../../components/Card";
import Badge from "../../components/Badge";
import EmptyState from "../../components/EmptyState";
import LoadingSpinner from "../../components/LoadingSpinner";
import Select from "../../components/Select";
import Button from "../../components/Button";

export default function DealerIncomingOrders() {
    const [orders, setOrders] = useState<PurchaseOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [updating, setUpdating] = useState<string | null>(null);

    const loadOrders = () => {
        getDealerPurchases()
            .then((res) => setOrders(res as PurchaseOrder[]))
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadOrders();
    }, []);

    const handleUpdateStatus = async (poId: string, status: string) => {
        setUpdating(poId);
        setError("");
        try {
            await updatePurchaseStatus(poId, status);
            setOrders(orders.map(o => o.id === poId ? { ...o, status } : o));
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to update status");
        } finally {
            setUpdating(null);
        }
    };

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

    const ALL_STATUSES = [
        { value: "pending", label: "Pending" },
        { value: "accepted", label: "Accepted" },
        { value: "rejected", label: "Rejected" },
        { value: "shipped", label: "Shipped" },
        { value: "delivered", label: "Delivered" }
    ];

    return (
        <div className="max-w-6xl">
            <PageTitle title="Incoming Orders" subtitle="Manage purchase orders received from buyers" />
            {loading && <LoadingSpinner />}
            {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded mb-4">{error}</p>}

            {!loading && (
                <Card padding="p-0">
                    {orders.length === 0 ? (
                        <EmptyState title="No incoming orders" description="Orders placed by buyers will appear here." />
                    ) : (
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200">
                                    <th className="text-left px-4 py-3 text-xs uppercase tracking-wide text-gray-500 font-medium">Product</th>
                                    <th className="text-left px-4 py-3 text-xs uppercase tracking-wide text-gray-500 font-medium">Buyer</th>
                                    <th className="text-left px-4 py-3 text-xs uppercase tracking-wide text-gray-500 font-medium">QTY</th>
                                    <th className="text-left px-4 py-3 text-xs uppercase tracking-wide text-gray-500 font-medium">Total Price</th>
                                    <th className="text-left px-4 py-3 text-xs uppercase tracking-wide text-gray-500 font-medium">Status</th>
                                    <th className="text-left px-4 py-3 text-xs uppercase tracking-wide text-gray-500 font-medium">Date</th>
                                    <th className="text-left px-4 py-3 text-xs uppercase tracking-wide text-gray-500 font-medium">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map((o) => (
                                    <tr key={o.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3 text-sm text-gray-900 font-medium">{o.product_name}</td>
                                        <td className="px-4 py-3 text-sm text-gray-700">{o.buyer_name}</td>
                                        <td className="px-4 py-3 text-sm text-gray-700">{o.quantity}</td>
                                        <td className="px-4 py-3 text-sm text-gray-700">${Number(o.total_price).toFixed(2)}</td>
                                        <td className="px-4 py-3">
                                            <Badge variant={getStatusVariant(o.status)}>
                                                {o.status}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-gray-400">{formatDate(o.created_at)}</td>
                                        <td className="px-4 py-3 max-w-[150px]">
                                            <select
                                                className="w-full border border-gray-200 rounded-md px-2 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-gray-400 bg-white"
                                                value={o.status}
                                                onChange={(e) => handleUpdateStatus(o.id, e.target.value)}
                                                disabled={updating === o.id}
                                            >
                                                {ALL_STATUSES.map(s => (
                                                    <option key={s.value} value={s.value}>{s.label}</option>
                                                ))}
                                            </select>
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
