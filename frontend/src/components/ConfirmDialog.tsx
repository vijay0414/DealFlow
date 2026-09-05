import Button from "./Button";

interface ConfirmDialogProps {
    open: boolean;
    title: string;
    description: string;
    confirmText?: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export default function ConfirmDialog({ open, title, description, confirmText = "Confirm", onConfirm, onCancel }: ConfirmDialogProps) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
            <div className="bg-white border border-gray-200 rounded-lg p-6 w-full max-w-sm mx-4">
                <h3 className="text-base font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 mb-5">{description}</p>
                <div className="flex gap-2 justify-end">
                    <Button variant="secondary" onClick={onCancel}>Cancel</Button>
                    <Button variant="danger" onClick={onConfirm}>{confirmText}</Button>
                </div>
            </div>
        </div>
    );
}
