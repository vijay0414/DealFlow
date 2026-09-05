import { useEffect, useState } from "react";
import { getProducts, createProduct, updateProduct, deactivateProduct } from "../../api/client";
import type { Product } from "../../types";
import PageTitle from "../../components/PageTitle";
import Card from "../../components/Card";
import Button from "../../components/Button";
import Input from "../../components/Input";
import Select from "../../components/Select";
import Badge from "../../components/Badge";
import EmptyState from "../../components/EmptyState";
import LoadingSpinner from "../../components/LoadingSpinner";
import ConfirmDialog from "../../components/ConfirmDialog";

const CATEGORIES = [
    { value: "earbuds", label: "Earbuds" },
    { value: "cables", label: "Cables" },
    { value: "keyboards", label: "Keyboards" },
    { value: "stands", label: "Stands" },
    { value: "webcams", label: "Webcams" },
    { value: "other", label: "Other" },
];

const emptyForm = {
    name: "", category: "earbuds", unit_price: "", bulk_discount_pct: "0",
    min_order_qty: "1", stock_available: "", specs: "",
};

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [confirmId, setConfirmId] = useState<string | null>(null);

    useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = () => {
        getProducts()
            .then((res) => setProducts(res as Product[]))
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false));
    };

    const f = (key: keyof typeof form, label: string, type = "text") => (
        <Input label={label} value={form[key]} onChange={(v) => setForm((p) => ({ ...p, [key]: v }))} type={type} />
    );

    const handleSave = async () => {
        setSaving(true);
        setError("");
        try {
            const data = {
                name: form.name, category: form.category,
                unit_price: parseFloat(form.unit_price),
                bulk_discount_pct: parseFloat(form.bulk_discount_pct || "0"),
                min_order_qty: parseInt(form.min_order_qty || "1"),
                stock_available: parseInt(form.stock_available),
                specs: form.specs ? JSON.parse(form.specs) : null,
            };
            if (editId) await updateProduct(editId, data);
            else await createProduct(data);
            setShowForm(false);
            setEditId(null);
            setForm(emptyForm);
            loadProducts();
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to save");
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (p: Product) => {
        setEditId(p.id);
        setForm({
            name: p.name, category: p.category,
            unit_price: String(p.unit_price),
            bulk_discount_pct: String(p.bulk_discount_pct),
            min_order_qty: String(p.min_order_qty),
            stock_available: String(p.stock_available),
            specs: p.specs ? JSON.stringify(p.specs) : "",
        });
        setShowForm(true);
    };

    const handleDeactivate = async () => {
        if (!confirmId) return;
        try {
            await deactivateProduct(confirmId);
            setProducts((prev) => prev.map((p) => p.id === confirmId ? { ...p, is_active: false } : p));
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed");
        } finally {
            setConfirmId(null);
        }
    };

    const filtered = products.filter((p) =>
        filter === "all" ? true : filter === "active" ? p.is_active : !p.is_active
    );

    return (
        <div className="max-w-6xl">
            <div className="flex items-center justify-between mb-6">
                <PageTitle title="Products" subtitle="Manage your product listings" />
                <Button onClick={() => { setShowForm((v) => !v); setEditId(null); setForm(emptyForm); }}>
                    {showForm ? "Cancel" : "Add Product"}
                </Button>
            </div>

            {showForm && (
                <Card className="mb-5">
                    <p className="text-sm font-medium text-gray-900 mb-4">{editId ? "Edit Product" : "New Product"}</p>
                    <div className="grid grid-cols-2 gap-4">
                        {f("name", "Product Name")}
                        <Select label="Category" value={form.category} onChange={(v) => setForm((p) => ({ ...p, category: v }))} options={CATEGORIES} />
                        {f("unit_price", "Unit Price ($)", "number")}
                        {f("bulk_discount_pct", "Bulk Discount (%)", "number")}
                        {f("min_order_qty", "Min Order Qty", "number")}
                        {f("stock_available", "Stock Available", "number")}
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Specs (JSON, optional)</label>
                            <textarea
                                value={form.specs}
                                onChange={(e) => setForm((p) => ({ ...p, specs: e.target.value }))}
                                placeholder='{"color": "black"}'
                                rows={2}
                                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-400 bg-white resize-none font-mono"
                            />
                        </div>
                    </div>
                    {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
                    <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                        <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
                        <Button variant="secondary" onClick={() => { setShowForm(false); setEditId(null); }}>Cancel</Button>
                    </div>
                </Card>
            )}

            <div className="flex gap-1 mb-4">
                {(["all", "active", "inactive"] as const).map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-3 py-1.5 text-sm rounded-md font-medium capitalize transition-colors ${filter === f ? "bg-gray-900 text-white" : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                            }`}
                    >
                        {f}
                    </button>
                ))}
            </div>

            {loading && <LoadingSpinner />}
            {!loading && (
                <Card padding="p-0">
                    {filtered.length === 0 ? (
                        <EmptyState title="No products found" description="Add your first product to get started." />
                    ) : (
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200">
                                    {["Name", "Category", "Price", "Discount", "Min Qty", "Stock", "Status", "Actions"].map((h) => (
                                        <th key={h} className="text-left px-4 py-3 text-xs uppercase tracking-wide text-gray-500 font-medium">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((p) => (
                                    <tr key={p.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3 text-sm text-gray-900 font-medium">{p.name}</td>
                                        <td className="px-4 py-3 text-sm text-gray-500 capitalize">{p.category}</td>
                                        <td className="px-4 py-3 text-sm text-gray-700">${p.unit_price}</td>
                                        <td className="px-4 py-3 text-sm text-gray-500">{p.bulk_discount_pct}%</td>
                                        <td className="px-4 py-3 text-sm text-gray-500">{p.min_order_qty}</td>
                                        <td className="px-4 py-3 text-sm text-gray-500">{p.stock_available}</td>
                                        <td className="px-4 py-3">
                                            <Badge variant={p.is_active ? "success" : "muted"}>
                                                {p.is_active ? "Active" : "Inactive"}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-2">
                                                <button onClick={() => handleEdit(p)} className="text-xs text-gray-500 hover:text-gray-900">Edit</button>
                                                {p.is_active && (
                                                    <button onClick={() => setConfirmId(p.id)} className="text-xs text-red-400 hover:text-red-600">Deactivate</button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </Card>
            )}

            <ConfirmDialog
                open={!!confirmId}
                title="Deactivate Product"
                description="This product will no longer appear in AI recommendations. You can reactivate it later."
                confirmText="Deactivate"
                onConfirm={handleDeactivate}
                onCancel={() => setConfirmId(null)}
            />
        </div>
    );
}
