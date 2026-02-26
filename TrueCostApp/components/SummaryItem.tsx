'use client';

import { useState, memo, useCallback } from 'react';
import { ShoppingItem, useStore } from '@/lib/store';
import { getTimeNeeded, formatHours } from '@/lib/calculations';
import { CURRENCIES } from '@/lib/constants';
import { t } from '@/lib/i18n';
import { motion, useAnimation, PanInfo, useMotionValue, useMotionValueEvent } from 'framer-motion';

interface SummaryItemProps {
    item: ShoppingItem;
    dateLabel: string;
}

const SummaryItem = memo(function SummaryItem({ item, dateLabel }: SummaryItemProps) {
    const settings = useStore((s) => s.settings);
    const removeItem = useStore((s) => s.removeItem);
    const uncompleteItem = useStore((s) => s.uncompleteItem);
    const language = useStore((s) => s.language);
    const currencySymbol = CURRENCIES.find((c) => c.code === settings.currency)?.symbol || '$';

    const T = (key: string) => t(language, key);
    const time = getTimeNeeded(item.price, settings);

    const controls = useAnimation();
    const x = useMotionValue(0);
    const [dragDir, setDragDir] = useState<'left' | 'right' | null>(null);
    const ACTION_WIDTH_LEFT = 100;   // delete (swipe left)
    const ACTION_WIDTH_RIGHT = 100;  // undo (swipe right)

    useMotionValueEvent(x, "change", (latest) => {
        if (latest > 5) setDragDir('right');
        else if (latest < -5) setDragDir('left');
        else setDragDir(null);
    });

    const handleDragEnd = useCallback(async (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        const offset = info.offset.x;
        const velocity = info.velocity.x;

        // Swipe right → reveal Undo button
        if (offset > ACTION_WIDTH_RIGHT * 0.4 || velocity > 500) {
            controls.start({ x: ACTION_WIDTH_RIGHT, transition: { type: 'spring', bounce: 0, duration: 0.4 } });
        }
        // Swipe left → reveal Delete button
        else if (offset < -ACTION_WIDTH_LEFT * 0.4 || velocity < -500) {
            controls.start({ x: -ACTION_WIDTH_LEFT, transition: { type: 'spring', bounce: 0, duration: 0.4 } });
        } else {
            controls.start({ x: 0, transition: { type: 'spring', bounce: 0, duration: 0.4 } });
        }
    }, [controls, ACTION_WIDTH_LEFT, ACTION_WIDTH_RIGHT]);

    const handleUndo = useCallback(async () => {
        await controls.start({ x: '100%', opacity: 0, transition: { duration: 0.25 } });
        uncompleteItem(item.id);
    }, [controls, uncompleteItem, item.id]);

    const handleDelete = useCallback(async () => {
        await controls.start({ x: '-100%', opacity: 0, transition: { duration: 0.25 } });
        removeItem(item.id);
    }, [controls, removeItem, item.id]);

    return (
        <div className="relative overflow-hidden rounded-2xl bg-surface/50">
            {/* Undo action (left background — revealed on swipe right) */}
            <div className={`absolute inset-y-0 left-0 flex w-full z-0 transition-opacity duration-200 ${dragDir === 'right' ? 'opacity-100' : 'opacity-0'} pointer-events-none`}>
                <button
                    onClick={handleUndo}
                    className="flex-1 flex items-center justify-start pl-4 text-white font-semibold text-sm bg-amber-500 hover:bg-amber-600 transition-colors pointer-events-auto"
                >
                    <span className="flex flex-col items-center gap-1 w-[80px]">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="1 4 1 10 7 10" />
                            <path d="M3.51 15a9 9 0 105.64-8.36L1 10" />
                        </svg>
                        <span className="text-xs">{T('undoToList')}</span>
                    </span>
                </button>
            </div>

            {/* Delete action (right background — revealed on swipe left) */}
            <div className={`absolute inset-y-0 right-0 flex w-full z-0 transition-opacity duration-200 ${dragDir === 'left' ? 'opacity-100' : 'opacity-0'} pointer-events-none`}>
                <button
                    onClick={handleDelete}
                    className="flex-1 flex items-center justify-end pr-4 text-white font-semibold text-sm bg-red-500 hover:bg-red-600 transition-colors pointer-events-auto"
                >
                    <span className="flex flex-col items-center gap-1 w-[80px]">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                        </svg>
                        <span className="text-xs">{T('delete')}</span>
                    </span>
                </button>
            </div>

            {/* Foreground card — slidable */}
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
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{item.name}</p>
                    <p className="text-xs text-muted mt-0.5">{item.category} • {dateLabel}</p>
                </div>
                <div className="text-right shrink-0">
                    <p className="font-bold text-sm tabular-nums line-through decoration-muted/50">
                        {currencySymbol}{item.price.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted tabular-nums">
                        {formatHours(time.hours)} {T('hrs')}
                    </p>
                </div>
                {/* Swipe hint */}
                <div className="text-muted/30 shrink-0 ml-1 flex flex-col items-center">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="rotate-180">
                        <polyline points="15 18 9 12 15 6" />
                    </svg>
                </div>
            </motion.div>
        </div>
    );
});

export default SummaryItem;
