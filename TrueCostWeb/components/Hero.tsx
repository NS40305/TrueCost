'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useStore, calculateHourlyRate } from '@/lib/store';

export default function Hero() {
    const [priceInput, setPriceInput] = useState<string>('');
    const state = useStore();
    const hourlyRate = calculateHourlyRate(state);

    const price = parseFloat(priceInput) || 0;
    const timeCost = price > 0 ? (price / hourlyRate).toFixed(1) : 0;

    return (
        <section className="min-h-screen w-full flex flex-col items-center justify-center px-6 relative">
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                className="max-w-3xl text-center space-y-12 w-full z-10"
            >
                <div className="space-y-4">
                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight heading-gradient pb-2">
                        Is this worth your time?
                    </h1>
                    <p className="text-xl md:text-2xl text-foreground/60 font-medium">
                        Every purchase costs a piece of your life.
                    </p>
                </div>

                <div className="w-full max-w-md mx-auto space-y-8 glass-card p-8 shadow-2xl shadow-black/5">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold uppercase tracking-wider text-foreground/50">Enter a price</label>
                        <div className="relative flex items-center">
                            <span className="absolute left-4 text-2xl text-foreground/40">$</span>
                            <input
                                type="number"
                                value={priceInput}
                                onChange={(e) => setPriceInput(e.target.value)}
                                placeholder="0.00"
                                className="w-full bg-transparent text-5xl md:text-6xl font-bold text-center outline-none border-b-2 border-transparent focus:border-accent transition-colors py-2 pl-8"
                            />
                        </div>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: price > 0 ? 1 : 0, height: price > 0 ? 'auto' : 0 }}
                        className="overflow-hidden"
                    >
                        <div className="pt-6 border-t border-border mt-6">
                            <p className="text-lg text-foreground/70 mb-1">This costs you</p>
                            <p className="text-4xl font-bold text-accent">
                                {timeCost} <span className="text-2xl font-medium text-foreground/60">hours</span>
                            </p>
                            <p className="text-sm text-foreground/40 mt-2">of your life working.</p>
                        </div>
                    </motion.div>
                </div>
            </motion.div>

            {/* Subtle background abstract shape */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/10 rounded-full blur-[120px] -z-10 pointer-events-none" />
        </section>
    );
}
