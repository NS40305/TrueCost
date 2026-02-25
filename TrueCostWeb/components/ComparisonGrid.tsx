'use client';

import { useEffect } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { useStore, calculateHourlyRate } from '@/lib/store';

const TICKET_ITEMS = [
    { name: 'Artisan Coffee', price: 6, icon: '☕' },
    { name: 'Monthly Streaming', price: 15, icon: '🎬' },
    { name: 'New Sneakers', price: 120, icon: '👟' },
    { name: 'Flagship Phone', price: 1199, icon: '📱' },
    { name: 'Weekend Trip', price: 650, icon: '✈️' }
];

function AnimatedNumber({ value }: { value: number }) {
    const safeValue = Number.isFinite(value) && !Number.isNaN(value) ? value : 0;
    const springValue = useSpring(0, { stiffness: 60, damping: 15 });

    const formatted = useTransform(springValue, (latest) => {
        const num = Number(latest);
        return Number.isFinite(num) && !Number.isNaN(num) ? num.toFixed(1) : "0.0";
    });

    useEffect(() => {
        springValue.set(safeValue);
    }, [safeValue, springValue]);

    return <motion.span>{formatted}</motion.span>;
}

export default function ComparisonGrid() {
    const state = useStore();
    const hourlyRate = calculateHourlyRate(state);

    return (
        <section className="min-h-screen w-full flex flex-col items-center justify-center py-24 px-6 relative">
            <div className="w-full max-w-5xl mx-auto space-y-16">
                <div className="text-center space-y-4">
                    <h2 className="text-4xl md:text-5xl font-bold heading-gradient">
                        The Relativity of Cost
                    </h2>
                    <p className="text-xl text-foreground/60 max-w-2xl mx-auto">
                        See how your income shifts the true weight of everyday purchases.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {TICKET_ITEMS.map((item, index) => {
                        const rawHours = item.price / hourlyRate;
                        const hours = Number.isFinite(rawHours) && !Number.isNaN(rawHours) ? rawHours : 0;

                        return (
                            <motion.div
                                key={item.name}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-10%" }}
                                transition={{ duration: 0.6, delay: index * 0.1 }}
                                className="glass-card p-8 flex flex-col justify-between items-start space-y-8 min-h-[220px]"
                            >
                                <div className="space-y-1">
                                    <span className="text-3xl mb-2 block">{item.icon}</span>
                                    <h3 className="text-xl font-semibold text-foreground">{item.name}</h3>
                                    <p className="text-sm text-foreground/50">${item.price}</p>
                                </div>

                                <div className="border-t border-border pt-4 w-full">
                                    <p className="text-sm font-medium text-foreground/50 uppercase tracking-widest mb-1">True Cost</p>
                                    <p className="text-4xl font-bold text-accent flex items-baseline gap-2">
                                        <AnimatedNumber value={hours} />
                                        <span className="text-lg font-medium text-foreground/60">hrs</span>
                                    </p>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            <div className="absolute bottom-0 w-full h-px bg-gradient-to-r from-transparent via-border to-transparent opacity-50" />
        </section>
    );
}
