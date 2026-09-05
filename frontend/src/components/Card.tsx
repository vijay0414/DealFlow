import React from "react";

interface CardProps {
    children: React.ReactNode;
    padding?: string;
    className?: string;
}

export default function Card({ children, padding = "p-5", className = "" }: CardProps) {
    return (
        <div className={`bg-white border border-gray-200 rounded-lg ${padding} ${className}`}>
            {children}
        </div>
    );
}
