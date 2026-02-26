'use client';

import { useState, memo, useCallback } from 'react';
import { ShoppingItem, useStore } from '@/lib/store';
import { getTimeNeeded, formatHours } from '@/lib/calculations';
import { CURRENCIES } from '@/lib/constants';
import { t } from '@/lib/i18n';
import { motion, useAnimation, PanInfo, useMotionValue, useMotionValueEvent } from 'framer-motion';

interface ShoppingListItemProps {
    item: ShoppingItem;
}

const ShoppingListItem = memo(function ShoppingListItem({ item }: ShoppingListItemProps) {
    const settings = useStore((s) => s.settings);
    const removeItem = useStore((s) => s.removeItem);
    const togglePin = useStore((s) => s.togglePin);
    const completeItem = useStore((s) => s.completeItem);
    const language = useStore((s) => s.language);
    const currencySymbol = CURRENCIES.find((c) => c.code === settings.currency)?.symbol || '$';

    const T = (key: string) => t(language, key);
    const time = getTimeNeeded(item.price, settings);

    const controls = useAnimation();
    const x = useMotionValue(0);
    const [isCompleting, setIsCompleting] = useState(false);
    const [dragDir, setDragDir] = useState<'left' | 'right' | null>(null);
    const ACTION_WIDTH_LEFT = 160;
    const ACTION_WIDTH_RIGHT = 100;

    useMotionValueEvent(x, "change", (latest) => {
        if (latest > 5) setDragDir('right');
        else if (latest < -5) setDragDir('left');
        else setDragDir(null);
    });

    const handleDragEnd = useCallback(async (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        const offset = info.offset.x;
        const velocity = info.velocity.x;

        // Swipe right (Reveal Complete)
        if (offset > ACTION_WIDTH_RIGHT * 0.4 || velocity > 500) {
            controls.start({ x: ACTION_WIDTH_RIGHT, transition: { type: 'spring', bounce: 0, duration: 0.4 } });
        }
        // Swipe left (Reveal actions)
        else if (offset < -ACTION_WIDTH_LEFT * 0.4 || velocity < -500) {
            controls.start({ x: -ACTION_WIDTH_LEFT, transition: { type: 'spring', bounce: 0, duration: 0.4 } });
        } else {
            // Snap back
            controls.start({ x: 0, transition: { type: 'spring', bounce: 0, duration: 0.4 } });
        }
    }, [controls, ACTION_WIDTH_LEFT, ACTION_WIDTH_RIGHT]);

    const handleComplete = useCallback(async () => {
        setIsCompleting(true);
        await controls.start({ x: '100%', opacity: 0, transition: { duration: 0.25 } });
        completeItem(item.id);
    }, [controls, completeItem, item.id]);

    const handlePin = useCallback(() => {
        togglePin(item.id);
        controls.start({ x: 0 });
    }, [togglePin, item.id, controls]);

    const handleDelete = useCallback(() => {
        removeItem(item.id);
    }, [removeItem, item.id]);

    return (
        <div className="relative overflow-hidden rounded-2xl bg-surface/50">
            {/* Complete action button (left side) */}
            <div className={`absolute inset-y-0 left-0 flex w-full transition-opacity duration-200 ${dragDir === 'right' || isCompleting ? 'opacity-100' : 'opacity-0'} ${isCompleting ? 'z-20' : 'z-0 pointer-events-none'}`}>
                <button
                    onClick={handleComplete}
                    className={`flex-1 flex items-center justify-start pl-4 text-white font-semibold text-sm bg-green-500 hover:bg-green-600 transition-colors ${isCompleting ? '' : 'pointer-events-auto cursor-pointer'}`}
                >
                    <span className="flex flex-col items-center gap-1 w-[80px]">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                        <span className="text-xs">{T('complete')}</span>
                    </span>
                </button>
            </div>

            {/* Action buttons behind the card (right side) */}
            <div className={`absolute inset-y-0 right-0 flex w-full z-0 transition-opacity duration-200 ${dragDir === 'left' ? 'opacity-100' : 'opacity-0'} pointer-events-none`}>
                <button
                    onClick={handlePin}
                    className="flex-1 flex items-center justify-end text-white font-semibold text-sm bg-blue-500 hover:bg-blue-600 transition-colors pointer-events-auto cursor-pointer"
                >
                    <div className="w-[80px] flex flex-col items-center justify-center gap-1">
                        {item.pinned ? (
                            <>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="-scale-x-100 -scale-y-100">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                                <span className="text-xs">{T('unpin')}</span>
                            </>
                        ) : (
                            <>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none" className="-scale-x-100 -scale-y-100">
                                    <path d="M16 2l-4 4-6 1-3 3 3.5 3.5L2 18l4.5-4.5L10 17l3-3 1-6 4-4-2-2z" />
                                </svg>
                                <span className="text-xs">{T('pin')}</span>
                            </>
                        )}
                    </div>
                </button>
                <button
                    onClick={handleDelete}
                    className="w-[80px] shrink-0 flex items-center justify-center text-white font-semibold text-sm bg-red-500 hover:bg-red-600 transition-colors pointer-events-auto cursor-pointer"
                >
                    <span className="flex flex-col items-center gap-1">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                        </svg>
                        <span className="text-xs">{T('delete')}</span>
                    </span>
                </button>
            </div>

            {/* Foreground card — slidable via framer-motion */}
            <motion.div
                style={{ x, touchAction: 'pan-y', willChange: 'transform', transform: 'translateZ(0)' }}
                drag="x"
                dragDirectionLock
                dragConstraints={{ left: -ACTION_WIDTH_LEFT, right: ACTION_WIDTH_RIGHT }}
                dragElastic={0.2}
                onDragEnd={handleDragEnd}
                animate={controls}
                className="glass-card bg-surface p-4 flex items-center gap-4 relative z-10 cursor-grab active:cursor-grabbing select-none"
            >
                {/* Pin indicator + icon */}
                <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center shrink-0 relative">
                    {item.pinned && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="white" stroke="none" className="-scale-x-100 -scale-y-100">
                                <path d="M16 2l-4 4-6 1-3 3 3.5 3.5L2 18l4.5-4.5L10 17l3-3 1-6 4-4-2-2z" />
                            </svg>
                        </div>
                    )}
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
                        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                        <line x1="3" y1="6" x2="21" y2="6" />
                        <path d="M16 10a4 4 0 01-8 0" />
                    </svg>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm truncate">{item.name}</p>
                        {item.url && (
                            <a
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-accent hover:text-accent-hover shrink-0"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                                    <polyline points="15 3 21 3 21 9" />
                                    <line x1="10" y1="14" x2="21" y2="3" />
                                </svg>
                            </a>
                        )}
                    </div>
                    <p className="text-xs text-muted mt-0.5">{item.category}</p>
                </div>

                {/* Price & time */}
                <div className="text-right shrink-0">
                    <p className="font-bold text-sm tabular-nums">
                        {currencySymbol}{item.price.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted tabular-nums">
                        {formatHours(time.hours)} {T('hrs')}
                    </p>
                </div>

                {/* Swipe hint arrows */}
                <div className="text-muted/30 shrink-0 ml-1 flex flex-col items-center">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="rotate-180">
                        <polyline points="15 18 9 12 15 6" />
                    </svg>
                </div>
            </motion.div>
        </div>
    );
});

export default ShoppingListItem;
