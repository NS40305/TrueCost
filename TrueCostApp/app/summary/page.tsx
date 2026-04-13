'use client';

import { useState, useMemo, useCallback } from 'react';
import { useStore, SubscriptionItem, SubscriptionCycle } from '@/lib/store';
import { getTimeNeeded, formatHours } from '@/lib/calculations';
import { CURRENCIES } from '@/lib/constants';
import { t } from '@/lib/i18n';
import SegmentedControl from '@/components/SegmentedControl';
import SummaryItem from '@/components/SummaryItem';
import SpendingChart from '@/components/SpendingChart';
import SpendingTrend from '@/components/SpendingTrend';
import CategoryIcon from '@/components/CategoryIcon';

type ReportMode = 'weekly' | 'monthly' | 'yearly';

/** Return Mon 00:00 and next-Mon 00:00 for the ISO week containing `date`. */
function getWeekBounds(date: Date): { start: Date; end: Date } {
    const d = new Date(date);
    const day = d.getDay(); // 0=Sun … 6=Sat
    const diff = day === 0 ? -6 : 1 - day; // roll back to Monday
    const mon = new Date(d.getFullYear(), d.getMonth(), d.getDate() + diff);
    const nextMon = new Date(mon);
    nextMon.setDate(nextMon.getDate() + 7);
    return { start: mon, end: nextMon };
}

/** Count how many times a subscription cycle fires in a given date range */
function getSubscriptionOccurrences(
    sub: SubscriptionItem,
    rangeStart: Date,
    rangeEnd: Date
): number {
    if (!sub.enabled) return 0;
    const startDate = new Date(sub.startDate);
    // If the subscription hasn't started yet (in this period's range)
    if (startDate >= rangeEnd) return 0;

    let count = 0;
    const cursor = new Date(startDate);

    // Advance cursor to first occurrence >= rangeStart
    while (cursor < rangeStart) {
        advanceByCycle(cursor, sub.cycle);
    }

    while (cursor < rangeEnd) {
        count++;
        advanceByCycle(cursor, sub.cycle);
    }

    // Ensure at least 1 occurrence if the period covers the subscription cycle
    // For monthly/yearly subscriptions within their matching period
    if (count === 0 && startDate < rangeEnd) {
        // Check if we should count at least one based on the period type matching the cycle
        if (sub.cycle === 'monthly') {
            // Monthly always fires once per month if active
            count = 1;
        } else if (sub.cycle === 'weekly') {
            count = 1;
        } else if (sub.cycle === 'yearly') {
            // Check if the anniversary falls in range
            const anniversaryThisYear = new Date(startDate);
            anniversaryThisYear.setFullYear(rangeStart.getFullYear());
            if (anniversaryThisYear >= rangeStart && anniversaryThisYear < rangeEnd) {
                count = 1;
            }
        }
    }

    return count;
}

function advanceByCycle(date: Date, cycle: SubscriptionCycle) {
    switch (cycle) {
        case 'weekly': date.setDate(date.getDate() + 7); break;
        case 'monthly': date.setMonth(date.getMonth() + 1); break;
        case 'yearly': date.setFullYear(date.getFullYear() + 1); break;
    }
}

