'use client';

import { QUICK_ADD_PRESETS, QuickAddItem } from '@/lib/constants';

interface QuickAddChipsProps {
    onSelect: (item: QuickAddItem) => void;
}

export default function QuickAddChips({ onSelect }: QuickAddChipsProps) {
    return (
        <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                Quick add
            </p>
            <div className="flex flex-wrap gap-2">
                {QUICK_ADD_PRESETS.map((item) => (
                    <button
                        key={item.name}
                        onClick={() => onSelect(item)}
                        className="px-3 py-1.5 rounded-full text-xs font-medium bg-accent/10 text-accent hover:bg-accent/20 transition-colors border border-accent/20"
                    >
                        {item.name} · ${item.price}
                    </button>
                ))}
            </div>
        </div>
    );
}
