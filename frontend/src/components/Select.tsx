interface SelectProps {
    label: string;
    value: string;
    onChange: (v: string) => void;
    options: { value: string; label: string }[];
    disabled?: boolean;
    className?: string;
}

export default function Select({ label, value, onChange, options, disabled, className = "" }: SelectProps) {
    return (
        <div className={className}>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-gray-400 bg-white disabled:bg-gray-50 disabled:text-gray-400"
            >
                {options.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                ))}
            </select>
        </div>
    );
}
