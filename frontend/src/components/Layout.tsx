import React from "react";
import Sidebar from "./Sidebar";

interface LayoutProps {
    children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar />
            <main className="flex-1 min-h-screen p-6 lg:p-8 overflow-y-auto">
                {children}
            </main>
        </div>
    );
}
