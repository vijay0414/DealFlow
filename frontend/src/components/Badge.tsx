interface BadgeProps {
    children: React.ReactNode;
    variant?: "default" | "success" | "error" | "muted";
}

export default function Badge({ children, variant = "default" }: BadgeProps) {
    const variants = {
        default: "bg-gray-100 text-gray-700",
        success: "bg-gray-100 text-gray-700",
        error: "bg-red-50 text-red-600",
        muted: "bg-gray-50 text-gray-400",
    };
    return (
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${variants[variant]}`}>
            {children}
        </span>
    );
}
