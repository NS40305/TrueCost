'use client';

import { useMemo } from 'react';
import type { ShoppingItem } from '@/lib/store';
import { t } from '@/lib/i18n';
import type { Language } from '@/lib/i18n';

interface SpendingTrendProps {
    items: ShoppingItem[];
    allItems: ShoppingItem[];
    currencySymbol: string;
    currencyCode: string;
    language: Language;
    mode: 'weekly' | 'monthly';
    /** The reference date that defines the current period */
    currentDate: Date;
}

/** Mon 00:00 … next-Mon 00:00 for the ISO week containing `date`. */
function getWeekBounds(date: Date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const mon = new Date(d.getFullYear(), d.getMonth(), d.getDate() + diff);
    const nextMon = new Date(mon);
    nextMon.setDate(nextMon.getDate() + 7);
    return { start: mon, end: nextMon };
}

/**
 * Stock-market color conventions by currency:
 *  - JPY, CNY, TWD  →  RED = up,  GREEN = down  (Asian markets)
 *  - USD, CAD, EUR, GBP, AUD, INR, etc. → GREEN = up, RED = down (Western markets)
 */
function getMarketColors(currencyCode: string) {
    const asianCurrencies = ['JPY', 'CNY', 'TWD'];
    const isAsian = asianCurrencies.includes(currencyCode);
    return {
        up:   isAsian ? '#ef4444' : '#22c55e',   // red / green
        down: isAsian ? '#22c55e' : '#ef4444',   // green / red
    };
}

