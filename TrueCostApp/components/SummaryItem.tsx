'use client';

import { useState, memo, useCallback, useRef } from 'react';
import { ShoppingItem, useStore } from '@/lib/store';
import { getTimeNeeded, formatHours } from '@/lib/calculations';
import { CURRENCIES } from '@/lib/constants';
import { t } from '@/lib/i18n';
import { motion, useAnimation, PanInfo, useMotionValue, useTransform } from 'framer-motion';
import EditItemModal from './EditItemModal';
import CategoryIcon from './CategoryIcon';

interface SummaryItemProps {
    item: ShoppingItem;
    dateLabel: string;
}

/* iOS Mail-style spring config */
const SPRING_OPEN  = { type: 'spring' as const, stiffness: 300, damping: 30 };
const SPRING_CLOSE = { type: 'spring' as const, stiffness: 400, damping: 35 };
const SPRING_SNAP  = { type: 'spring' as const, stiffness: 500, damping: 40 };

/* Thresholds inspired by react-swipeable-list iOS mode */
const SWIPE_START_THRESHOLD = 10;
const SCROLL_START_THRESHOLD = 10;

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
    const ACTION_WIDTH_LEFT = 100;   // delete (swipe left)
    const ACTION_WIDTH_RIGHT = 100;  // regret/undo (swipe right)

    // Derive opacity from x motion value — no state, no re-renders
    const rightOpacity = useTransform(x, [0, SWIPE_START_THRESHOLD], [0, 1]);
    const leftOpacity  = useTransform(x, [0, -SWIPE_START_THRESHOLD], [0, 1]);

    const handleDragStart = useCallback(() => {
        hasDragged.current = true;
        dragCommitted.current = false;
    }, []);

    const handleDrag = useCallback((_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        // Angle-based direction lock (from react-swipeable-list octant approach)
        if (!dragCommitted.current) {
            const absX = Math.abs(info.offset.x);
            const absY = Math.abs(info.offset.y);

            if (absY > SCROLL_START_THRESHOLD && absX < SWIPE_START_THRESHOLD) {
                return;
            }

            if (absX >= SWIPE_START_THRESHOLD) {
                dragCommitted.current = true;
            }
        }
    }, []);

    const handleDragEnd = useCallback(async (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        const offset = info.offset.x;
        const velocity = info.velocity.x;
        const currentX = x.get();

        // If drag never committed (too short or mostly vertical), snap back
        if (!dragCommitted.current) {
            controls.start({ x: 0, transition: SPRING_SNAP });
            return;
        }

        // If card is already open, close on any reverse gesture
        if (openState.current === 'right' && (offset < -10 || currentX < ACTION_WIDTH_RIGHT * 0.5)) {
            openState.current = null;
            controls.start({ x: 0, transition: SPRING_CLOSE });
            return;
        }
        if (openState.current === 'left' && (offset > 10 || currentX > -ACTION_WIDTH_LEFT * 0.5)) {
            openState.current = null;
            controls.start({ x: 0, transition: SPRING_CLOSE });
            return;
        }

        // Swipe right → reveal Regret/Undo button
        if (offset > ACTION_WIDTH_RIGHT * 0.35 || velocity > 300) {
            openState.current = 'right';
            controls.start({ x: ACTION_WIDTH_RIGHT, transition: SPRING_OPEN });
        }
        // Swipe left → reveal Delete button
        else if (offset < -ACTION_WIDTH_LEFT * 0.35 || velocity < -300) {
            openState.current = 'left';
            controls.start({ x: -ACTION_WIDTH_LEFT, transition: SPRING_OPEN });
        } else {
            // Snap back
            openState.current = null;
            controls.start({ x: 0, transition: SPRING_SNAP });
        }
    }, [controls, ACTION_WIDTH_LEFT, ACTION_WIDTH_RIGHT, x]);

    const handleRegret = useCallback(async () => {
        await controls.start({ x: 0, transition: SPRING_CLOSE });
        openState.current = null;
        regretItem(item.id);
    }, [controls, regretItem, item.id]);

    const handleDelete = useCallback(async () => {
        await controls.start({ x: '-100%', opacity: 0, transition: { type: 'spring', stiffness: 200, damping: 25 } });
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
                dragElastic={0.15}
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
