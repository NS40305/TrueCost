'use client';

import { useMemo, useState, useCallback } from 'react';
import { useStore } from '@/lib/store';
import { getMonthlyIncome, getYearlyIncome, getTimeNeeded } from '@/lib/calculations';
import { CURRENCIES, IncomeType } from '@/lib/constants';
import { t } from '@/lib/i18n';
import SegmentedControl from '@/components/SegmentedControl';
import NumberTicker from '@/components/NumberTicker';
import ResultCards from '@/components/ResultCards';

export default function SettingsPage() {
    const {
        settings,
        setIncomeType,
        setRate,
        setCurrency,
        setHoursPerDay,
        setDaysPerMonth,
        language,
        items,
    } = useStore();

    const T = (key: string) => t(language, key);

    const INCOME_OPTIONS: { label: string; value: IncomeType }[] = [
        { label: T('hourly'), value: 'hourly' },
        { label: T('daily'), value: 'daily' },
        { label: T('monthly'), value: 'monthly' },
        { label: T('freelance'), value: 'freelance' },
    ];

    const currencySymbol =
        CURRENCIES.find((c) => c.code === settings.currency)?.symbol || '$';

    const monthlyIncome = useMemo(() => getMonthlyIncome(settings), [settings]);
    const yearlyIncome = useMemo(() => getYearlyIncome(settings), [settings]);

    const showHoursPerDay = settings.incomeType === 'daily' || settings.incomeType === 'monthly';
    const showDaysPerMonth = settings.incomeType === 'monthly';
    const showWorkingHours = showHoursPerDay || showDaysPerMonth;
    const isFreelance = settings.incomeType === 'freelance';

    const targetItem = useMemo(() => {
        if (!items || items.length === 0) return null;
        const pinned = items.filter(i => i.pinned);
        if (pinned.length > 0) {
            return pinned.sort((a, b) => b.price - a.price)[0];
        }
        return [...items].sort((a, b) => b.price - a.price)[0];
    }, [items]);

    const targetItemResult = useMemo(() => {
        if (!targetItem) return null;
        return getTimeNeeded(targetItem.price, settings);
    }, [targetItem, settings]);

    const rateLabel = isFreelance ? T('yearlyIncome') : T('yourRate');

    /* Toast popup */
    const [showToast, setShowToast] = useState(false);
    const handleSave = useCallback(() => {
        setShowToast(true);
        setTimeout(() => setShowToast(false), 2200);
    }, []);

    return (
        <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
            {/* Header */}
            <div className="text-center space-y-1">
                <h2 className="text-2xl font-bold">{T('incomeSettingTitle')}</h2>
                <p className="text-sm text-muted">{T('incomeSettingDesc')}</p>
            </div>

            {/* Income type */}
            <div className="glass-card p-5 space-y-5">
                <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted block mb-3">
                        {T('incomeType')}
                    </label>
                    <SegmentedControl
                        options={INCOME_OPTIONS}
                        value={settings.incomeType}
                        onChange={setIncomeType}
                    />
                </div>

                {/* Rate + Currency */}
                <div className="grid grid-cols-5 gap-3">
                    <div className="col-span-3">
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted block mb-1.5">
                            {rateLabel}
                        </label>
                        <input
                            type="number"
                            value={settings.rate || ''}
                            onChange={(e) => setRate(parseFloat(e.target.value) || 0)}
                            placeholder="0"
                            min="0"
                            step="0.01"
                            className="w-full px-4 py-3 rounded-xl bg-background border border-border text-lg font-semibold tabular-nums focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all"
                        />
                    </div>
                    <div className="col-span-2">
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted block mb-1.5">
                            {T('currency')}
                        </label>
                        <select
                            value={settings.currency}
                            onChange={(e) => setCurrency(e.target.value as typeof settings.currency)}
                            className="w-full px-3 py-3 rounded-xl bg-background border border-border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all appearance-none cursor-pointer"
                        >
                            {CURRENCIES.map((c) => (
                                <option key={c.code} value={c.code}>
                                    {c.code} ({c.symbol})
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Working hours card — conditionally shown */}
                {showWorkingHours && (
                    <div className="rounded-xl border border-border p-4 space-y-4 bg-background/50 transition-all">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                            {T('workingHours')}
                        </p>

                        {showHoursPerDay && (
                            <div className="flex items-center justify-between">
                                <span className="text-sm">{T('hoursPerDay')}</span>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setHoursPerDay(Math.max(1, settings.hoursPerDay - 1))}
                                        className="w-8 h-8 rounded-lg bg-surface-hover hover:bg-accent/15 hover:text-accent flex items-center justify-center text-lg font-bold transition-colors"
                                    >
                                        −
                                    </button>
                                    <span className="w-10 text-center font-bold tabular-nums text-lg">{settings.hoursPerDay}</span>
                                    <button
                                        onClick={() => setHoursPerDay(Math.min(24, settings.hoursPerDay + 1))}
                                        className="w-8 h-8 rounded-lg bg-surface-hover hover:bg-accent/15 hover:text-accent flex items-center justify-center text-lg font-bold transition-colors"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                        )}

                        {showDaysPerMonth && (
                            <div className="flex items-center justify-between">
                                <span className="text-sm">{T('daysPerMonth')}</span>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setDaysPerMonth(Math.max(1, settings.daysPerMonth - 1))}
                                        className="w-8 h-8 rounded-lg bg-surface-hover hover:bg-accent/15 hover:text-accent flex items-center justify-center text-lg font-bold transition-colors"
                                    >
                                        −
                                    </button>
                                    <span className="w-10 text-center font-bold tabular-nums text-lg">{settings.daysPerMonth}</span>
                                    <button
                                        onClick={() => setDaysPerMonth(Math.min(31, settings.daysPerMonth + 1))}
                                        className="w-8 h-8 rounded-lg bg-surface-hover hover:bg-accent/15 hover:text-accent flex items-center justify-center text-lg font-bold transition-colors"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Shopping list priority item display - OR Fallback to Total Salary */}
            {targetItem && targetItemResult ? (
                <div className="space-y-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted px-1">
                        {T('targetItem')}
                    </p>
                    <div className="glass-card p-5 space-y-3 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-bl-[100px] -z-10" />
                        <div className="flex items-center gap-2 mb-1">
                            {targetItem.pinned && (
                                <div className="w-6 h-6 rounded-full bg-blue-500/15 flex items-center justify-center text-blue-500">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none" className="-scale-x-100 -scale-y-100">
                                        <path d="M16 2l-4 4-6 1-3 3 3.5 3.5L2 18l4.5-4.5L10 17l3-3 1-6 4-4-2-2z" />
                                    </svg>
                                </div>
                            )}
                            <h3 className="font-semibold text-lg text-foreground">{targetItem.name}</h3>
                            <span className="text-muted font-medium text-sm ml-auto">
                                {currencySymbol}{targetItem.price.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                            </span>
                        </div>
                        {/* Render the unified result cards using the live edit settings */}
                        <ResultCards itemName={targetItem.name} result={targetItemResult} />
                    </div>
                </div>
            ) : (
                <div className="glass-card p-5 space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                        {T('totalSalary')}
                    </p>

                    <div className="flex items-baseline gap-2">
                        <p className="text-3xl font-bold tabular-nums bg-gradient-to-r from-accent to-purple-400 bg-clip-text text-transparent flex items-baseline gap-1">
                            <span>{currencySymbol}</span>
                            <NumberTicker value={monthlyIncome} animationDuration={0.4} />
                        </p>
                        <span className="text-sm text-muted">{T('perMonth')}</span>
                    </div>

                    {isFreelance && (
                        <div className="flex items-baseline gap-2 mt-1">
                            <p className="text-xl font-bold tabular-nums text-foreground/70 flex items-baseline gap-1">
                                <span>{currencySymbol}</span>
                                <NumberTicker value={yearlyIncome} animationDuration={0.4} />
                            </p>
                            <span className="text-sm text-muted">{T('perYear')}</span>
                        </div>
                    )}

                    <div className="h-1 w-full rounded-full bg-surface-hover overflow-hidden mt-2">
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-accent to-purple-400 transition-all duration-500"
                            style={{ width: `${Math.min(100, (monthlyIncome / 10000) * 100)}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Save button */}
            <button
                onClick={handleSave}
                className="w-full py-3.5 rounded-xl bg-accent text-white font-semibold text-base shadow-lg shadow-accent/25 hover:brightness-110 active:scale-[0.98] transition-all"
            >
                {T('saveSettings')}
            </button>

            <div className="h-8" />

            {/* Toast popup */}
            {showToast && (
                <div className="fixed inset-x-0 top-16 z-50 flex justify-center pointer-events-none animate-toast-in">
                    <div className="pointer-events-auto px-5 py-3 rounded-2xl bg-green-500/90 backdrop-blur-md text-white font-semibold text-sm shadow-xl shadow-green-500/30 flex items-center gap-2">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                        </svg>
                        {T('settingsSaved')}
                    </div>
                </div>
            )}
        </div>
    );
}
