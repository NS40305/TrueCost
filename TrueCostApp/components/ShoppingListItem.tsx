'use client';

import { useState, memo, useCallback, useRef } from 'react';
import { ShoppingItem, useStore } from '@/lib/store';
import { getTimeNeeded, formatHours } from '@/lib/calculations';
import { CURRENCIES } from '@/lib/constants';
import { t } from '@/lib/i18n';
import { motion, useAnimation, PanInfo, useMotionValue, useMotionValueEvent } from 'framer-motion';
import EditItemModal from './EditItemModal';
import CategoryIcon from './CategoryIcon';

interface ShoppingListItemProps {
    item: ShoppingItem;
}

/* iOS Mail — critically-damped spring, ~120 ms settle */
const SPRING      = { type: 'spring' as const, stiffness: 800, damping: 57, restDelta: 0.5 };
const SPRING_EXIT = { type: 'spring' as const, stiffness: 600, damping: 35 };

const SWIPE_COMMIT = 8;      // px to lock horizontal vs vertical (iOS ≈ 8)
const SNAP_RATIO   = 0.5;    // 50 % of action width → snap open (iOS Mail)
const FLICK_V      = 300;    // px/s flick → snap open (iOS Mail ≈ 300)

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
    const [editOpen, setEditOpen] = useState(false);
    const hasDragged = useRef(false);
    const openState = useRef<'left' | 'right' | null>(null);
    const dragCommitted = useRef(false);
    const isClosing = useRef(false);
    const dragSide = useRef<'positive' | 'negative' | null>(null);
    const ACTION_WIDTH_LEFT = 160;
    const ACTION_WIDTH_RIGHT = 100;

    const rightOpacity = useMotionValue(0);
    const leftOpacity  = useMotionValue(0);
    const [debug, setDebug] = useState({ x: 0, vx: 0, dx: 0, dy: 0, committed: false, side: '-', open: '-', closing: false });

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

        setDebug({
            x: Math.round(x.get()),
            vx: Math.round(info.velocity.x),
            dx: Math.round(info.offset.x),
            dy: Math.round(info.offset.y),
            committed: dragCommitted.current,
            side: dragSide.current || '-',
            open: openState.current || '-',
            closing: isClosing.current,
        });
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
        setDebug(prev => ({ ...prev, x: Math.round(cx), vx: Math.round(vx) }));

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

    const handleComplete = useCallback(async () => {
        setIsCompleting(true);
        await controls.start({ x: '100%', opacity: 0, transition: SPRING_EXIT });
        completeItem(item.id);
    }, [controls, completeItem, item.id]);

    const handlePin = useCallback(() => {
        togglePin(item.id);
        snapTo(0, null);
    }, [togglePin, item.id, snapTo]);

    const handleDelete = useCallback(async () => {
        await controls.start({ x: '-100%', opacity: 0, transition: SPRING_EXIT });
        removeItem(item.id);
    }, [controls, removeItem, item.id]);

    return (
        <div className="relative overflow-hidden rounded-2xl bg-surface/50">
            {/* Complete action (left background — revealed on swipe right) */}
            <motion.div
                style={{ opacity: isCompleting ? 1 : rightOpacity }}
                className={`absolute inset-y-0 left-0 flex ${isCompleting ? 'w-full z-20' : 'w-full z-0'}`}
            >
                <button
                    onClick={handleComplete}
                    className="flex-1 flex items-center justify-start pl-4 text-white font-semibold text-sm bg-green-500 hover:bg-green-600 transition-colors cursor-pointer"
                >
                    <span className="flex flex-col items-center gap-1 w-[80px]">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                        <span className="text-xs">{T('complete')}</span>
                    </span>
                </button>
            </motion.div>

            {/* Pin + Delete actions (right background — revealed on swipe left) */}
            <motion.div
                style={{ opacity: leftOpacity }}
                className="absolute inset-y-0 right-0 flex w-full z-0"
            >
                <button
                    onClick={handlePin}
                    className="flex-1 flex items-center justify-end text-white font-semibold text-sm bg-blue-500 hover:bg-blue-600 transition-colors"
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
                    className="w-[80px] shrink-0 flex items-center justify-center text-white font-semibold text-sm bg-red-500 hover:bg-red-600 transition-colors"
                >
                    <span className="flex flex-col items-center gap-1">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                        </svg>
                        <span className="text-xs">{T('delete')}</span>
                    </span>
                </button>
            </motion.div>

            {/* Foreground card — slidable via framer-motion */}
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
                className="glass-card p-4 flex items-center gap-4 relative z-10 cursor-pointer select-none"
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
                    <CategoryIcon category={item.category} className="text-accent" size={20} />
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
                    <p className="text-xs text-muted mt-0.5">{T(item.category)}</p>
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

            {/* Debug overlay */}
            <div className="absolute top-0 right-0 z-50 bg-black/80 text-[9px] text-green-400 font-mono px-2 py-1 rounded-bl-lg pointer-events-none leading-tight">
                <div>x:<b>{debug.x}</b> vx:<b>{debug.vx}</b></div>
                <div>dx:{debug.dx} dy:{debug.dy}</div>
                <div>commit:{debug.committed ? '✓' : '✗'} side:{debug.side}</div>
                <div>open:{debug.open} closing:{debug.closing ? '✓' : '✗'}</div>
            </div>

            {/* Edit modal */}
            <EditItemModal
                item={item}
                open={editOpen}
                onClose={() => setEditOpen(false)}
                showDate={false}
            />
        </div>
    );
});

export default ShoppingListItem;
