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
        <div className="flex w-full p-1 rounded-[10px] gap-0.5"
            style={{ background: 'var(--surface-hover)' }}
        >
            {options.map((opt) => (
                <button
                    key={opt.value}
                    onClick={() => onChange(opt.value)}
                    className={`flex-1 px-2 py-2 rounded-lg text-[13px] font-semibold transition-all cursor-pointer ${value === opt.value
                            ? 'text-foreground'
                            : 'text-muted hover:text-foreground'
                        }`}
                    style={value === opt.value ? { 
                        background: 'var(--surface)',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.08)' 
                    } : undefined}
                >
                    {opt.label}
                </button>
            ))}
        </div>
    );
}
