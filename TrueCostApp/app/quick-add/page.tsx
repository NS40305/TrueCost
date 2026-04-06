'use client';

import { useState, useCallback, useRef } from 'react';
import { useStore, QuickAddPreset } from '@/lib/store';
import { CATEGORIES, CURRENCIES, Category } from '@/lib/constants';
import { t } from '@/lib/i18n';
import { motion, useAnimation, useMotionValue, useMotionValueEvent, PanInfo } from 'framer-motion';

/* ── Single Quick Add Item Row ── */
function QuickAddRow({
    item,
    currencySymbol,
    onUpdate,
    onRemove,
    T,
}: {
    item: QuickAddPreset;
    currencySymbol: string;
    onUpdate: (id: string, updates: Partial<Omit<QuickAddPreset, 'id'>>) => void;
    onRemove: (id: string) => void;
    T: (key: string) => string;
}) {
    const controls = useAnimation();
    const x = useMotionValue(0);
    const [dragDir, setDragDir] = useState<'left' | null>(null);
    const [editing, setEditing] = useState(false);
    const [editName, setEditName] = useState(item.name);
    const [editPrice, setEditPrice] = useState(item.price.toString());
    const [editCategory, setEditCategory] = useState<Category>(item.category);
    const hasDragged = useRef(false);
    const openState = useRef<'left' | null>(null);
    const ACTION_WIDTH = 80;

    useMotionValueEvent(x, 'change', (latest) => {
        if (latest < -5) setDragDir('left');
        else setDragDir(null);
    });

    const handleDragEnd = useCallback(
        async (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
            const offset = info.offset.x;
            const velocity = info.velocity.x;
            const currentX = x.get();

            // Snap back from open
            if (openState.current === 'left' && (offset > 10 || currentX > -ACTION_WIDTH * 0.5)) {
                openState.current = null;
                controls.start({ x: 0, transition: { type: 'spring', bounce: 0, duration: 0.3 } });
                return;
            }

            // Swipe left → reveal Delete
            if (offset < -ACTION_WIDTH * 0.4 || velocity < -500) {
                openState.current = 'left';
                controls.start({ x: -ACTION_WIDTH, transition: { type: 'spring', bounce: 0, duration: 0.4 } });
            } else {
                openState.current = null;
                controls.start({ x: 0, transition: { type: 'spring', bounce: 0, duration: 0.4 } });
            }
        },
        [controls, ACTION_WIDTH, x]
    );

    const handleDelete = useCallback(async () => {
        await controls.start({ x: '-100%', opacity: 0, transition: { duration: 0.25 } });
        onRemove(item.id);
    }, [controls, onRemove, item.id]);

    const handleSave = () => {
        const trimmedName = editName.trim();
        const parsedPrice = parseFloat(editPrice);
        if (trimmedName && parsedPrice > 0) {
            onUpdate(item.id, { name: trimmedName, price: parsedPrice, category: editCategory });
        }
        setEditing(false);
    };

    const handleCancelEdit = () => {
        setEditName(item.name);
        setEditPrice(item.price.toString());
        setEditCategory(item.category);
        setEditing(false);
    };

    if (editing) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card p-4 space-y-3"
            >
                <div className="grid grid-cols-5 gap-3">
                    <div className="col-span-3">
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted block mb-1">
                            {T('name')}
                        </label>
                        <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all"
                            autoFocus
                        />
                    </div>
                    <div className="col-span-2">
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted block mb-1">
                            {T('pricePlaceholder')}
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                value={editPrice}
                                onChange={(e) => setEditPrice(e.target.value)}
                                min="0"
                                step="0.01"
                                className="w-full px-3 py-2 rounded-xl bg-background border border-border text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all"
                            />
                        </div>
                    </div>
                </div>
                <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted block mb-1">
                        {T('category')}
                    </label>
                    <select
                        value={editCategory}
                        onChange={(e) => setEditCategory(e.target.value as Category)}
                        className="w-full px-3 py-2 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all appearance-none cursor-pointer"
                    >
                        {CATEGORIES.map((c) => (
                            <option key={c} value={c}>{T(c)}</option>
                        ))}
                    </select>
                </div>
                <div className="flex gap-2 pt-1">
                    <button
                        onClick={handleCancelEdit}
                        className="flex-1 py-2 rounded-xl text-sm font-semibold bg-surface-hover text-muted hover:text-foreground transition-colors"
                    >
                        {T('cancel')}
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!editName.trim() || !(parseFloat(editPrice) > 0)}
                        className="flex-1 py-2 rounded-xl text-sm font-semibold bg-accent text-white hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                        {T('save')}
                    </button>
                </div>
            </motion.div>
        );
    }

    return (
        <div className="relative overflow-hidden rounded-2xl bg-surface/50">
            {/* Delete action behind */}
            <div
                className={`absolute inset-y-0 right-0 flex w-full z-0 transition-opacity duration-200 ${
                    dragDir === 'left' ? 'opacity-100' : 'opacity-0'
                } pointer-events-none`}
            >
                <button
                    onClick={handleDelete}
                    className={`flex-1 flex items-center justify-end pr-4 text-white font-semibold text-sm bg-red-500 hover:bg-red-600 transition-colors ${
                        dragDir === 'left' ? 'pointer-events-auto' : 'pointer-events-none'
                    }`}
                >
                    <span className="flex flex-col items-center gap-1 w-[60px]">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                        </svg>
                        <span className="text-xs">{T('delete')}</span>
                    </span>
                </button>
            </div>

            {/* Foreground card */}
            <motion.div
                style={{ x, touchAction: 'pan-y', willChange: 'transform', transform: 'translateZ(0)' }}
                drag="x"
                dragDirectionLock
                dragConstraints={{ left: -ACTION_WIDTH, right: 0 }}
                dragElastic={0.2}
                onDragStart={() => { hasDragged.current = true; }}
                onDragEnd={handleDragEnd}
                animate={controls}
                onClick={() => {
                    if (!hasDragged.current) {
                        setEditing(true);
                    }
                    hasDragged.current = false;
                }}
                className="glass-card p-4 flex items-center gap-3 relative z-10 cursor-pointer select-none"
            >
                {/* Category color dot */}
                <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center shrink-0">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
                        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                    </svg>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{item.name}</p>
                    <p className="text-xs text-muted mt-0.5">{T(item.category)}</p>
                </div>

                {/* Price */}
                <div className="text-right shrink-0">
                    <p className="font-bold text-sm tabular-nums text-accent">
                        {currencySymbol}{item.price.toLocaleString()}
                    </p>
                </div>

                {/* Edit hint */}
                <div className="text-muted/30 shrink-0">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                </div>
            </motion.div>
        </div>
    );
}

