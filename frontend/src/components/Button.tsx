import React from "react";

interface ButtonProps {
    variant?: "primary" | "secondary" | "danger";
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    className?: string;
    type?: "button" | "submit" | "reset";
}

export default function Button({
    variant = "primary",
    children,
    onClick,
    disabled,
    className = "",
    type = "button",
}: ButtonProps) {
    const base = "px-4 py-2 text-sm font-medium rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed";
    const variants = {
        primary: "bg-gray-900 text-white hover:bg-gray-800",
        secondary: "bg-white text-gray-900 border border-gray-200 hover:bg-gray-50",
        danger: "bg-white text-red-600 border border-red-200 hover:bg-red-50",
    };
    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`${base} ${variants[variant]} ${className}`}
        >
            {children}
        </button>
    );
}
