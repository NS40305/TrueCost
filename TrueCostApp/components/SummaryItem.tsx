'use client';

import { useState, memo, useCallback, useRef } from 'react';
import { ShoppingItem, useStore } from '@/lib/store';
import { getTimeNeeded, formatHours } from '@/lib/calculations';
import { CURRENCIES } from '@/lib/constants';
import { t } from '@/lib/i18n';
import { motion, useAnimation, PanInfo, useMotionValue, useMotionValueEvent } from 'framer-motion';
import EditItemModal from './EditItemModal';
import CategoryIcon from './CategoryIcon';

interface SummaryItemProps {
    item: ShoppingItem;
    dateLabel: string;
}

/* iOS Mail — critically-damped spring, ~120 ms settle */
const SPRING      = { type: 'spring' as const, stiffness: 800, damping: 57, restDelta: 0.5 };
const SPRING_EXIT = { type: 'spring' as const, stiffness: 600, damping: 35 };

const SWIPE_COMMIT = 8;      // px to lock horizontal vs vertical (iOS ≈ 8)
const SNAP_RATIO   = 0.4;    // 40 % of action width → snap open
const FLICK_V      = 500;    // px/s flick → snap open

const SummaryItem = memo(function SummaryItem({ item, dateLabel }: SummaryItemProps) {
    const settings = useStore((s) => s.settings);
    const removeItem = useStore((s) => s.removeItem);
    const regretItem = useStore((s) => s.regretItem);
    const language = useStore((s) => s.language);
    const currencySymbol = CURRENCIES.find((c) => c.code === settings.currency)?.symbol || '$';

    const T = (key: string) => t(language, key);
    const time = getTimeNeeded(item.price, settings);

    const controls = useAnimation();
    const x = useMotionValue(0);
    const [editOpen, setEditOpen] = useState(false);
    const hasDragged = useRef(false);
    const openState = useRef<'left' | 'right' | null>(null);
    const dragCommitted = useRef(false);
    const isClosing = useRef(false);
    const dragSide = useRef<'positive' | 'negative' | null>(null);
    const ACTION_WIDTH_LEFT = 100;   // delete (swipe left)
    const ACTION_WIDTH_RIGHT = 100;  // regret/undo (swipe right)

    const rightOpacity = useMotionValue(0);
    const leftOpacity  = useMotionValue(0);

    useMotionValueEvent(x, 'change', (v) => {
        if (isClosing.current) return;
        rightOpacity.set(v > 0 ? 1 : 0);
        leftOpacity.set(v < 0 ? 1 : 0);
    });

    const handleDragStart = useCallback(() => {
        controls.stop();
        isClosing.current = false;
        hasDragged.current = true;
        dragCommitted.current = false;
        if (openState.current === 'right') dragSide.current = 'positive';
        else if (openState.current === 'left') dragSide.current = 'negative';
        else dragSide.current = null;
    }, [controls]);

    const handleDrag = useCallback((_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        if (!dragCommitted.current) {
            const absX = Math.abs(info.offset.x);
            const absY = Math.abs(info.offset.y);
            if (absX < SWIPE_COMMIT && absY < SWIPE_COMMIT) return;
            if (absX > absY) dragCommitted.current = true;
            else return;
        }

        if (!dragSide.current) {
            if (info.offset.x > 0) dragSide.current = 'positive';
            else if (info.offset.x < 0) dragSide.current = 'negative';
        }

        const cur = x.get();
        if (dragSide.current === 'positive' && cur < 0) x.set(0);
        else if (dragSide.current === 'negative' && cur > 0) x.set(0);
    }, [x]);

    const snapTo = useCallback((target: number, side: 'left' | 'right' | null) => {
        isClosing.current = true;
        openState.current = side;
        rightOpacity.set(side === 'right' ? 1 : 0);
        leftOpacity.set(side === 'left' ? 1 : 0);
        controls.start({ x: target, transition: SPRING });
    }, [controls, rightOpacity, leftOpacity]);

    const handleDragEnd = useCallback((_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        const vx = info.velocity.x;
        const cx = x.get();

        if (!dragCommitted.current) { snapTo(0, null); return; }

        // Already open → any reverse intent closes
        if (openState.current === 'right' && (vx < -FLICK_V || cx < ACTION_WIDTH_RIGHT * 0.5)) {
            snapTo(0, null); return;
        }
        if (openState.current === 'left' && (vx > FLICK_V || cx > -ACTION_WIDTH_LEFT * 0.5)) {
            snapTo(0, null); return;
        }

        // From closed: flick or position past threshold → open
        if (cx > ACTION_WIDTH_RIGHT * SNAP_RATIO || vx > FLICK_V) {
            snapTo(ACTION_WIDTH_RIGHT, 'right'); return;
        }
        if (cx < -ACTION_WIDTH_LEFT * SNAP_RATIO || vx < -FLICK_V) {
            snapTo(-ACTION_WIDTH_LEFT, 'left'); return;
        }

        snapTo(0, null);
    }, [controls, ACTION_WIDTH_LEFT, ACTION_WIDTH_RIGHT, x, snapTo]);

    const handleRegret = useCallback(async () => {
        isClosing.current = true;
        rightOpacity.set(0);
        await controls.start({ x: 0, transition: SPRING });
        openState.current = null;
        regretItem(item.id);
    }, [controls, regretItem, item.id, rightOpacity]);

    const handleDelete = useCallback(async () => {
        await controls.start({ x: '-100%', opacity: 0, transition: SPRING_EXIT });
        removeItem(item.id);
    }, [controls, removeItem, item.id]);

    return (
        <div className="relative overflow-hidden rounded-2xl bg-surface/50">
            {/* Regret action (left background — revealed on swipe right) */}
            <motion.div
                style={{ opacity: rightOpacity }}
                className="absolute inset-y-0 left-0 flex w-full z-0"
            >
                <button
                    onClick={handleRegret}
                    className={`flex-1 flex items-center justify-start pl-4 text-white font-semibold text-sm ${item.regretted ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-purple-500 hover:bg-purple-600'} transition-colors`}
                >
                    <span className="flex flex-col items-center gap-1 w-[80px]">
                        {item.regretted ? (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                                <polyline points="22 4 12 14.01 9 11.01" />
                            </svg>
                        ) : (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z" />
                                <line x1="1" y1="1" x2="23" y2="23" />
                            </svg>
                        )}
                        <span className="text-xs">{item.regretted ? T('unregret') : T('undoToList')}</span>
                    </span>
                </button>
            </motion.div>

            {/* Delete action (right background — revealed on swipe left) */}
            <motion.div
                style={{ opacity: leftOpacity }}
                className="absolute inset-y-0 right-0 flex w-full z-0"
            >
                <button
                    onClick={handleDelete}
                    className="flex-1 flex items-center justify-end pr-4 text-white font-semibold text-sm bg-red-500 hover:bg-red-600 transition-colors"
                >
                    <span className="flex flex-col items-center gap-1 w-[80px]">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                        </svg>
                        <span className="text-xs">{T('delete')}</span>
                    </span>
                </button>
            </motion.div>

            {/* Foreground card — slidable */}
            <motion.div
                style={{ x, touchAction: 'pan-y', willChange: 'transform', transform: 'translateZ(0)' }}
                drag="x"
                dragDirectionLock
                dragConstraints={{ left: -ACTION_WIDTH_LEFT, right: ACTION_WIDTH_RIGHT }}
                dragElastic={0}
                dragMomentum={false}
                onDragStart={handleDragStart}
                onDrag={handleDrag}
                onDragEnd={handleDragEnd}
                animate={controls}
                onClick={() => {
                    if (!hasDragged.current) setEditOpen(true);
                    hasDragged.current = false;
                }}
                className="glass-card bg-surface p-4 flex items-center gap-4 relative z-10 cursor-pointer select-none"
            >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: item.regretted ? 'rgba(168,85,247,0.15)' : 'rgba(var(--accent-rgb, 99,102,241),0.1)' }}>
                    <CategoryIcon 
                        category={item.category} 
                        size={20} 
                        className={item.regretted ? "text-purple-400" : "text-accent"} 
                    />
                </div>
                <div className="flex-1 min-w-0">
                    <p className={`font-semibold text-sm truncate ${item.regretted ? 'text-purple-300' : ''}`}>{item.name}</p>
                    <p className="text-xs text-muted mt-0.5">
                        {T(item.category)} • {dateLabel}
                        {item.regretted && <span className="ml-1 text-purple-400">• {T('regretted')}</span>}
                    </p>
                </div>
                <div className="text-right shrink-0">
                    <p className={`font-bold text-sm tabular-nums line-through ${item.regretted ? 'decoration-purple-400/50 text-purple-300' : 'decoration-muted/50'}`}>
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

            {/* Edit modal */}
            <EditItemModal
                item={item}
                open={editOpen}
                onClose={() => setEditOpen(false)}
                showDate={true}
            />
        </div>
    );
});

export default SummaryItem;
