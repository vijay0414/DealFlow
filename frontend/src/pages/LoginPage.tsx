import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Button from "../components/Button";
import Input from "../components/Input";

export default function LoginPage() {
    const { login, register } = useAuth();
    const navigate = useNavigate();
    const [isRegistering, setIsRegistering] = useState(false);
    const [name, setName] = useState("");
    const [role, setRole] = useState<"buyer" | "dealer">("buyer");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showKey, setShowKey] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleAuth = async () => {
        if (!email || !password || (isRegistering && !name)) { setError("Please fill in all fields"); return; }
        setLoading(true);
        setError("");
        try {
            if (isRegistering) {
                await register(name, email, role, password);
            } else {
                await login(email, password);
            }
            navigate(role === "buyer" ? "/buyer" : "/dealer");
        } catch (e) {
            setError(e instanceof Error ? e.message : "Authentication failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
            <div className="w-full max-w-sm bg-white border border-gray-200 rounded-lg p-8">
                <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">DealFlow</h1>
                    <p className="text-sm text-gray-400 mt-1">AI-Powered B2B Sourcing</p>
                </div>

                {/* Role toggle */}
                <div className="flex rounded-md border border-gray-200 overflow-hidden mb-5">
                    {(["buyer", "dealer"] as const).map((r) => (
                        <button
                            key={r}
                            onClick={() => setRole(r)}
                            className={`flex-1 py-2 text-sm font-medium transition-colors capitalize ${role === r
                                ? "bg-gray-900 text-white"
                                : "bg-white text-gray-500 hover:bg-gray-50"
                                }`}
                        >
                            {r}
                        </button>
                    ))}
                </div>

                <div className="space-y-4">
                    {isRegistering && (
                        <Input label="Name" value={name} onChange={setName} placeholder="Your Name" />
                    )}
                    <Input label="Email" value={email} onChange={setEmail} placeholder="you@company.com" type="email" />
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                        <div className="relative">
                            <input
                                type={showKey ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="your-password"
                                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-400 bg-white pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowKey((v) => !v)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                            >
                                {showKey ? "Hide" : "Show"}
                            </button>
                        </div>
                    </div>

                    {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded px-3 py-2">{error}</p>}

                    <Button type="submit" onClick={handleAuth} disabled={loading} className="w-full justify-center">
                        {loading ? (isRegistering ? "Creating account..." : "Signing in...") : (isRegistering ? "Sign up" : "Sign in")}
                    </Button>
                </div>

                <div className="mt-5 text-center">
                    <button type="button" onClick={() => setIsRegistering(!isRegistering)} className="text-sm text-indigo-600 hover:text-indigo-800 transition-colors">
                        {isRegistering ? "Already have an account? Sign in" : "Need an account? Sign up"}
                    </button>
                </div>

                {!isRegistering && (
                    <p className="text-xs text-gray-400 mt-5 text-center leading-relaxed">
                        Demo: <span className="font-mono">amit@company.com / buy-pass-001</span> (Buyer)
                        <br />
                        <span className="font-mono">rahul@audiotech.com / del-pass-001</span> (Dealer)
                    </p>
                )}
            </div>
        </div>
    );
}
