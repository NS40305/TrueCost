'use client';

import Link from 'next/link';
import { useStore, QuickAddPreset } from '@/lib/store';
import { CURRENCIES } from '@/lib/constants';
import { t } from '@/lib/i18n';

interface QuickAddChipsProps {
    onSelect: (item: QuickAddPreset) => void;
}

export default function QuickAddChips({ onSelect }: QuickAddChipsProps) {
    const quickAddItems = useStore((s) => s.quickAddItems);
    const language = useStore((s) => s.language);
    const settings = useStore((s) => s.settings);
    const currencySymbol = CURRENCIES.find((c) => c.code === settings.currency)?.symbol || '$';

    const T = (key: string) => t(language, key);

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                    {T('quickAdd')}
                </p>
                <Link
                    href="/quick-add"
                    className="text-xs font-medium text-accent hover:text-accent-hover transition-colors flex items-center gap-1"
                >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                    {T('customizeQuickAdd')}
                </Link>
            </div>
            <div className="flex flex-wrap gap-2">
                {quickAddItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => onSelect(item)}
                        className="px-3 py-1.5 rounded-full text-xs font-medium bg-accent/10 text-accent hover:bg-accent/20 transition-colors border border-accent/20"
                    >
                        {item.name} · {currencySymbol}{item.price}
                    </button>
                ))}
                {quickAddItems.length === 0 && (
                    <Link
                        href="/quick-add"
                        className="px-3 py-1.5 rounded-full text-xs font-medium bg-accent/10 text-accent hover:bg-accent/20 transition-colors border border-accent/20 border-dashed"
                    >
                        + {T('addNewItem')}
                    </Link>
                )}
            </div>
        </div>
    );
}
