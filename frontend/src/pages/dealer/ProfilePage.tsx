import { useEffect, useState } from "react";
import { getDealerProfile, createDealerProfile, updateDealerProfile } from "../../api/client";
import type { DealerProfile } from "../../types";
import PageTitle from "../../components/PageTitle";
import Card from "../../components/Card";
import Input from "../../components/Input";
import Button from "../../components/Button";
import EmptyState from "../../components/EmptyState";
import LoadingSpinner from "../../components/LoadingSpinner";

export default function ProfilePage() {
    const [profile, setProfile] = useState<DealerProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [noProfile, setNoProfile] = useState(false);

    const [form, setForm] = useState({
        company_name: "",
        location: "",
        reliability_score: "",
        fulfillment_rate: "",
        base_delivery_days: "",
    });

    useEffect(() => {
        getDealerProfile()
            .then((res) => {
                const p = res as DealerProfile;
                setProfile(p);
                setForm({
                    company_name: p.company_name,
                    location: p.location,
                    reliability_score: String(p.reliability_score),
                    fulfillment_rate: String(p.fulfillment_rate),
                    base_delivery_days: String(p.base_delivery_days),
                });
            })
            .catch((e) => {
                if (e.message?.includes("404") || e.message?.includes("not found")) setNoProfile(true);
                else setError(e.message);
            })
            .finally(() => setLoading(false));
    }, []);

    const handleSave = async () => {
        setSaving(true);
        setError("");
        setSuccess(false);
        try {
            const data = {
                company_name: form.company_name,
                location: form.location,
                reliability_score: parseFloat(form.reliability_score),
                fulfillment_rate: parseFloat(form.fulfillment_rate),
                base_delivery_days: parseInt(form.base_delivery_days),
            };
            if (noProfile) {
                const res = await createDealerProfile(data);
                setProfile(res as DealerProfile);
                setNoProfile(false);
            } else {
                await updateDealerProfile(data);
            }
            setSuccess(true);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to save");
        } finally {
            setSaving(false);
        }
    };

    const field = (key: keyof typeof form, label: string, type = "text") => (
        <Input
            label={label}
            value={form[key]}
            onChange={(v) => setForm((f) => ({ ...f, [key]: v }))}
            type={type}
            disabled={saving}
        />
    );

    return (
        <div className="max-w-2xl">
            <PageTitle title="Dealer Profile" />
            {loading && <LoadingSpinner />}
            {!loading && noProfile && (
                <Card className="mb-4">
                    <EmptyState
                        title="No profile yet"
                        description="Create your profile to start listing products and appearing in AI recommendations."
                    />
                    <div className="mt-4 border-t border-gray-100 pt-4 grid grid-cols-2 gap-4">
                        {field("company_name", "Company Name")}
                        {field("location", "Location")}
                        {field("reliability_score", "Reliability Score (0–1)", "number")}
                        {field("fulfillment_rate", "Fulfillment Rate (0–1)", "number")}
                        {field("base_delivery_days", "Base Delivery Days", "number")}
                    </div>
                    {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
                    <div className="mt-4">
                        <Button onClick={handleSave} disabled={saving}>{saving ? "Creating..." : "Create Profile"}</Button>
                    </div>
                </Card>
            )}
            {!loading && !noProfile && (
                <Card>
                    <div className="grid grid-cols-2 gap-4">
                        {field("company_name", "Company Name")}
                        {field("location", "Location")}
                        {field("reliability_score", "Reliability Score (0–1)", "number")}
                        {field("fulfillment_rate", "Fulfillment Rate (0–1)", "number")}
                        {field("base_delivery_days", "Base Delivery Days", "number")}
                    </div>
                    {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
                    {success && <p className="text-sm text-gray-700 bg-gray-100 rounded px-3 py-2 mt-3">Profile saved.</p>}
                    <div className="mt-4 pt-4 border-t border-gray-100">
                        <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button>
                    </div>
                </Card>
            )}
        </div>
    );
}
