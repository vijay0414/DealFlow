import { useState } from "react";
import { createPurchaseOrder } from "../api/client";
import type { TraceStep } from "../types";
import Card from "./Card";
import Button from "./Button";
import Select from "./Select";
import Input from "./Input";

interface ProductOption {
    product_id: string;
    name: string;
    company_name: string;
    total_cost: number;
}

interface OrderPlacementProps {
    trace: TraceStep[];
}

export default function OrderPlacement({ trace }: OrderPlacementProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [selectedProductId, setSelectedProductId] = useState<string>("");
    const [quantity, setQuantity] = useState("200");

    let options: ProductOption[] = [];
    try {
        trace.forEach((step) => {
            if (step.tool === "compare_prices" && step.output && Array.isArray((step.output as any).comparison)) {
                (step.output as { comparison: ProductOption[] }).comparison.forEach((o) => {
                    if (!options.find((existing) => existing.product_id === o.product_id)) {
                        options.push(o);
                    }
                });
            }
        });
    } catch (e) {
        // skip
    }

    if (options.length === 0) return null;

    const selectOptions = [
        { value: "", label: "-- Select a product to order --" },
        ...options.map((o) => ({
            value: o.product_id,
            label: `${o.name} (by ${o.company_name}) - Total Cost est: $${o.total_cost}`
        }))
    ];

    const handleOrder = async () => {
        if (!selectedProductId) {
            setError("Please select a product");
            return;
        }
        const qty = parseInt(quantity, 10);
        if (isNaN(qty) || qty <= 0) {
            setError("Please enter a valid quantity");
            return;
        }

        setLoading(true);
        setError("");
        setSuccess(false);

        try {
            await createPurchaseOrder(selectedProductId, qty);
            setSuccess(true);
            setSelectedProductId("");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to place order.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card>
            <p className="text-sm font-medium text-gray-900 mb-4">Place a Purchase Order</p>
            <p className="text-xs text-gray-500 mb-4">
                Ready to buy? Select from the recommendations found by the AI agent to send an order request directly to the dealer.
            </p>

            <div className="space-y-4">
                <Select
                    label="Recommended Product"
                    options={selectOptions}
                    value={selectedProductId}
                    onChange={setSelectedProductId}
                />
                <Input
                    label="Quantity"
                    type="number"
                    value={quantity}
                    onChange={setQuantity}
                />

                {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded px-3 py-2">{error}</p>}
                {success && <p className="text-sm text-gray-700 bg-gray-100 rounded px-3 py-2">Purchase order submitted successfully to the dealer!</p>}

                <Button onClick={handleOrder} disabled={loading || !selectedProductId}>
                    {loading ? "Ordering..." : "Submit Order Request"}
                </Button>
            </div>
        </Card>
    );
}
