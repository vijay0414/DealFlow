interface EmptyStateProps {
    icon?: string;
    title: string;
    description?: string;
    action?: React.ReactNode;
}

export default function EmptyState({ icon = "📭", title, description, action }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-4xl text-gray-300 mb-3">{icon}</div>
            <p className="font-medium text-gray-900 text-sm mb-1">{title}</p>
            {description && <p className="text-sm text-gray-500 mb-4">{description}</p>}
            {action}
        </div>
    );
}
