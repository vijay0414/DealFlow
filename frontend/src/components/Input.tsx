interface InputProps {
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    type?: string;
    disabled?: boolean;
    className?: string;
}

export default function Input({ label, value, onChange, placeholder, type = "text", disabled, className = "" }: InputProps) {
    return (
        <div className={className}>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                disabled={disabled}
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-400 bg-white disabled:bg-gray-50 disabled:text-gray-400"
            />
        </div>
    );
}