/* ── Main Page ── */
export default function QuickAddSettingsPage() {
    const language = useStore((s) => s.language);
    const settings = useStore((s) => s.settings);
    const quickAddItems = useStore((s) => s.quickAddItems);
    const addQuickAddItem = useStore((s) => s.addQuickAddItem);
    const updateQuickAddItem = useStore((s) => s.updateQuickAddItem);
    const removeQuickAddItem = useStore((s) => s.removeQuickAddItem);
    const currencySymbol = CURRENCIES.find((c) => c.code === settings.currency)?.symbol || '$';

    const T = (key: string) => t(language, key);

    // Add form state
    const [newName, setNewName] = useState('');
    const [newPrice, setNewPrice] = useState('');
    const [newCategory, setNewCategory] = useState<Category>('Other');
    const [showAddForm, setShowAddForm] = useState(false);

    const handleAdd = () => {
        const trimmedName = newName.trim();
        const parsedPrice = parseFloat(newPrice);
        if (trimmedName && parsedPrice > 0) {
            addQuickAddItem({ name: trimmedName, price: parsedPrice, category: newCategory });
            setNewName('');
            setNewPrice('');
            setNewCategory('Other');
            setShowAddForm(false);
        }
    };

    const handleResetToDefaults = () => {
        if (confirm(T('resetConfirm'))) {
            // Import QUICK_ADD_PRESETS directly
            import('@/lib/constants').then(({ QUICK_ADD_PRESETS }) => {
                const { reorderQuickAddItems } = useStore.getState();
                reorderQuickAddItems(
                    QUICK_ADD_PRESETS.map((p) => ({
                        id: crypto.randomUUID(),
                        name: p.name,
                        price: p.price,
                        category: p.category,
                    }))
                );
            });
        }
    };

    return (
        <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
            {/* Hero */}
            <div className="text-center space-y-1">
                <h2 className="text-2xl font-bold">{T('quickAddSettings')}</h2>
                <p className="text-sm text-muted">{T('quickAddDesc')}</p>
            </div>

            {/* Add New Item Button / Form */}
            <div className="glass-card overflow-hidden">
                {!showAddForm ? (
                    <button
                        onClick={() => setShowAddForm(true)}
                        className="w-full p-4 flex items-center justify-center gap-2 text-accent font-semibold text-sm hover:bg-accent/5 transition-colors"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        {T('addNewItem')}
                    </button>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="p-4 space-y-3"
                    >
                        <div className="grid grid-cols-5 gap-3">
                            <div className="col-span-3">
                                <label className="text-xs font-semibold uppercase tracking-wider text-muted block mb-1">
                                    {T('itemNamePlaceholder')}
                                </label>
                                <input
                                    type="text"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    placeholder={T('itemNamePlaceholder')}
                                    className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all"
                                    autoFocus
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="text-xs font-semibold uppercase tracking-wider text-muted block mb-1">
                                    {T('pricePlaceholder')}
                                </label>
                                <input
                                    type="number"
                                    value={newPrice}
                                    onChange={(e) => setNewPrice(e.target.value)}
                                    placeholder="0.00"
                                    min="0"
                                    step="0.01"
                                    className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-semibold uppercase tracking-wider text-muted block mb-1">
                                {T('category')}
                            </label>
                            <select
                                value={newCategory}
                                onChange={(e) => setNewCategory(e.target.value as Category)}
                                className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all appearance-none cursor-pointer"
                            >
                                {CATEGORIES.map((c) => (
                                    <option key={c} value={c}>{T(c)}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex gap-2 pt-1">
                            <button
                                onClick={() => { setShowAddForm(false); setNewName(''); setNewPrice(''); setNewCategory('Other'); }}
                                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-surface-hover text-muted hover:text-foreground transition-colors"
                            >
                                {T('cancel')}
                            </button>
                            <button
                                onClick={handleAdd}
                                disabled={!newName.trim() || !(parseFloat(newPrice) > 0)}
                                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-accent text-white hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-accent/20"
                            >
                                {T('addNewItem')}
                            </button>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Items List */}
            <div className="space-y-2">
                {quickAddItems.length === 0 ? (
                    <div className="glass-card p-8 text-center">
                        <p className="text-muted text-sm">{T('noQuickAddItems')}</p>
                    </div>
                ) : (
                    quickAddItems.map((item, index) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.03 }}
                        >
                            <QuickAddRow
                                item={item}
                                currencySymbol={currencySymbol}
                                onUpdate={updateQuickAddItem}
                                onRemove={removeQuickAddItem}
                                T={T}
                            />
                        </motion.div>
                    ))
                )}
            </div>

            {/* Preview Section */}
            {quickAddItems.length > 0 && (
                <div className="glass-card p-4 space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted">{T('quickAdd')} — Preview</p>
                    <div className="flex flex-wrap gap-2">
                        {quickAddItems.map((item) => (
                            <span
                                key={item.id}
                                className="px-3 py-1.5 rounded-full text-xs font-medium bg-accent/10 text-accent border border-accent/20"
                            >
                                {item.name} · {currencySymbol}{item.price}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Reset to Defaults */}
            <button
                onClick={handleResetToDefaults}
                className="w-full py-2.5 rounded-xl text-xs font-semibold text-amber-500 bg-amber-500/10 hover:bg-amber-500/20 transition-colors"
            >
                {T('resetToDefaults')}
            </button>

            <div className="h-8" />
        </div>
    );
}