export default function SummaryPage() {
    const items = useStore((s) => s.items);
    const settings = useStore((s) => s.settings);
    const language = useStore((s) => s.language);
    const subscriptions = useStore((s) => s.subscriptions);
    const [mode, setMode] = useState<ReportMode>('weekly');
    const [currentDate, setCurrentDate] = useState(new Date());

    const setOpenSwipeId = useStore((s) => s.setOpenSwipeId);
    const T = (key: string) => t(language, key);
    const currencySymbol = CURRENCIES.find((c) => c.code === settings.currency)?.symbol || '$';
    const closeSwipe = useCallback(() => setOpenSwipeId(null), [setOpenSwipeId]);

    type SortDir = 'asc' | 'desc';
    const [sortMode, setSortMode] = useState<'date' | 'price'>('date');
    const [sortDir, setSortDir] = useState<SortDir>('desc');
    const [regretCategoryFilter, setRegretCategoryFilter] = useState<string>('all');

    const completedItems = useMemo(() => items.filter(i => i.location === 'summary' || (!i.location && i.completed)), [items]);

    const filteredItems = useMemo(() => {
        let list = completedItems.filter(item => {
            const date = new Date(item.completedAt || item.addedAt);
            if (mode === 'weekly') {
                const { start, end } = getWeekBounds(currentDate);
                return date >= start && date < end;
            } else if (mode === 'monthly') {
                return date.getMonth() === currentDate.getMonth() && date.getFullYear() === currentDate.getFullYear();
            } else {
                return date.getFullYear() === currentDate.getFullYear();
            }
        });

        list.sort((a, b) => {
            // Prioritize regretted items at the top
            if (a.regretted && !b.regretted) return -1;
            if (!a.regretted && b.regretted) return 1;

            // Follow normal sorting modes for the rest
            if (sortMode === 'date') {
                const diff = (b.completedAt || b.addedAt) - (a.completedAt || a.addedAt);
                return sortDir === 'desc' ? diff : -diff;
            } else {
                const diff = b.price - a.price;
                return sortDir === 'desc' ? diff : -diff;
            }
        });

        return list;
    }, [completedItems, mode, currentDate, sortMode, sortDir]);

    const totalSpent = filteredItems.reduce((acc, item) => acc + item.price, 0);
    const totalTime = filteredItems.reduce((acc, item) => acc + getTimeNeeded(item.price, settings).hours, 0);

    // Compute subscription costs for the current period
    const { periodStart, periodEnd } = useMemo(() => {
        if (mode === 'weekly') {
            const { start, end } = getWeekBounds(currentDate);
            return { periodStart: start, periodEnd: end };
        } else if (mode === 'monthly') {
            const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
            const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
            return { periodStart: start, periodEnd: end };
        } else {
            const start = new Date(currentDate.getFullYear(), 0, 1);
            const end = new Date(currentDate.getFullYear() + 1, 0, 1);
            return { periodStart: start, periodEnd: end };
        }
    }, [mode, currentDate]);

    const activeSubscriptions = useMemo(() => {
        return subscriptions
            .filter(sub => sub.enabled)
            .map(sub => {
                const occurrences = getSubscriptionOccurrences(sub, periodStart, periodEnd);
                const totalCost = sub.price * occurrences;
                return { ...sub, occurrences, totalCost };
            })
            .filter(sub => sub.occurrences > 0);
    }, [subscriptions, periodStart, periodEnd]);

    const subscriptionTotal = activeSubscriptions.reduce((acc, s) => acc + s.totalCost, 0);
    const subscriptionTime = activeSubscriptions.reduce((acc, s) => acc + getTimeNeeded(s.totalCost, settings).hours, 0);

    const grandTotalSpent = totalSpent + subscriptionTotal;
    const grandTotalTime = totalTime + subscriptionTime;

    const CYCLE_LABEL_KEY: Record<SubscriptionCycle, string> = {
        weekly: 'subPerWeek',
        monthly: 'subPerMonth',
        yearly: 'subPerYear',
    };

    // Create virtual ShoppingItems from subscriptions so charts can include them
    const subscriptionVirtualItems = useMemo(() => {
        return activeSubscriptions.map(sub => ({
            id: `sub-${sub.id}`,
            name: sub.name,
            category: sub.category,
            price: sub.totalCost,
            addedAt: sub.startDate,
            completed: true,
            completedAt: periodStart.getTime(),
        } as import('@/lib/store').ShoppingItem));
    }, [activeSubscriptions, periodStart]);

    // Merged items for chart = real completed items + subscription virtual items
    const chartItems = useMemo(() => [
        ...filteredItems,
        ...subscriptionVirtualItems,
    ], [filteredItems, subscriptionVirtualItems]);

    const changeDate = (dir: number) => {
        const next = new Date(currentDate);
        if (mode === 'weekly') {
            next.setDate(next.getDate() + dir * 7);
        } else if (mode === 'monthly') {
            next.setMonth(next.getMonth() + dir);
        } else {
            next.setFullYear(next.getFullYear() + dir);
        }
        setCurrentDate(next);
    };

    const periodLabel = useMemo(() => {
        if (mode === 'yearly') {
            return currentDate.getFullYear().toString();
        }
        if (mode === 'weekly') {
            const { start, end } = getWeekBounds(currentDate);
            const endDisplay = new Date(end);
            endDisplay.setDate(endDisplay.getDate() - 1); // show Sun, not next Mon
            const locale = language === 'en' ? 'en-US' : language;
            const fmt: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
            return `${start.toLocaleDateString(locale, fmt)} – ${endDisplay.toLocaleDateString(locale, fmt)}`;
        }
        return currentDate.toLocaleDateString(language === 'en' ? 'en-US' : language, { month: 'long', year: 'numeric' });
    }, [currentDate, mode, language]);

    return (
        <div className="max-w-lg mx-auto px-4 py-8 space-y-8" onClick={closeSwipe}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold" style={{ letterSpacing: '-0.03em', lineHeight: '1.1' }}>{T('summaryTitle')}</h2>
                <button
                    onClick={() => {
                        if (sortMode === 'date') {
                            if (sortDir === 'desc') setSortDir('asc');
                            else { setSortMode('price'); setSortDir('desc'); }
                        } else {
                            if (sortDir === 'desc') setSortDir('asc');
                            else { setSortMode('date'); setSortDir('desc'); }
                        }
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] bg-surface hover:bg-surface-hover text-sm font-medium transition-colors text-accent cursor-pointer min-w-[100px] justify-center"
                    style={{ border: '1px solid var(--border-color)' }}
                >
                    {sortMode === 'date' ? T('sortByDate').replace(' ↓', '') : T('sortByPrice').replace(' ↓', '')}
                    <div className="flex flex-col items-center justify-center -space-y-1">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" className={sortDir === 'asc' ? 'text-accent' : 'text-muted/40'}>
                            <polygon points="12,6 4,20 20,20" />
                        </svg>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" className={sortDir === 'desc' ? 'text-accent' : 'text-muted/40'}>
                            <polygon points="12,18 4,4 20,4" />
                        </svg>
                    </div>
                </button>
            </div>

            {/* Mode toggle */}
            <SegmentedControl
                options={[
                    { label: T('weeklyReport'), value: 'weekly' },
                    { label: T('monthlyReport'), value: 'monthly' },
                    { label: T('yearlyReport'), value: 'yearly' },
                ]}
                value={mode}
                onChange={(v) => setMode(v as ReportMode)}
            />

            {/* Date Navigator */}
            <div className="flex items-center justify-between glass-card p-2 rounded-2xl">
                <button onClick={() => changeDate(-1)} className="p-2 hover:bg-surface-hover rounded-xl transition-colors">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                </button>
                <span className="font-semibold">{periodLabel}</span>
                <button onClick={() => changeDate(1)} className="p-2 hover:bg-surface-hover rounded-xl transition-colors">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </button>
            </div>

            {/* Totals */}
            <div className="grid grid-cols-2 gap-4">
                <div className="glass-card p-4 rounded-2xl flex flex-col items-center text-center">
                    <p className="text-sm text-muted mb-1">{T('totalSpent')}</p>
                    <p className="text-2xl font-bold tabular-nums text-red-500">{currencySymbol}{grandTotalSpent.toLocaleString()}</p>
                </div>
                <div className="glass-card p-4 rounded-2xl flex flex-col items-center text-center">
                    <p className="text-sm text-muted mb-1">{T('totalTimeSpent')}</p>
                    <p className="text-2xl font-bold tabular-nums text-accent">{formatHours(grandTotalTime)} {T('hrs')}</p>
                </div>
            </div>

            {/* ── "Is this expense worthwhile?" insight card ── */}
            {filteredItems.length > 0 && (() => {
                const allExpenses = [
                    ...filteredItems.map(item => ({
                        name: item.name,
                        price: item.price,
                        hours: getTimeNeeded(item.price, settings).hours,
                    })),
                    ...activeSubscriptions.map(sub => ({
                        name: sub.name,
                        price: sub.totalCost,
                        hours: getTimeNeeded(sub.totalCost, settings).hours,
                    })),
                ];

                const small = allExpenses.filter(e => e.hours < 1);
                const medium = allExpenses.filter(e => e.hours >= 1 && e.hours < settings.hoursPerDay);
                const large = allExpenses.filter(e => e.hours >= settings.hoursPerDay);

                const total = allExpenses.length;
                const smallPct = total > 0 ? Math.round((small.length / total) * 100) : 0;
                const mediumPct = total > 0 ? Math.round((medium.length / total) * 100) : 0;
                const largePct = total > 0 ? Math.round((large.length / total) * 100) : 0;

                let overallVerdict: 'good' | 'watch' | 'caution';
                let verdictDesc: string;
                let verdictColor: string;
                let verdictIcon: React.ReactNode;

                if (largePct <= 10 && mediumPct <= 30) {
                    overallVerdict = 'good';
                    verdictDesc = T('greatJob');
                    verdictColor = 'text-emerald-400';
                    verdictIcon = (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
                            <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                            <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                    );
                } else if (largePct <= 25) {
                    overallVerdict = 'watch';
                    verdictDesc = T('beCareful');
                    verdictColor = 'text-amber-400';
                    verdictIcon = (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400">
                            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                            <line x1="12" y1="9" x2="12" y2="13" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                    );
                } else {
                    overallVerdict = 'caution';
                    verdictDesc = T('overspending');
                    verdictColor = 'text-red-400';
                    verdictIcon = (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-400">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="15" y1="9" x2="9" y2="15" />
                            <line x1="9" y1="9" x2="15" y2="15" />
                        </svg>
                    );
                }

                const categories = [
                    { label: `< 1 ${T('hours')}`, count: small.length, pct: smallPct, color: 'bg-emerald-500', textColor: 'text-emerald-400' },
                    { label: `1${T('hours')} – 1${T('days')}`, count: medium.length, pct: mediumPct, color: 'bg-amber-500', textColor: 'text-amber-400' },
                    { label: `> 1 ${T('days')}`, count: large.length, pct: largePct, color: 'bg-red-500', textColor: 'text-red-400' },
                ];

                return (
                    <div className="glass-card rounded-2xl overflow-hidden">
                        {/* Header */}
                        <div className={`px-5 py-3 flex items-center gap-3`}
                            style={{
                                background: overallVerdict === 'good' ? 'rgba(52, 199, 89, 0.06)'
                                    : overallVerdict === 'watch' ? 'rgba(245, 166, 35, 0.06)'
                                    : 'rgba(255, 59, 48, 0.06)'
                            }}
                        >
                            {verdictIcon}
                            <div className="flex-1">
                                <p className="text-xs font-semibold uppercase tracking-wider text-muted">{T('isExpenseWorthwhile')}</p>
                                <p className={`text-base font-bold ${verdictColor}`}>{T('overallVerdict')}</p>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="px-5 py-4 space-y-4">
                            <p className="text-sm text-muted">{verdictDesc}</p>

                            {/* Stacked bar */}
                            <div className="h-3 rounded-full overflow-hidden flex" style={{ background: 'var(--surface-hover)' }}>
                                {smallPct > 0 && <div className="bg-emerald-500 transition-all duration-500 h-full" style={{ width: `${smallPct}%` }} />}
                                {mediumPct > 0 && <div className="bg-amber-500 transition-all duration-500 h-full" style={{ width: `${mediumPct}%` }} />}
                                {largePct > 0 && <div className="bg-red-500 transition-all duration-500 h-full" style={{ width: `${largePct}%` }} />}
                            </div>

                            {/* Breakdown */}
                            <div className="space-y-2">
                                {categories.map((cat) => (
                                    <div key={cat.label} className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2.5 h-2.5 rounded-full ${cat.color}`} />
                                            <span className="text-muted">{cat.label}</span>
                                        </div>
                                        <span className={`font-semibold tabular-nums ${cat.textColor}`}>
                                            {cat.count} ({cat.pct}%)
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* Spending Trend (weekly & monthly only) */}
            {(mode === 'weekly' || mode === 'monthly') && (
                <SpendingTrend
                    items={filteredItems}
                    allItems={completedItems}
                    currencySymbol={currencySymbol}
                    currencyCode={settings.currency}
                    language={language}
                    mode={mode}
                    currentDate={currentDate}
                    subscriptionTotal={subscriptionTotal}
                />
            )}

            {/* Spending Chart */}
            <SpendingChart
                items={chartItems}
                currencySymbol={currencySymbol}
                totalSpent={grandTotalSpent}
                language={language}
            />

            {/* ── Regret Analysis Report ── */}
            {(() => {
                const regrettedItems = filteredItems.filter(i => i.regretted);
                const regretCount = regrettedItems.length;
                const totalCount = filteredItems.length;
                const regretRate = totalCount > 0 ? Math.round((regretCount / totalCount) * 100) : 0;
                const regretAmount = regrettedItems.reduce((acc, i) => acc + i.price, 0);
                const regretTimeHrs = regrettedItems.reduce((acc, i) => acc + getTimeNeeded(i.price, settings).hours, 0);
                const topRegretItem = regrettedItems.length > 0
                    ? regrettedItems.reduce((a, b) => a.price > b.price ? a : b)
                    : null;

                let verdictKey: string;
                let verdictColor: string;
                let gaugeColor: string;
                if (regretRate > 30) {
                    verdictKey = 'regretHigh';
                    verdictColor = 'text-red-400';
                    gaugeColor = 'bg-red-500';
                } else if (regretRate > 10) {
                    verdictKey = 'regretMedium';
                    verdictColor = 'text-amber-400';
                    gaugeColor = 'bg-amber-500';
                } else if (regretCount > 0) {
                    verdictKey = 'regretLow';
                    verdictColor = 'text-emerald-400';
                    gaugeColor = 'bg-emerald-500';
                } else {
                    verdictKey = 'noRegrets';
                    verdictColor = 'text-emerald-400';
                    gaugeColor = 'bg-emerald-500';
                }

                // Categories present among regretted items (for filter chips)
                const regretCategories = Array.from(new Set(regrettedItems.map(i => i.category)));

                // Filtered + sorted regretted items
                const displayedRegrets = regrettedItems
                    .filter(i => regretCategoryFilter === 'all' || i.category === regretCategoryFilter)
                    .sort((a, b) => b.price - a.price);

                return (
                    <div className="worth-insight-card glass-card rounded-2xl overflow-hidden">
                        {/* Header */}
                        <div className="px-5 py-3 flex items-center gap-3" style={{ background: 'rgba(168, 85, 247, 0.06)' }}>
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-purple-400">
                                <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z" />
                                <line x1="1" y1="1" x2="23" y2="23" />
                            </svg>
                            <div className="flex-1">
                                <p className="text-xs font-semibold uppercase tracking-wider text-muted">{T('regretReport')}</p>
                                <p className="text-base font-bold text-purple-400">{regretCount} / {totalCount} {T('items')}</p>
                            </div>
                            {regretRate > 0 && (
                                <div className="flex flex-col items-center">
                                    <span className={`text-2xl font-black tabular-nums ${verdictColor}`}>{regretRate}%</span>
                                    <span className="text-[10px] text-muted uppercase tracking-wide">{T('regretRate')}</span>
                                </div>
                            )}
                        </div>

                        {/* Body */}
                        <div className="px-5 py-4 space-y-4">
                            {/* Advice message */}
                            <p className={`text-sm font-medium ${verdictColor}`}>{T(verdictKey)}</p>

                            {/* Gauge bar */}
                            <div className="space-y-1.5">
                                <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--surface-hover)' }}>
                                    <div
                                        className={`h-full rounded-full ${gaugeColor} transition-all duration-700 ease-out`}
                                        style={{ width: `${Math.max(regretRate > 0 ? 3 : 0, regretRate)}%` }}
                                    />
                                </div>
                                <div className="flex justify-between text-[10px] text-muted/60">
                                    <span>0%</span>
                                    <span>50%</span>
                                    <span>100%</span>
                                </div>
                            </div>

                            {/* Stats grid */}
                            {regretCount > 0 && (
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-surface/50 rounded-xl p-3 text-center">
                                        <p className="text-lg font-bold tabular-nums text-purple-400">{currencySymbol}{regretAmount.toLocaleString()}</p>
                                        <p className="text-[11px] text-muted mt-0.5">{T('regretTotal')}</p>
                                    </div>
                                    <div className="bg-surface/50 rounded-xl p-3 text-center">
                                        <p className="text-lg font-bold tabular-nums text-purple-400">{formatHours(regretTimeHrs)} {T('hrs')}</p>
                                        <p className="text-[11px] text-muted mt-0.5">{T('regretTime')}</p>
                                    </div>
                                </div>
                            )}

                            {/* Top regret */}
                            {topRegretItem && (
                                <div className="flex items-center gap-3 bg-purple-500/10 rounded-xl p-3">
                                    <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center shrink-0">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-purple-400">
                                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                        </svg>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] uppercase tracking-wider text-muted">{T('topRegret')}</p>
                                        <p className="text-sm font-bold text-purple-300 truncate">{topRegretItem.name}</p>
                                    </div>
                                    <p className="text-sm font-bold tabular-nums text-purple-400">{currencySymbol}{topRegretItem.price.toLocaleString()}</p>
                                </div>
                            )}

                            {/* Category filter chips */}
                            {regretCount > 0 && regretCategories.length > 1 && (
                                <div className="flex gap-2 flex-wrap">
                                    <button
                                        onClick={() => setRegretCategoryFilter('all')}
                                        className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                                            regretCategoryFilter === 'all'
                                                ? 'bg-purple-500 text-white'
                                                : 'bg-surface/60 text-muted hover:bg-surface-hover border border-border'
                                        }`}
                                    >
                                        {T('allCategories')} ({regrettedItems.length})
                                    </button>
                                    {regretCategories.map(cat => {
                                        const count = regrettedItems.filter(i => i.category === cat).length;
                                        return (
                                            <button
                                                key={cat}
                                                onClick={() => setRegretCategoryFilter(regretCategoryFilter === cat ? 'all' : cat)}
                                                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                                                    regretCategoryFilter === cat
                                                        ? 'bg-purple-500 text-white'
                                                        : 'bg-surface/60 text-muted hover:bg-surface-hover border border-border'
                                                }`}
                                            >
                                                <CategoryIcon category={cat} size={12} className={regretCategoryFilter === cat ? 'text-white' : 'text-purple-400'} />
                                                {T(cat)} ({count})
                                            </button>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Full regretted items list — sorted by price desc */}
                            {displayedRegrets.length > 0 && (
                                <div className="space-y-2">
                                    {displayedRegrets.map((item) => {
                                        const time = getTimeNeeded(item.price, settings);
                                        const completionDate = new Date(item.completedAt || item.addedAt);
                                        const dateLabel = completionDate.toLocaleDateString(language === 'en' ? 'en-US' : language, {
                                            month: 'short', day: 'numeric',
                                        });
                                        return (
                                            <div key={item.id} className="flex items-center gap-3 bg-purple-500/5 hover:bg-purple-500/10 rounded-xl p-3 transition-colors">
                                                <div className="w-8 h-8 rounded-lg bg-purple-500/15 flex items-center justify-center shrink-0">
                                                    <CategoryIcon category={item.category} size={16} className="text-purple-400" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-purple-300 truncate">{item.name}</p>
                                                    <p className="text-[11px] text-muted">{T(item.category)} • {dateLabel}</p>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <p className="text-sm font-bold tabular-nums text-purple-400">{currencySymbol}{item.price.toLocaleString()}</p>
                                                    <p className="text-[10px] text-muted tabular-nums">{formatHours(time.hours)} {T('hrs')}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                );
            })()}

            {/* Items List */}
            <div className="space-y-4">

            {/* ── Fixed Expenses Section ── */}
            {activeSubscriptions.length > 0 && (
                <div className="glass-card rounded-2xl overflow-hidden">
                    <div className="p-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500">
                                    <path d="M21 12V7H5a2 2 0 010-4h14v4" /><path d="M3 5v14a2 2 0 002 2h16v-5" /><path d="M18 12a2 2 0 000 4h4v-4h-4z" />
                                </svg>
                            </div>
                            <div>
                                <p className="font-bold text-sm">{T('fixedExpenses')}</p>
                                <p className="text-xs text-muted">{currencySymbol}{subscriptionTotal.toLocaleString()} • {formatHours(subscriptionTime)} {T('hrs')}</p>
                            </div>
                        </div>
                    </div>
                    <div>
                        {activeSubscriptions.map(sub => (
                            <div key={sub.id} className="px-4 py-3 flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
                                        <path d="M21 12V7H5a2 2 0 010-4h14v4" /><path d="M3 5v14a2 2 0 002 2h16v-5" /><path d="M18 12a2 2 0 000 4h4v-4h-4z" />
                                    </svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-sm truncate">{sub.name}</p>
                                    <p className="text-xs text-muted">
                                        {T(sub.category)} • {currencySymbol}{sub.price} {T(CYCLE_LABEL_KEY[sub.cycle])}
                                        {sub.occurrences > 1 && ` × ${sub.occurrences}`}
                                    </p>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="font-bold text-sm tabular-nums text-amber-500">
                                        {currencySymbol}{sub.totalCost.toLocaleString()}
                                    </p>
                                    <p className="text-xs text-muted tabular-nums">
                                        {formatHours(getTimeNeeded(sub.totalCost, settings).hours)} {T('hrs')}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
                {filteredItems.length === 0 ? (
                    <div className="text-center py-12 px-4 glass-card rounded-2xl">
                        <p className="text-muted">{T('noCompletedItems')}</p>
                    </div>
                ) : (
                    filteredItems.map(item => {
                        const completionDate = new Date(item.completedAt || item.addedAt);
                        const dateLabel = completionDate.toLocaleDateString(language === 'en' ? 'en-US' : language, {
                            month: 'short',
                            day: 'numeric',
                            year: mode === 'yearly' || completionDate.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
                        });

                        return (
                            <SummaryItem key={item.id} item={item} dateLabel={dateLabel} />
                        );
                    })
                )}
            </div>
        </div>
    );
}
