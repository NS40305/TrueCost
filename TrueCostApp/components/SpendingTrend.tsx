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
    /** Total cost from subscriptions for the current period */
    subscriptionTotal?: number;
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

/** Get the brightness level (0–4) for GitHub-style heatmap */
function getHeatLevel(value: number, maxVal: number): number {
    if (value === 0) return 0;
    const ratio = value / maxVal;
    if (ratio <= 0.25) return 1;
    if (ratio <= 0.50) return 2;
    if (ratio <= 0.75) return 3;
    return 4;
}

export default function SpendingTrend({ items, allItems, currencySymbol, currencyCode, language, mode, currentDate, subscriptionTotal = 0 }: SpendingTrendProps) {
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

            const dayLabels = Array.from({ length: daysInMonth }, (_, i) => `${i + 1}`);

            let today = -1;
            if (now.getFullYear() === year && now.getMonth() === month) {
                today = now.getDate() - 1;
            }

            return { labels: dayLabels, values: buckets, todayIdx: today };
        }
    }, [items, mode, currentDate, language]);

    // ── Previous period comparison ──
    const comparison = useMemo(() => {
        const currentTotal = items.reduce((sum, i) => sum + i.price, 0) + subscriptionTotal;
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

    const maxVal = Math.max(...values, 1);

    // Average
    const nonZeroVals = values.filter(v => v > 0);
    const avg = nonZeroVals.length > 0 ? nonZeroVals.reduce((a, b) => a + b, 0) / nonZeroVals.length : 0;

    // Use a key that changes when data changes to force re-mount and replay CSS animations
    const chartKey = `${mode}-${currentDate.getTime()}-${items.length}`;

    // ── Monthly heatmap grid data ──
    const heatmapData = useMemo(() => {
        if (mode !== 'monthly') return null;

        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const daysInMonth = values.length;

        // First day of month: 0=Sun, 1=Mon … 6=Sat (Sunday-first calendar)
        const firstDayJS = new Date(year, month, 1).getDay(); // 0=Sun

        const locale = language === 'en' ? 'en-US' : language;
        const weekdayLabels = Array.from({ length: 7 }, (_, i) => {
            // Create a date that is a Sunday + i days
            const d = new Date(2023, 11, 31); // Sunday, Dec 31 2023
            d.setDate(d.getDate() + i);
            return d.toLocaleDateString(locale, { weekday: 'narrow' });
        });

        // Build grid: array of weeks, each week has 7 cells (Sun-Sat)
        const weeks: Array<Array<{ day: number; value: number; level: number } | null>> = [];
        let currentWeek: Array<{ day: number; value: number; level: number } | null> = [];

        // Fill leading blanks (Sun=0, so use firstDayJS directly)
        for (let i = 0; i < firstDayJS; i++) {
            currentWeek.push(null);
        }

        for (let d = 0; d < daysInMonth; d++) {
            const level = getHeatLevel(values[d], maxVal);
            currentWeek.push({ day: d + 1, value: values[d], level });
            if (currentWeek.length === 7) {
                weeks.push(currentWeek);
                currentWeek = [];
            }
        }

        // Fill trailing blanks
        if (currentWeek.length > 0) {
            while (currentWeek.length < 7) {
                currentWeek.push(null);
            }
            weeks.push(currentWeek);
        }

        return { weeks, weekdayLabels, daysInMonth };
    }, [mode, currentDate, values, maxVal, language]);

    // ── Weekly bar chart dimensions — fully responsive ──
    const weeklyChart = useMemo(() => {
        if (mode !== 'weekly') return null;
        const padL = 8;
        const padR = 8;
        const padT = 24;
        const padB = 32;
        const barGap = 12;
        const barW = 36;
        const barCount = values.length;
        const drawW = barCount * barW + (barCount - 1) * barGap;
        const chartW = padL + drawW + padR;
        const drawH = 120;
        const chartH = padT + drawH + padB;
        const avgY = padT + drawH - (avg / maxVal) * drawH;
        return { padL, padR, padT, padB, barGap, barW, drawW, chartW, drawH, chartH, avgY };
    }, [mode, values, avg, maxVal]);

    if (items.length === 0) return null;

    return (
        <div className="glass-card p-5 rounded-2xl space-y-4">
            {/* Header */}
            <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
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

            {/* Average indicator + legend row */}
            {avg > 0 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted">
                        {T('dailyAverage')}{' '}
                        <span className="font-semibold text-accent">{currencySymbol}{Math.round(avg).toLocaleString()}</span>
                    </p>
                    {mode === 'monthly' && (
                        <div className="flex items-center gap-1">
                            <span className="text-[10px] text-muted">{T('less') || 'Less'}</span>
                            {[0, 1, 2, 3, 4].map(level => (
                                <div
                                    key={level}
                                    style={{
                                        width: '10px',
                                        height: '10px',
                                        borderRadius: '2px',
                                        background: level === 0
                                            ? 'var(--surface-hover)'
                                            : `rgba(var(--accent-rgb), ${[0, 0.12, 0.25, 0.40, 0.60][level]})`,
                                    }}
                                />
                            ))}
                            <span className="text-[10px] text-muted">{T('more') || 'More'}</span>
                        </div>
                    )}
                </div>
            )}

            {/* ═══ Weekly: Bar chart (fully responsive, no scroll) ═══ */}
            {mode === 'weekly' && weeklyChart && (
                <div className="w-full rounded-xl">
                    <svg
                        key={chartKey}
                        viewBox={`0 0 ${weeklyChart.chartW} ${weeklyChart.chartH}`}
                        className="block w-full"
                        style={{ height: 'auto' }}
                        preserveAspectRatio="xMidYMid meet"
                        role="img"
                        aria-label={T('spendingTrend')}
                    >
                        {/* Grid lines */}
                        {[0.25, 0.5, 0.75, 1].map(frac => {
                            const y = weeklyChart.padT + weeklyChart.drawH - frac * weeklyChart.drawH;
                            return (
                                <line key={frac} x1={weeklyChart.padL} y1={y} x2={weeklyChart.chartW - weeklyChart.padR} y2={y}
                                    stroke="var(--border-color)" strokeWidth="0.5" strokeDasharray="4 4" />
                            );
                        })}

                        {/* Average line */}
                        {avg > 0 && (
                            <line
                                x1={weeklyChart.padL} y1={weeklyChart.avgY} x2={weeklyChart.chartW - weeklyChart.padR} y2={weeklyChart.avgY}
                                stroke="var(--accent)" strokeWidth="1" strokeDasharray="6 3" opacity="0.5"
                            />
                        )}

                        {/* Bars */}
                        {values.map((val, i) => {
                            const barH = val > 0 ? Math.max(2, (val / maxVal) * weeklyChart.drawH) : 0;
                            const x = weeklyChart.padL + i * (weeklyChart.barW + weeklyChart.barGap);
                            const y = weeklyChart.padT + weeklyChart.drawH - barH;
                            const isToday = i === todayIdx;
                            const hasValue = val > 0;

                            return (
                                <g key={i}>
                                    <rect
                                        x={x}
                                        y={y}
                                        width={weeklyChart.barW}
                                        height={barH}
                                        rx={4}
                                        fill={isToday ? 'var(--accent)' : hasValue ? 'var(--accent)' : 'var(--surface-hover)'}
                                        opacity={isToday ? 1 : hasValue ? 0.6 : 0.25}
                                        className="animate-bar-grow"
                                        style={{
                                            transformOrigin: `${x + weeklyChart.barW / 2}px ${weeklyChart.padT + weeklyChart.drawH}px`,
                                            animationDelay: `${i * 20}ms`,
                                        }}
                                    />

                                    {/* Value label on top */}
                                    {val > 0 && (
                                        <text
                                            x={x + weeklyChart.barW / 2}
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
                                    <text
                                        x={x + weeklyChart.barW / 2}
                                        y={weeklyChart.chartH - weeklyChart.padB + 16}
                                        textAnchor="middle"
                                        fill={isToday ? 'var(--accent)' : 'var(--muted)'}
                                        fontSize="11"
                                        fontWeight={isToday ? '700' : '400'}
                                        fontFamily="var(--font-sans, system-ui)"
                                    >
                                        {labels[i]}
                                    </text>

                                    {/* Today dot */}
                                    {isToday && (
                                        <circle
                                            cx={x + weeklyChart.barW / 2}
                                            cy={weeklyChart.chartH - weeklyChart.padB + 26}
                                            r="2.5"
                                            fill="var(--accent)"
                                        />
                                    )}
                                </g>
                            );
                        })}
                    </svg>
                </div>
            )}

            {/* ═══ Monthly: Calendar-style heatmap ═══ */}
            {mode === 'monthly' && heatmapData && (
                <div key={chartKey}>
                    {/* Weekday header row — accent background bar */}
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(7, 1fr)',
                            gap: '3px',
                            marginBottom: '3px',
                        }}
                    >
                        {heatmapData.weekdayLabels.map((label, i) => (
                            <div
                                key={i}
                                className="text-center"
                                style={{
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    color: '#fff',
                                    background: 'rgba(var(--accent-rgb), 0.7)',
                                    borderRadius: '4px',
                                    padding: '5px 0',
                                    letterSpacing: '0.03em',
                                }}
                            >
                                {label}
                            </div>
                        ))}
                    </div>

                    {/* Calendar grid — each row is one week */}
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(7, 1fr)',
                            gap: '3px',
                        }}
                    >
                        {heatmapData.weeks.map((week, wi) =>
                            week.map((cell, di) => {
                                if (!cell) {
                                    return <div key={`${wi}-${di}`} />;
                                }

                                const isToday = cell.day - 1 === todayIdx;

                                // Heat background colors
                                const heatBg = [
                                    'var(--surface-hover)',           // level 0: no spending
                                    'rgba(var(--accent-rgb), 0.12)', // level 1
                                    'rgba(var(--accent-rgb), 0.25)', // level 2
                                    'rgba(var(--accent-rgb), 0.40)', // level 3
                                    'rgba(var(--accent-rgb), 0.60)', // level 4
                                ];

                                const priceLabel = cell.value > 0
                                    ? (cell.value >= 1000
                                        ? `${(cell.value / 1000).toFixed(cell.value >= 10000 ? 1 : 2)}K`
                                        : `${Math.round(cell.value)}`)
                                    : '';

                                return (
                                    <div
                                        key={`${wi}-${di}`}
                                        className="flex flex-col items-center justify-center"
                                        style={{
                                            background: heatBg[cell.level],
                                            borderRadius: '6px',
                                            padding: '6px 2px 5px',
                                            outline: isToday
                                                ? '2px solid var(--accent)'
                                                : 'none',
                                            outlineOffset: '-1px',
                                            boxShadow: isToday
                                                ? '0 0 8px rgba(var(--accent-rgb), 0.3)'
                                                : cell.level >= 3
                                                    ? `0 0 6px rgba(var(--accent-rgb), 0.15)`
                                                    : 'none',
                                            animation: 'heatmap-pop 0.25s cubic-bezier(0.25, 0.1, 0.25, 1) both',
                                            animationDelay: `${(wi * 7 + di) * 12}ms`,
                                            minHeight: '44px',
                                        }}
                                    >
                                        {/* Date number */}
                                        <span
                                            style={{
                                                fontSize: '13px',
                                                fontWeight: 700,
                                                color: isToday
                                                    ? 'var(--accent)'
                                                    : cell.level >= 2
                                                        ? '#fff'
                                                        : 'var(--foreground)',
                                                lineHeight: 1.2,
                                            }}
                                        >
                                            {cell.day}
                                        </span>

                                        {/* Price */}
                                        <span
                                            className="truncate w-full text-center"
                                            style={{
                                                fontSize: '9px',
                                                fontWeight: 600,
                                                color: cell.value > 0
                                                    ? (isToday
                                                        ? 'var(--accent)'
                                                        : cell.level >= 2
                                                            ? 'rgba(255,255,255,0.85)'
                                                            : 'var(--muted)')
                                                    : 'transparent',
                                                lineHeight: 1.3,
                                                marginTop: '1px',
                                            }}
                                        >
                                            {priceLabel}
                                        </span>
                                    </div>
                                );
                            })
                        )}
                    </div>


                </div>
            )}
        </div>
    );
}
