import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import LoginPage from "./pages/LoginPage";
import BuyerDashboard from "./pages/buyer/BuyerDashboard";
import OrderHistory from "./pages/buyer/OrderHistory";
import OrderDetail from "./pages/buyer/OrderDetail";
import BuyerPurchases from "./pages/buyer/BuyerPurchases";
import DealerDashboard from "./pages/dealer/DealerDashboard";
import ProductsPage from "./pages/dealer/ProductsPage";
import ProfilePage from "./pages/dealer/ProfilePage";
import IncomingOrders from "./pages/dealer/IncomingOrders";

function AppRoutes() {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="w-5 h-5 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin" />
            </div>
        );
    }

    if (!user) {
        return (
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        );
    }

    if (user.role === "buyer") {
        return (
            <Layout>
                <Routes>
                    <Route path="/buyer" element={<BuyerDashboard />} />
                    <Route path="/buyer/history" element={<OrderHistory />} />
                    <Route path="/buyer/history/:orderId" element={<OrderDetail />} />
                    <Route path="/buyer/purchases" element={<BuyerPurchases />} />
                    <Route path="*" element={<Navigate to="/buyer" replace />} />
                </Routes>
            </Layout>
        );
    }

    return (
        <Layout>
            <Routes>
                <Route path="/dealer" element={<DealerDashboard />} />
                <Route path="/dealer/products" element={<ProductsPage />} />
                <Route path="/dealer/orders" element={<IncomingOrders />} />
                <Route path="/dealer/analytics" element={<DealerDashboard />} />
                <Route path="/dealer/profile" element={<ProfilePage />} />
                <Route path="*" element={<Navigate to="/dealer" replace />} />
            </Routes>
        </Layout>
    );
}

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <AppRoutes />
            </AuthProvider>
        </BrowserRouter>
    );
}

// triggered file update
