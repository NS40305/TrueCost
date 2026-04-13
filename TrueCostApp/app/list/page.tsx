'use client';

import { useState, useMemo, useCallback } from 'react';
import { useStore } from '@/lib/store';
import { getTimeNeeded, formatHours } from '@/lib/calculations';
import { CATEGORIES, CURRENCIES } from '@/lib/constants';
import { t } from '@/lib/i18n';
import ShoppingListItem from '@/components/ShoppingListItem';

type SortDir = 'desc' | 'asc';

export default function ListPage() {
    const items = useStore((s) => s.items);
    const settings = useStore((s) => s.settings);
    const language = useStore((s) => s.language);
    const [priceSort, setPriceSort] = useState<SortDir>('desc');
    const [filterCategory, setFilterCategory] = useState('all');
    const [search, setSearch] = useState('');

    const setOpenSwipeId = useStore((s) => s.setOpenSwipeId);
    const T = (key: string) => t(language, key);
    const closeSwipe = useCallback(() => setOpenSwipeId(null), [setOpenSwipeId]);

    const currencySymbol = CURRENCIES.find((c) => c.code === settings.currency)?.symbol || '$';

    const filtered = useMemo(() => {
        let list = items.filter(i => i.location === 'list' || (!i.location && !i.completed));
        if (filterCategory !== 'all') {
            list = list.filter((i) => i.category === filterCategory);
        }
        if (search.trim()) {
            const q = search.trim().toLowerCase();
            list = list.filter((i) =>
                i.name.toLowerCase().includes(q) ||
                i.category.toLowerCase().includes(q)
            );
        }
        return list;
    }, [items, filterCategory, search]);

    const sorted = useMemo(() => {
        const list = [...filtered];

        // Helper to sort by pin status first, then by the specific criteria
        const sortWithPin = (sortFn: (a: typeof list[0], b: typeof list[0]) => number) => {
            return list.sort((a, b) => {
                // Pinned items always come first
                if (a.pinned && !b.pinned) return -1;
                if (!a.pinned && b.pinned) return 1;
                // If both are pinned or both are unpinned, use the specific sort logic
                return sortFn(a, b);
            });
        };

        return sortWithPin((a, b) => {
            if (priceSort === 'desc') {
                return b.price - a.price;
            } else {
                return a.price - b.price;
            }
        });
    }, [filtered, priceSort]);

    const totalPrice = sorted.reduce((sum, i) => sum + i.price, 0);
    const totalHours = sorted.reduce((sum, i) => sum + getTimeNeeded(i.price, settings).hours, 0);

    return (
        <div className="max-w-lg mx-auto px-4 py-8 space-y-6" onClick={closeSwipe}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-semibold" style={{ letterSpacing: '-0.03em', lineHeight: '1.1' }}>{T('shoppingList')}</h2>
                    <p className="text-sm text-muted">{items.length} {items.length !== 1 ? T('items') : T('item')}</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setPriceSort(prev => prev === 'desc' ? 'asc' : 'desc')}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface hover:bg-surface-hover border border-border text-sm font-medium transition-colors text-accent cursor-pointer"
                    >
                        {T('priceOnly')}
                        <div className="flex flex-col items-center justify-center -space-y-1">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" className={priceSort === 'asc' ? 'text-accent' : 'text-muted/40'}>
                                <polygon points="12,6 4,20 20,20" />
                            </svg>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" className={priceSort === 'desc' ? 'text-accent' : 'text-muted/40'}>
                                <polygon points="12,18 4,4 20,4" />
                            </svg>
                        </div>
                    </button>
                    <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="px-3 py-1.5 rounded-[10px] bg-surface text-xs font-medium focus:outline-none focus:ring-2 focus:ring-accent/50 appearance-none cursor-pointer"
                        style={{ border: '1px solid var(--border-color)' }}
                    >
                        <option value="all">{T('all')}</option>
                        {CATEGORIES.map((c) => (
                            <option key={c} value={c}>{T(c)}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none"
                    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={T('searchItems')}
                    className="w-full pl-9 pr-4 py-2.5 rounded-[10px] bg-surface text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
                    style={{ border: '1px solid var(--border-color)' }}
                />
            </div>

            {/* Summary bar */}
            {sorted.length > 0 && (
                <div className="glass-card p-4 flex items-center justify-between">
                    <div>
                        <p className="text-xs text-muted">{T('totalCost')}</p>
                        <p className="text-lg font-bold tabular-nums">
                            {currencySymbol}{totalPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-muted">{T('totalTime')}</p>
                        <p className="text-lg font-bold tabular-nums text-accent">
                            {formatHours(totalHours)} {T('hrs')}
                        </p>
                    </div>
                </div>
            )}

            {/* List */}
            {sorted.length === 0 ? (
                <div className="glass-card p-12 text-center space-y-3">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-accent/10 flex items-center justify-center">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-accent">
                            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                            <line x1="3" y1="6" x2="21" y2="6" />
                            <path d="M16 10a4 4 0 01-8 0" />
                        </svg>
                    </div>
                    <p className="text-muted text-sm">{T('emptyListTitle')}</p>
                    <p className="text-muted text-xs">{T('emptyListSub')}</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {sorted.map((item) => (
                        <ShoppingListItem key={item.id} item={item} />
                    ))}
                </div>
            )}

            <div className="h-8" />
        </div>
    );
}
