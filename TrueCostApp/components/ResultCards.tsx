'use client';

import { TimeResult, formatHours, formatDays, formatYears } from '@/lib/calculations';
import NumberTicker from '@/components/NumberTicker';

interface ResultCardsProps {
    itemName: string;
    result: TimeResult | null;
}

const cards = [
    {
        label: 'Hours',
        key: 'hours' as const,
        format: formatHours,
        icon: (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
            </svg>
        ),
        gradient: 'from-amber-500/10 to-orange-500/10',
        textColor: 'text-amber-400',
    },
    {
        label: 'Days',
        key: 'days' as const,
        format: formatDays,
        icon: (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-sky-400">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
        ),
        gradient: 'from-sky-500/10 to-cyan-500/10',
        textColor: 'text-sky-400',
    },
    {
        label: 'Years',
        key: 'years' as const,
        format: formatYears,
        icon: (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
                <circle cx="12" cy="12" r="10" />
                <path d="M2 12h20" />
                <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
            </svg>
        ),
        gradient: 'from-emerald-500/10 to-teal-500/10',
        textColor: 'text-emerald-400',
    },
];

export default function ResultCards({ itemName, result }: ResultCardsProps) {
    if (!result) return null;

    return (
        <div className="space-y-4">
            {/* Header */}
            <p className="text-sm text-muted text-center">
                To buy <span className="font-semibold text-foreground">{itemName || 'this item'}</span>, you need to work:
            </p>

            {/* Cards grid */}
            <div className="grid grid-cols-3 gap-3">
                {cards.map((card) => (
                    <div
                        key={card.key}
                        className={`glass-card p-4 flex flex-col items-center gap-2 bg-gradient-to-br ${card.gradient}`}
                    >
                        {card.icon}
                        <NumberTicker
                            value={result[card.key]}
                            className={`text-2xl font-bold tabular-nums ${card.textColor}`}
                            animationDuration={0.6}
                        />
                        <span className="text-xs text-muted uppercase tracking-wider font-medium">
                            {card.label}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
