'use client';

import { useMemo, useState } from 'react';
import type { ShoppingItem } from '@/lib/store';
import { t } from '@/lib/i18n';
import type { Language } from '@/lib/i18n';

const CATEGORY_COLORS: Record<string, string> = {
    'Food & Drink': '#FF6B6B',
    'Electronics': '#4ECDC4',
    'Clothing': '#45B7D1',
    'Entertainment': '#96CEB4',
    'Transport': '#FBBF24',
    'Housing': '#A78BFA',
    'Health': '#34D399',
    'Education': '#F472B6',
    'Other': '#94A3B8',
};

interface CategoryData {
    category: string;
    total: number;
    count: number;
    percentage: number;
    color: string;
}

interface SpendingChartProps {
    items: ShoppingItem[];
    currencySymbol: string;
    totalSpent: number;
    language: Language;
}

const MAX_VISIBLE = 5;

export default function SpendingChart({ items, currencySymbol, totalSpent, language }: SpendingChartProps) {
    const T = (key: string) => t(language, key);
    const [expanded, setExpanded] = useState(false);

    const categories = useMemo(() => {
        const map = new Map<string, { total: number; count: number }>();
        items.forEach(item => {
            const existing = map.get(item.category) || { total: 0, count: 0 };
            map.set(item.category, {
                total: existing.total + item.price,
                count: existing.count + 1,
            });
        });

        const result: CategoryData[] = [];
        map.forEach((data, cat) => {
            result.push({
                category: cat,
                total: data.total,
                count: data.count,
                percentage: totalSpent > 0 ? (data.total / totalSpent) * 100 : 0,
                color: CATEGORY_COLORS[cat] || '#94A3B8',
            });
        });

        return result.sort((a, b) => b.total - a.total);
    }, [items, totalSpent]);

    if (items.length === 0) return null;

    // Donut chart constants
    const R = 70;
    const SW = 32;
    const C = 2 * Math.PI * R;
    const GAP = categories.length > 1 ? 4 : 0;

    let offset = 0;
    const segments = categories.map((cat) => {
        const segLen = (cat.percentage / 100) * C;
        const visible = Math.max(0, segLen - GAP);
        const myOffset = offset + GAP / 2;
        offset += segLen;

        return (
            <circle
                key={cat.category}
                cx="100" cy="100" r={R}
                fill="none"
                stroke={cat.color}
                strokeWidth={SW}
                strokeDasharray={`${visible} ${C - visible}`}
                strokeDashoffset={-myOffset}
                strokeLinecap="butt"
                className="transition-all duration-700 ease-out"
            />
        );
    });

    const visibleCategories = expanded ? categories : categories.slice(0, MAX_VISIBLE);
    const topCat = categories[0];

    return (
        <div className="glass-card p-5 rounded-2xl space-y-5">
            {/* Header */}
            <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
                        <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
                        <path d="M22 12A10 10 0 0 0 12 2v10z" />
                    </svg>
                </div>
                <h3 className="font-bold text-base">{T('spendingByCategory')}</h3>
            </div>

            {/* Insight */}
            <p className="text-sm text-muted leading-relaxed">
                <span className="font-semibold" style={{ color: topCat.color }}>{T(topCat.category)}</span>
                {' '}{T('topCategoryInsight')}{' '}
                <span className="font-bold text-accent">{topCat.percentage.toFixed(1)}%</span>
            </p>

            {/* Donut Chart */}
            <div className="flex justify-center py-2 animate-chart-in">
                <svg viewBox="0 0 200 200" className="w-52 h-52" role="img" aria-label={T('spendingByCategory')}>
                    {/* Background ring */}
                    <circle cx="100" cy="100" r={R} fill="none" stroke="var(--surface-hover)" strokeWidth={SW} />

                    {/* Data segments */}
                    <g transform="rotate(-90 100 100)">
                        {segments}
                    </g>

                    {/* Center text */}
                    <text x="100" y="90" textAnchor="middle" fill="var(--muted)" fontSize="11" fontWeight="500">
                        {T('totalSpent')}
                    </text>
                    <text x="100" y="114" textAnchor="middle" fill="var(--foreground)" fontSize="18" fontWeight="700" fontFamily="var(--font-sans, system-ui)">
                        {currencySymbol}{totalSpent.toLocaleString()}
                    </text>
                </svg>
            </div>

            {/* Divider */}
            <div className="border-t border-border" />

            {/* Category Ranking */}
            <div className="space-y-1">
                {visibleCategories.map((cat, i) => (
                    <div
                        key={cat.category}
                        className="flex items-center justify-between py-2 animate-category-row"
                        style={{ animationDelay: `${i * 60}ms` }}
                    >
                        <div className="flex items-center gap-2.5 min-w-0">
                            <span className="text-sm font-bold w-5 shrink-0 tabular-nums" style={{ color: cat.color }}>
                                {i + 1}.
                            </span>
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: cat.color }} />
                            <span className="text-sm font-medium truncate">{T(cat.category)}</span>
                            <span className="text-xs text-muted shrink-0">{cat.percentage.toFixed(1)}%</span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0 ml-2">
                            <span className="text-sm font-semibold tabular-nums">
                                {currencySymbol}{cat.total.toLocaleString()}
                            </span>
                            <span className="text-xs text-muted">({cat.count})</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Show all / Show less */}
            {categories.length > MAX_VISIBLE && (
                <button
                    onClick={() => setExpanded(!expanded)}
                    className="w-full text-center text-sm text-muted hover:text-accent transition-colors py-1 flex items-center justify-center gap-1 cursor-pointer"
                >
                    {expanded ? T('showLess') : T('showAll')}
                    <svg
                        width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                        className={`transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
                    >
                        <polyline points="6 9 12 15 18 9" />
                    </svg>
                </button>
            )}
        </div>
    );
}
