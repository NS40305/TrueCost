'use client';

import { useState, memo, useCallback } from 'react';
import { SubscriptionItem, SubscriptionCycle, useStore } from '@/lib/store';
import { CURRENCIES, CATEGORIES, Category } from '@/lib/constants';
import { t } from '@/lib/i18n';
import { getTimeNeeded, formatHours } from '@/lib/calculations';

interface SubscriptionCardProps {
    sub: SubscriptionItem;
    /** If true, show edit/delete controls (Calculator page). If false, summary-only view. */
    editable?: boolean;
}

const CYCLE_LABELS: Record<SubscriptionCycle, string> = {
    weekly: 'subPerWeek',
    monthly: 'subPerMonth',
    yearly: 'subPerYear',
};

const CYCLE_ICONS: Record<SubscriptionCycle, React.ReactNode> = {
    weekly: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
        </svg>
    ),
    monthly: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
        </svg>
    ),
    yearly: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
        </svg>
    ),
};

const SubscriptionCard = memo(function SubscriptionCard({ sub, editable = false }: SubscriptionCardProps) {
    const settings = useStore((s) => s.settings);
    const language = useStore((s) => s.language);
    const removeSubscription = useStore((s) => s.removeSubscription);
    const toggleSubscription = useStore((s) => s.toggleSubscription);
    const updateSubscription = useStore((s) => s.updateSubscription);
    const currencySymbol = CURRENCIES.find((c) => c.code === settings.currency)?.symbol || '$';

    const T = (key: string) => t(language, key);
    const time = getTimeNeeded(sub.price, settings);

    const [editOpen, setEditOpen] = useState(false);
    const [editName, setEditName] = useState(sub.name);
    const [editPrice, setEditPrice] = useState(sub.price.toString());
    const [editCategory, setEditCategory] = useState<Category>(sub.category);
    const [editCycle, setEditCycle] = useState<SubscriptionCycle>(sub.cycle);

    const handleSave = useCallback(() => {
        const priceNum = parseFloat(editPrice) || 0;
        if (!editName.trim() || priceNum <= 0) return;
        updateSubscription(sub.id, {
            name: editName.trim(),
            price: priceNum,
            category: editCategory,
            cycle: editCycle,
        });
        setEditOpen(false);
    }, [editName, editPrice, editCategory, editCycle, sub.id, updateSubscription]);

    const handleDelete = useCallback(() => {
        removeSubscription(sub.id);
    }, [removeSubscription, sub.id]);

    const cycleLabel = T(CYCLE_LABELS[sub.cycle]);

    return (
        <>
            <div
                className={`glass-card p-4 flex items-center gap-3 transition-opacity ${!sub.enabled ? 'opacity-50' : ''}`}
                onClick={() => editable && setEditOpen(true)}
                style={{ cursor: editable ? 'pointer' : 'default' }}
            >
                {/* Icon */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${sub.enabled ? 'bg-accent/10' : 'bg-surface-hover'}`}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={sub.enabled ? 'text-accent' : 'text-muted'}>
                        <path d="M21 12V7H5a2 2 0 010-4h14v4" /><path d="M3 5v14a2 2 0 002 2h16v-5" /><path d="M18 12a2 2 0 000 4h4v-4h-4z" />
                    </svg>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{sub.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted">{sub.category}</span>
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-accent/10 text-accent text-[10px] font-medium">
                            {CYCLE_ICONS[sub.cycle]}
                            {cycleLabel}
                        </span>
                    </div>
                </div>

                {/* Price + toggle */}
                <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                        <p className="font-bold text-sm tabular-nums">
                            {currencySymbol}{sub.price.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted tabular-nums">
                            {formatHours(time.hours)} {T('hrs')}
                        </p>
                    </div>

                    {editable && (
                        <button
                            onClick={(e) => { e.stopPropagation(); toggleSubscription(sub.id); }}
                            className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 ${sub.enabled ? 'bg-accent' : 'bg-border'}`}
                            aria-label={sub.enabled ? T('enabled') : T('disabled')}
                        >
                            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform ${sub.enabled ? 'left-[18px]' : 'left-0.5'}`} />
                        </button>
                    )}
                </div>
            </div>

            {/* Edit modal */}
            {editOpen && editable && (
                <div className="modal-overlay" onClick={() => setEditOpen(false)}>
                    <div className="modal-sheet bg-surface p-6 space-y-5" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold">{T('editSubscription')}</h3>
                            <button onClick={() => setEditOpen(false)} className="p-2 hover:bg-surface-hover rounded-xl transition-colors">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-semibold uppercase tracking-wider text-muted block mb-1.5">{T('subscriptionName')}</label>
                                <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-semibold uppercase tracking-wider text-muted block mb-1.5">{T('itemPrice')}</label>
                                    <input type="number" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} min="0" step="0.01" className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all" />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold uppercase tracking-wider text-muted block mb-1.5">{T('category')}</label>
                                    <select value={editCategory} onChange={(e) => setEditCategory(e.target.value as Category)} className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all appearance-none cursor-pointer">
                                        {CATEGORIES.map((c) => (<option key={c} value={c}>{c}</option>))}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-semibold uppercase tracking-wider text-muted block mb-1.5">{T('billingCycle')}</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {(['weekly', 'monthly', 'yearly'] as SubscriptionCycle[]).map((c) => (
                                        <button
                                            key={c}
                                            onClick={() => setEditCycle(c)}
                                            className={`py-2 rounded-xl text-sm font-medium transition-all ${editCycle === c ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'bg-surface-hover text-muted hover:text-foreground'}`}
                                        >
                                            {T(c)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button onClick={handleDelete} className="flex-1 py-3 rounded-xl font-semibold text-sm bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all">
                                {T('delete')}
                            </button>
                            <button onClick={handleSave} className="flex-1 py-3 rounded-xl font-semibold text-sm bg-accent text-white hover:bg-accent-hover transition-all shadow-lg shadow-accent/20">
                                {T('save')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
});

export default SubscriptionCard;