export default function SpendingTrend({ items, allItems, currencySymbol, currencyCode, language, mode, currentDate }: SpendingTrendProps) {
    const T = (key: string) => t(language, key);
    const marketColors = getMarketColors(currencyCode);

    const { labels, values, todayIdx } = useMemo(() => {
        const locale = language === 'en' ? 'en-US' : language;
        const now = new Date();

        if (mode === 'weekly') {
            const { start } = getWeekBounds(currentDate);
            const buckets = Array(7).fill(0);

            items.forEach(item => {
                const d = new Date(item.completedAt || item.addedAt);
                const diff = Math.floor((d.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
                if (diff >= 0 && diff < 7) buckets[diff] += item.price;
            });

            const dayLabels = Array.from({ length: 7 }, (_, i) => {
                const d = new Date(start);
                d.setDate(d.getDate() + i);
                return d.toLocaleDateString(locale, { weekday: 'short' }).slice(0, 3);
            });

            let today = -1;
            const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
            const weekStart = start.getTime();
            const dayDiff = Math.floor((todayStart - weekStart) / (24 * 60 * 60 * 1000));
            if (dayDiff >= 0 && dayDiff < 7) today = dayDiff;

            return { labels: dayLabels, values: buckets, todayIdx: today };
        } else {
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const buckets = Array(daysInMonth).fill(0);

            items.forEach(item => {
                const d = new Date(item.completedAt || item.addedAt);
                if (d.getFullYear() === year && d.getMonth() === month) {
                    buckets[d.getDate() - 1] += item.price;
                }
            });

            const step = daysInMonth <= 28 ? 7 : 5;
            const dayLabels = Array.from({ length: daysInMonth }, (_, i) => {
                if (i === 0 || i === daysInMonth - 1 || (i + 1) % step === 0) return `${i + 1}`;
                return '';
            });

            let today = -1;
            if (now.getFullYear() === year && now.getMonth() === month) {
                today = now.getDate() - 1;
            }

            return { labels: dayLabels, values: buckets, todayIdx: today };
        }
    }, [items, mode, currentDate, language]);

    // ── Previous period comparison ──
    const comparison = useMemo(() => {
        const currentTotal = items.reduce((sum, i) => sum + i.price, 0);
        let prevStart: Date, prevEnd: Date;

        if (mode === 'weekly') {
            const { start } = getWeekBounds(currentDate);
            prevStart = new Date(start);
            prevStart.setDate(prevStart.getDate() - 7);
            prevEnd = new Date(start);
        } else {
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();
            prevStart = new Date(year, month - 1, 1);
            prevEnd = new Date(year, month, 1);
        }

        const prevTotal = (allItems || [])
            .filter(i => {
                const d = new Date(i.completedAt || i.addedAt);
                return d >= prevStart && d < prevEnd;
            })
            .reduce((sum, i) => sum + i.price, 0);

        if (prevTotal === 0 && currentTotal === 0) return null;

        const diff = currentTotal - prevTotal;
        if (diff === 0) return { amount: 0, direction: 'flat' as const };
        return { amount: Math.abs(Math.round(diff)), direction: diff > 0 ? 'up' as const : 'down' as const };
    }, [items, allItems, mode, currentDate]);

    if (items.length === 0) return null;

    const maxVal = Math.max(...values, 1);
    const barCount = values.length;

    // SVG dimensions — compute dynamically so bars always fit
    const padL = 8;
    const padR = 8;
    const padT = 24;  // enough room for value labels above bars
    const padB = 32;  // enough room for day labels + today dot
    const barGap = mode === 'weekly' ? 16 : 2;
    const barW = mode === 'weekly' ? 40 : 10;
    const drawW = barCount * barW + (barCount - 1) * barGap;
    const chartW = padL + drawW + padR;
    const drawH = 120;
    const chartH = padT + drawH + padB;

    // Average line
    const nonZeroVals = values.filter(v => v > 0);
    const avg = nonZeroVals.length > 0 ? nonZeroVals.reduce((a, b) => a + b, 0) / nonZeroVals.length : 0;
    const avgY = padT + drawH - (avg / maxVal) * drawH;

    // Use a key that changes when data changes to force SVG re-mount and replay CSS animations
    const chartKey = `${mode}-${currentDate.getTime()}-${items.length}`;

    return (
        <div className="glass-card p-5 rounded-2xl space-y-4">
            {/* Header */}
            <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
                        <line x1="18" y1="20" x2="18" y2="10" />
                        <line x1="12" y1="20" x2="12" y2="4" />
                        <line x1="6" y1="20" x2="6" y2="14" />
                    </svg>
                </div>
                <h3 className="font-bold text-base flex-1">{T('spendingTrend')}</h3>
                {comparison && comparison.direction !== 'flat' && (
                    <span
                        className="inline-flex items-center gap-0.5 text-xs font-bold px-2 py-1 rounded-lg"
                        style={{
                            color: comparison.direction === 'up' ? marketColors.up : marketColors.down,
                            backgroundColor: comparison.direction === 'up'
                                ? `${marketColors.up}15`
                                : `${marketColors.down}15`,
                        }}
                    >
                        {comparison.direction === 'up' ? '▲' : '▼'}
                        {currencySymbol}{comparison.amount >= 1000 ? `${(comparison.amount / 1000).toFixed(1)}k` : comparison.amount.toLocaleString()}
                    </span>
                )}
                {comparison && comparison.direction === 'flat' && (
                    <span className="inline-flex items-center text-xs font-bold px-2 py-1 rounded-lg text-muted bg-surface-hover">
                        — {currencySymbol}0
                    </span>
                )}
            </div>

            {/* Average indicator */}
            {avg > 0 && (
                <p className="text-sm text-muted">
                    {T('dailyAverage')}{' '}
                    <span className="font-semibold text-accent">{currencySymbol}{Math.round(avg).toLocaleString()}</span>
                </p>
            )}

            {/* Bar chart */}
            <div className="w-full overflow-x-auto rounded-xl">
                <svg
                    key={chartKey}
                    viewBox={`0 0 ${chartW} ${chartH}`}
                    width={chartW}
                    height={chartH}
                    className="block"
                    style={{ minWidth: `${chartW}px`, maxWidth: '100%', height: 'auto' }}
                    preserveAspectRatio="xMidYMid meet"
                    role="img"
                    aria-label={T('spendingTrend')}
                >
                    {/* Grid lines */}
                    {[0.25, 0.5, 0.75, 1].map(frac => {
                        const y = padT + drawH - frac * drawH;
                        return (
                            <line key={frac} x1={padL} y1={y} x2={chartW - padR} y2={y}
                                stroke="var(--border-color)" strokeWidth="0.5" strokeDasharray="4 4" />
                        );
                    })}

                    {/* Average line */}
                    {avg > 0 && (
                        <line
                            x1={padL} y1={avgY} x2={chartW - padR} y2={avgY}
                            stroke="var(--accent)" strokeWidth="1" strokeDasharray="6 3" opacity="0.5"
                        />
                    )}

                    {/* Bars */}
                    {values.map((val, i) => {
                        const barH = val > 0 ? Math.max(2, (val / maxVal) * drawH) : 0;
                        const x = padL + i * (barW + barGap);
                        const y = padT + drawH - barH;
                        const isToday = i === todayIdx;
                        const hasValue = val > 0;

                        return (
                            <g key={i}>
                                {/* Bar — uses CSS animation via class instead of SVG <animate> */}
                                <rect
                                    x={x}
                                    y={y}
                                    width={barW}
                                    height={barH}
                                    rx={mode === 'weekly' ? 4 : 2}
                                    fill={isToday ? 'var(--accent)' : hasValue ? 'var(--accent)' : 'var(--surface-hover)'}
                                    opacity={isToday ? 1 : hasValue ? 0.6 : 0.25}
                                    className="animate-bar-grow"
                                    style={{
                                        transformOrigin: `${x + barW / 2}px ${padT + drawH}px`,
                                        animationDelay: `${i * 20}ms`,
                                    }}
                                />

                                {/* Value label on top for weekly bars with value */}
                                {mode === 'weekly' && val > 0 && (
                                    <text
                                        x={x + barW / 2}
                                        y={y - 6}
                                        textAnchor="middle"
                                        fill="var(--muted)"
                                        fontSize="10"
                                        fontWeight="600"
                                        fontFamily="var(--font-sans, system-ui)"
                                    >
                                        {val >= 1000 ? `${(val / 1000).toFixed(1)}k` : Math.round(val)}
                                    </text>
                                )}

                                {/* Day label */}
                                {labels[i] && (
                                    <text
                                        x={x + barW / 2}
                                        y={chartH - padB + 16}
                                        textAnchor="middle"
                                        fill={isToday ? 'var(--accent)' : 'var(--muted)'}
                                        fontSize={mode === 'weekly' ? '11' : '9'}
                                        fontWeight={isToday ? '700' : '400'}
                                        fontFamily="var(--font-sans, system-ui)"
                                    >
                                        {labels[i]}
                                    </text>
                                )}

                                {/* Today dot */}
                                {isToday && (
                                    <circle
                                        cx={x + barW / 2}
                                        cy={chartH - padB + 26}
                                        r="2.5"
                                        fill="var(--accent)"
                                    />
                                )}
                            </g>
                        );
                    })}
                </svg>
            </div>
        </div>
    );
}
