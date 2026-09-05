import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface NavItem {
    to: string;
    icon: string;
    label: string;
}

const buyerNav: NavItem[] = [
    { to: "/buyer", icon: "🏠", label: "Home" },
    { to: "/buyer/history", icon: "📋", label: "Search History" },
    { to: "/buyer/purchases", icon: "🛍️", label: "My Orders" },
];

const dealerNav: NavItem[] = [
    { to: "/dealer", icon: "📊", label: "Dashboard" },
    { to: "/dealer/products", icon: "📦", label: "Products" },
    { to: "/dealer/orders", icon: "📥", label: "Incoming Orders" },
    { to: "/dealer/analytics", icon: "📈", label: "Analytics" },
    { to: "/dealer/profile", icon: "👤", label: "Profile" },
];

export default function Sidebar() {
    const { user, logout } = useAuth();
    const location = useLocation();
    const nav = user?.role === "dealer" ? dealerNav : buyerNav;

    return (
        <div className="w-64 h-screen bg-white border-r border-gray-200 flex flex-col sticky top-0">
            <div className="px-5 pt-5 pb-4 border-b border-gray-100">
                <span className="text-lg font-bold text-gray-900 tracking-tight">DealFlow</span>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-0.5">
                {nav.map((item) => {
                    const isActive = item.to === "/buyer" || item.to === "/dealer"
                        ? location.pathname === item.to
                        : location.pathname.startsWith(item.to);
                    return (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${isActive
                                ? "bg-gray-100 text-gray-900 font-medium"
                                : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                                }`}
                        >
                            <span>{item.icon}</span>
                            <span>{item.label}</span>
                        </NavLink>
                    );
                })}
            </nav>
            <div className="px-5 py-4 border-t border-gray-100">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-400 mb-3 capitalize">{user?.role}</p>
                <button
                    onClick={logout}
                    className="text-sm text-gray-400 hover:text-red-600 transition-colors"
                >
                    Sign out
                </button>
            </div>
        </div>
    );
}
