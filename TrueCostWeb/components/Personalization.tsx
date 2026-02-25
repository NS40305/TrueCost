'use client';

import { motion } from 'framer-motion';
import { useStore } from '@/lib/store';

export default function Personalization() {
    const { income, incomeType, setIncome, setIncomeType } = useStore();

    const tabs = [
        { id: 'hourly', label: 'Hourly' },
        { id: 'daily', label: 'Daily' },
        { id: 'monthly', label: 'Monthly' }
    ] as const;

    return (
        <section className="min-h-[80vh] w-full flex flex-col items-center justify-center py-24 px-6 relative">
            <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-10%" }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="w-full max-w-3xl glass-card p-10 md:p-16 flex flex-col items-center text-center space-y-10"
            >
                <h3 className="text-3xl md:text-4xl font-bold heading-gradient">
                    Make it personal
                </h3>
                <p className="text-lg text-foreground/60 max-w-md">
                    Tell us what your time is worth to see the real cost of everyday items.
                </p>

                <div className="w-full max-w-sm space-y-8">
                    {/* Segmented Control */}
                    <div className="flex p-1 bg-foreground/5 rounded-xl border border-border">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setIncomeType(tab.id)}
                                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all relative ${incomeType === tab.id ? 'text-background shadow-md' : 'text-foreground/60 hover:text-foreground'
                                    }`}
                            >
                                {incomeType === tab.id && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute inset-0 bg-foreground rounded-lg"
                                        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                                <span className="relative z-10">{tab.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Income Input */}
                    <div className="space-y-3">
                        <label className="text-sm font-semibold uppercase tracking-wider text-foreground/50">
                            Your {incomeType} income
                        </label>
                        <div className="relative flex items-center justify-center">
                            <span className="absolute left-8 text-2xl text-foreground/40">$</span>
                            <input
                                type="number"
                                value={income || ''}
                                onChange={(e) => setIncome(Number(e.target.value))}
                                placeholder="0.00"
                                className="w-full bg-surface/50 rounded-2xl text-4xl md:text-5xl font-bold text-center outline-none border border-border focus:border-accent transition-colors py-4 px-12"
                            />
                        </div>
                    </div>
                </div>

                {/* Real-time feedback */}
                <div className="pt-4">
                    <p className="text-sm font-medium text-foreground/50 bg-foreground/5 px-4 py-2 rounded-full border border-border">
                        The numbers below will automatically update.
                    </p>
                </div>
            </motion.div>
        </section>
    );
}
