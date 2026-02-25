'use client';

import { useEffect, useRef } from 'react';
import { useMotionValue, useSpring, useTransform, animate, motion } from 'framer-motion';

interface NumberTickerProps {
    value: number | string;
    className?: string;
    animationDuration?: number;
}

export default function NumberTicker({
    value,
    className = "",
    animationDuration = 0.5,
}: NumberTickerProps) {
    const rawValue = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : value;
    const isError = isNaN(rawValue);

    // Initial value is empty or 0; we'll animate to the target value
    const motionValue = useMotionValue(0);
    const springValue = useSpring(motionValue, {
        damping: 30,
        stiffness: 150,
        mass: 1,
    });
    const hasMounted = useRef(false);

    useEffect(() => {
        if (!hasMounted.current) {
            motionValue.set(rawValue || 0);
            hasMounted.current = true;
            return;
        }

        // Animate rawValue changes directly
        animate(motionValue, rawValue || 0, {
            duration: animationDuration,
            ease: "easeOut",
        });
    }, [rawValue, motionValue, animationDuration]);

    // Format output exactly matching our existing formats
    // formatHours/formatDays/formatYears in calculations.ts uses:
    // val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    const displayValue = useTransform(springValue, (current) => {
        if (isError) return String(value);
        return current.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    });

    return (
        <motion.span className={className}>
            {displayValue as any}
        </motion.span>
    );
}
