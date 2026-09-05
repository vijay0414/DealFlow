interface LoadingSpinnerProps {
    text?: string;
}

export default function LoadingSpinner({ text = "Loading..." }: LoadingSpinnerProps) {
    return (
        <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin" />
            <span className="text-sm text-gray-400">{text}</span>
        </div>
    );
}
