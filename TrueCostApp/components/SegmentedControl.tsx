'use client';

interface SegmentedControlProps<T extends string> {
    options: { label: string; value: T }[];
    value: T;
    onChange: (v: T) => void;
}

export default function SegmentedControl<T extends string>({
    options,
    value,
    onChange,
}: SegmentedControlProps<T>) {
    return (
        <div className="inline-flex p-1 rounded-xl bg-surface-hover gap-1">
            {options.map((opt) => (
                <button
                    key={opt.value}
                    onClick={() => onChange(opt.value)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${value === opt.value
                            ? 'bg-accent text-white shadow-md shadow-accent/25'
                            : 'text-muted hover:text-foreground'
                        }`}
                >
                    {opt.label}
                </button>
            ))}
        </div>
    );
}
