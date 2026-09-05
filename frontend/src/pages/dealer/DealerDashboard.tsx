import { useEffect, useState } from "react";
import { getAnalytics, getProducts } from "../../api/client";
import type { Analytics, Product } from "../../types";
import PageTitle from "../../components/PageTitle";
import Card from "../../components/Card";
import EmptyState from "../../components/EmptyState";
import LoadingSpinner from "../../components/LoadingSpinner";
import Badge from "../../components/Badge";

function StatCard({ label, value }: { label: string; value: string | number }) {
    return (
        <Card>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">{label}</p>
            <p className="text-3xl font-bold text-gray-900">{value}</p>
        </Card>
    );
}

function formatDate(dt: string) {
    try { return new Date(dt).toLocaleDateString([], { month: "short", day: "numeric" }); }
    catch { return dt; }
}

export default function DealerDashboard() {
    const [analytics, setAnalytics] = useState<Analytics | null>(null);
    const [productCount, setProductCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            getAnalytics().then((res) => setAnalytics(res as Analytics)),
            getProducts().then((res) => {
                const products = res as Product[];
                setProductCount(products.filter((p) => p.is_active).length);
            }),
        ]).finally(() => setLoading(false));
    }, []);

    return (
        <div className="max-w-6xl">
            <PageTitle title="Dashboard" />
            {loading && <LoadingSpinner />}
            {analytics && (
                <div className="space-y-6">
                    <div className="grid grid-cols-3 gap-4">
                        <StatCard label="Total Recommendations" value={analytics.total_recommendations} />
                        <StatCard label="Average Rank" value={analytics.average_rank ? `#${analytics.average_rank.toFixed(1)}` : "—"} />
                        <StatCard label="Active Products" value={productCount} />
                    </div>

                    <Card>
                        <p className="text-sm font-medium text-gray-900 mb-4">Recent Recommendations</p>
                        {analytics.recent_recommendations.length === 0 ? (
                            <EmptyState
                                title="No recommendations yet"
                                description="The AI will log recommendations when buyers search for your product categories."
                            />
                        ) : (
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-200">
                                        <th className="text-left py-2 text-xs uppercase tracking-wide text-gray-500 font-medium">Query</th>
                                        <th className="text-left py-2 text-xs uppercase tracking-wide text-gray-500 font-medium">Rank</th>
                                        <th className="text-left py-2 text-xs uppercase tracking-wide text-gray-500 font-medium">Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {analytics.recent_recommendations.map((r, i) => (
                                        <tr key={i} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                                            <td className="py-2.5 text-sm text-gray-700 pr-4">
                                                {r.query_text.length > 60 ? r.query_text.slice(0, 60) + "…" : r.query_text}
                                            </td>
                                            <td className="py-2.5">
                                                <Badge>#{r.recommended_rank}</Badge>
                                            </td>
                                            <td className="py-2.5 text-xs text-gray-400">{formatDate(r.created_at)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </Card>
                </div>
            )}
        </div>
    );
}
