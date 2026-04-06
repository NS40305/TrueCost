'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { ShoppingItem, useStore } from '@/lib/store';
import { CATEGORIES, CURRENCIES } from '@/lib/constants';
import type { Category } from '@/lib/constants';
import { t } from '@/lib/i18n';

interface EditItemModalProps {
    item: ShoppingItem;
    open: boolean;
    onClose: () => void;
    showDate?: boolean;
}

export default function EditItemModal({ item, open, onClose, showDate = false }: EditItemModalProps) {
    const updateItem = useStore((s) => s.updateItem);
    const language = useStore((s) => s.language);
    const currency = useStore((s) => s.settings.currency);
    const currencySymbol = CURRENCIES.find((c) => c.code === currency)?.symbol || '$';

    const T = (key: string) => t(language, key);

    const [name, setName] = useState(item.name);
    const [price, setPrice] = useState(String(item.price));
    const [category, setCategory] = useState<Category>(item.category);
    const [dateStr, setDateStr] = useState('');
    const [closing, setClosing] = useState(false);
    const nameRef = useRef<HTMLInputElement>(null);

    // Sync form state when item changes
    useEffect(() => {
        if (open) {
            setName(item.name);
            setPrice(String(item.price));
            setCategory(item.category);
            if (item.completedAt) {
                const d = new Date(item.completedAt);
                // Format as YYYY-MM-DD for the date input
                const yyyy = d.getFullYear();
                const mm = String(d.getMonth() + 1).padStart(2, '0');
                const dd = String(d.getDate()).padStart(2, '0');
                setDateStr(`${yyyy}-${mm}-${dd}`);
            } else {
                setDateStr('');
            }
            setClosing(false);
            // Auto-focus name input after animation
            setTimeout(() => nameRef.current?.focus(), 350);
        }
    }, [open, item]);

    const handleClose = useCallback(() => {
        setClosing(true);
        setTimeout(() => {
            setClosing(false);
            onClose();
        }, 200);
    }, [onClose]);

    const handleSave = useCallback(() => {
        const parsedPrice = parseFloat(price);
        if (!name.trim() || isNaN(parsedPrice) || parsedPrice <= 0) return;

        const updates: Parameters<typeof updateItem>[1] = {
            name: name.trim(),
            price: parsedPrice,
            category,
        };

        if (showDate && dateStr) {
            // Parse date string and set to noon to avoid timezone issues
            const [y, m, d] = dateStr.split('-').map(Number);
            const newDate = new Date(y, m - 1, d, 12, 0, 0);
            updates.completedAt = newDate.getTime();
        }

        updateItem(item.id, updates);
        handleClose();
    }, [name, price, category, dateStr, showDate, item.id, updateItem, handleClose]);

    // Handle Escape key
    useEffect(() => {
        if (!open) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') handleClose();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [open, handleClose]);

    if (!open) return null;

    return (
        <div
            className={`modal-overlay ${closing ? 'closing' : ''}`}
            onClick={(e) => {
                if (e.target === e.currentTarget) handleClose();
            }}
        >
            <div className="modal-sheet glass-card p-6 space-y-5">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold">{T('editItem')}</h2>
                    <button
                        onClick={handleClose}
                        className="p-1.5 rounded-lg hover:bg-surface-hover transition-colors"
                        aria-label="Close"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                {/* Name field */}
                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted uppercase tracking-wider">{T('name')}</label>
                    <input
                        ref={nameRef}
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-surface-hover border border-border text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all"
                        placeholder={T('itemName')}
                    />
                </div>

                {/* Price field */}
                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted uppercase tracking-wider">{T('priceOnly')}</label>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted font-semibold">{currencySymbol}</span>
                        <input
                            type="number"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            min="0"
                            step="0.01"
                            className="w-full pl-12 pr-4 py-3 rounded-xl bg-surface-hover border border-border text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all tabular-nums"
                        />
                    </div>
                </div>

                {/* Category field */}
                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted uppercase tracking-wider">{T('category')}</label>
                    <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value as Category)}
                        className="w-full px-4 py-3 rounded-xl bg-surface-hover border border-border text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all appearance-none cursor-pointer"
                    >
                        {CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>{T(cat)}</option>
                        ))}
                    </select>
                </div>

                {/* Date field — only in Summary */}
                {showDate && (
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted uppercase tracking-wider">{T('date')}</label>
                        <input
                            type="date"
                            value={dateStr}
                            onChange={(e) => setDateStr(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-surface-hover border border-border text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all"
                        />
                    </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-3 pt-2">
                    <button
                        onClick={handleClose}
                        className="flex-1 px-4 py-3 rounded-xl text-sm font-semibold bg-surface-hover hover:bg-border text-muted transition-colors"
                    >
                        {T('cancel')}
                    </button>
                    <button
                        onClick={handleSave}
                        className="flex-1 px-4 py-3 rounded-xl text-sm font-semibold bg-accent hover:bg-accent-hover text-white transition-colors"
                    >
                        {T('save')}
                    </button>
                </div>
            </div>
        </div>
    );
}
