'use client';

import { useState, memo, useCallback, useRef, useEffect } from 'react';
import { ShoppingItem, useStore } from '@/lib/store';
import { getTimeNeeded, formatHours } from '@/lib/calculations';
import { CURRENCIES } from '@/lib/constants';
import { t } from '@/lib/i18n';
import { motion, useAnimation, PanInfo, useMotionValue } from 'framer-motion';
import EditItemModal from './EditItemModal';
import CategoryIcon from './CategoryIcon';

interface ShoppingListItemProps {
    item: ShoppingItem;
}

const SWIPE_COMMIT = 8;      // px to lock horizontal vs vertical (iOS ≈ 8)
const SNAP_RATIO = 0.4;    // 40 % of action width → snap open
const FLICK_V = 500;    // px/s flick → snap open
const CROSS_PEEK = 12;      // max px past center when closing from open state

const ShoppingListItem = memo(function ShoppingListItem({ item }: ShoppingListItemProps) {
    const settings = useStore((s) => s.settings);
    const removeItem = useStore((s) => s.removeItem);
    const togglePin = useStore((s) => s.togglePin);
    const completeItem = useStore((s) => s.completeItem);
    const language = useStore((s) => s.language);
    const openSwipeId = useStore((s) => s.openSwipeId);
    const setOpenSwipeId = useStore((s) => s.setOpenSwipeId);
    const currencySymbol = CURRENCIES.find((c) => c.code === settings.currency)?.symbol || '$';

    const T = (key: string) => t(language, key);
    const time = getTimeNeeded(item.price, settings);

    const controls = useAnimation();
    const x = useMotionValue(0);
    const [isCompleting, setIsCompleting] = useState(false);
    const [activeSide, setActiveSide] = useState<'left' | 'right' | null>(null);
    const [editOpen, setEditOpen] = useState(false);
    const hasDragged = useRef(false);
    const openState = useRef<'left' | 'right' | null>(null);
    const dragCommitted = useRef(false);
    const isClosing = useRef(false);
    const ACTION_WIDTH_LEFT = 160;
    const ACTION_WIDTH_RIGHT = 100;

    const rightOpacity = useMotionValue(0);
    const leftOpacity = useMotionValue(0);
    const dragSide = useRef<'left' | 'right' | null>(null);
    const wasOpenSide = useRef<'left' | 'right' | null>(null);

    useEffect(() => {
        if (openSwipeId !== item.id && openState.current !== null) {
            openState.current = null;
            rightOpacity.set(0);
            leftOpacity.set(0);
            controls.set({ x: 0 });
            setActiveSide(null);
        }
    }, [openSwipeId]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleDragStart = useCallback(() => {
        controls.stop();
        isClosing.current = false;
        hasDragged.current = true;
        dragCommitted.current = false;
        dragSide.current = null;
        wasOpenSide.current = openState.current;
    }, [controls]);

    const handleDrag = useCallback((_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        if (!dragCommitted.current) {
            const absX = Math.abs(info.offset.x);
            const absY = Math.abs(info.offset.y);
            if (absX < SWIPE_COMMIT && absY < SWIPE_COMMIT) return;
            if (absX > absY) {
                dragCommitted.current = true;
                dragSide.current = info.offset.x > 0 ? 'right' : 'left';
                if (!wasOpenSide.current) {
                    rightOpacity.set(dragSide.current === 'right' ? 1 : 0);
                    leftOpacity.set(dragSide.current === 'left' ? 1 : 0);
                }
            }
            else return;
        }

        const cur = x.get();

        if (wasOpenSide.current) {
            if (wasOpenSide.current === 'right') {
                rightOpacity.set(cur > 2 ? 1 : 0);
                leftOpacity.set(0);
                if (cur < -CROSS_PEEK) x.set(-CROSS_PEEK);
            } else {
                leftOpacity.set(cur < -2 ? 1 : 0);
                rightOpacity.set(0);
                if (cur > CROSS_PEEK) x.set(CROSS_PEEK);
            }
            return;
        }

        if (dragSide.current === 'right' && cur < 0) x.set(0);
        if (dragSide.current === 'left' && cur > 0) x.set(0);
    }, [x, rightOpacity, leftOpacity]);

    const snapTo = useCallback((target: number, side: 'left' | 'right' | null) => {
        isClosing.current = false;
        openState.current = side;
        setActiveSide(side);

        if (side !== null) {
            setOpenSwipeId(item.id);
            rightOpacity.set(side === 'right' ? 1 : 0);
            leftOpacity.set(side === 'left' ? 1 : 0);
        } else if (openSwipeId === item.id) {
            setOpenSwipeId(null);
            rightOpacity.set(0);
            leftOpacity.set(0);
        }

        controls.set({ x: target });
    }, [controls, setOpenSwipeId, item.id, openSwipeId, rightOpacity, leftOpacity]);

    const handleDragEnd = useCallback((_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        const vx = info.velocity.x;
        const cx = x.get();

        if (!dragCommitted.current) {
            snapTo(0, null);
            return;
        }

        if (wasOpenSide.current) {
            wasOpenSide.current = null;
            snapTo(0, null);
            return;
        }

        // From closed: flick or position past threshold → open
        if (cx > ACTION_WIDTH_RIGHT * SNAP_RATIO || vx > FLICK_V) {
            snapTo(ACTION_WIDTH_RIGHT, 'right'); return;
        }
        if (cx < -ACTION_WIDTH_LEFT * SNAP_RATIO || vx < -FLICK_V) {
            snapTo(-ACTION_WIDTH_LEFT, 'left'); return;
        }

        snapTo(0, null);
    }, [ACTION_WIDTH_LEFT, ACTION_WIDTH_RIGHT, x, snapTo]);

    const handleComplete = useCallback(() => {
        setIsCompleting(true);
        controls.set({ x: '100%', opacity: 0 });
        completeItem(item.id);
    }, [controls, completeItem, item.id]);

    const handlePin = useCallback(() => {
        togglePin(item.id);
        snapTo(0, null);
    }, [togglePin, item.id, snapTo]);

    const handleDelete = useCallback(() => {
        controls.set({ x: '-100%', opacity: 0 });
        removeItem(item.id);
    }, [controls, removeItem, item.id]);

    return (
        <div className="relative overflow-hidden rounded-2xl bg-surface/50" onClick={(e) => e.stopPropagation()}>
            {/* Complete action (left background — revealed on swipe right) */}
            <motion.div
                style={{ opacity: isCompleting ? 1 : rightOpacity, pointerEvents: activeSide === 'right' || isCompleting ? 'auto' : 'none' }}
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
                style={{ opacity: leftOpacity, pointerEvents: activeSide === 'left' ? 'auto' : 'none' }}
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
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                                    <path d="M12 2c-1.1 0-2 .9-2 2 0 .74.4 1.38 1 1.72V7l-4 4h3v7l2 4 2-4v-7h3l-4-4V5.72c.6-.34 1-.98 1-1.72 0-1.1-.9-2-2-2z" transform="rotate(45 12 12)" />
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
                    if (hasDragged.current) { hasDragged.current = false; return; }
                    if (openSwipeId && openSwipeId !== item.id) { setOpenSwipeId(null); return; }
                    setEditOpen(true);
                }}
                className="glass-card p-4 flex items-center gap-4 relative z-10 cursor-pointer select-none"
            >
                {/* Pin indicator + icon */}
                <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center shrink-0 relative">
                    {item.pinned && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="white" stroke="none">
                                <path d="M12 2c-1.1 0-2 .9-2 2 0 .74.4 1.38 1 1.72V7l-4 4h3v7l2 4 2-4v-7h3l-4-4V5.72c.6-.34 1-.98 1-1.72 0-1.1-.9-2-2-2z" transform="rotate(45 12 12)" />
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
