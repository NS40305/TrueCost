'use client';

import { useState, useMemo } from 'react';
import { useStore } from '@/lib/store';
import { getTimeNeeded, formatHours } from '@/lib/calculations';
import { CURRENCIES } from '@/lib/constants';
import { t } from '@/lib/i18n';
import SegmentedControl from '@/components/SegmentedControl';
import SummaryItem from '@/components/SummaryItem';
import SpendingChart from '@/components/SpendingChart';
import SpendingTrend from '@/components/SpendingTrend';

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

export default function SummaryPage() {
    const items = useStore((s) => s.items);
    const settings = useStore((s) => s.settings);
    const language = useStore((s) => s.language);
    const [mode, setMode] = useState<ReportMode>('weekly');
    const [currentDate, setCurrentDate] = useState(new Date());

    const T = (key: string) => t(language, key);
    const currencySymbol = CURRENCIES.find((c) => c.code === settings.currency)?.symbol || '$';

    type SortDir = 'asc' | 'desc';
    const [sortMode, setSortMode] = useState<'date' | 'price'>('date');
    const [sortDir, setSortDir] = useState<SortDir>('desc');

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

        if (sortMode === 'date') {
            list.sort((a, b) => {
                const diff = (b.completedAt || b.addedAt) - (a.completedAt || a.addedAt);
                return sortDir === 'desc' ? diff : -diff;
            });
        } else {
            list.sort((a, b) => {
                const diff = b.price - a.price;
                return sortDir === 'desc' ? diff : -diff;
            });
        }

        return list;
    }, [completedItems, mode, currentDate, sortMode, sortDir]);

    const totalSpent = filteredItems.reduce((acc, item) => acc + item.price, 0);
    const totalTime = filteredItems.reduce((acc, item) => acc + getTimeNeeded(item.price, settings).hours, 0);

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
        <div className="max-w-lg mx-auto px-4 py-8 space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">{T('summaryTitle')}</h2>
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
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface hover:bg-surface-hover border border-border text-sm font-medium transition-colors text-accent cursor-pointer min-w-[100px] justify-center"
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
                    <p className="text-2xl font-bold tabular-nums text-red-500">{currencySymbol}{totalSpent.toLocaleString()}</p>
                </div>
                <div className="glass-card p-4 rounded-2xl flex flex-col items-center text-center">
                    <p className="text-sm text-muted mb-1">{T('totalTimeSpent')}</p>
                    <p className="text-2xl font-bold tabular-nums text-accent">{formatHours(totalTime)} {T('hrs')}</p>
                </div>
            </div>

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
                />
            )}

            {/* Spending Chart */}
            <SpendingChart
                items={filteredItems}
                currencySymbol={currencySymbol}
                totalSpent={totalSpent}
                language={language}
            />

            {/* Items List */}
            <div className="space-y-4">
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
