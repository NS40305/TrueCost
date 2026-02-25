'use client';

import { motion } from 'framer-motion';

export default function Reframe() {
    return (
        <section className="min-h-[70vh] w-full flex flex-col items-center justify-center px-6 relative overflow-hidden bg-foreground text-background">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: "-20%" }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                className="max-w-4xl mx-auto text-center space-y-6 z-10"
            >
                <h2 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight">
                    You don't buy things with money.
                    <br />
                    <span className="text-accent">You buy them with time.</span>
                </h2>
                <p className="text-xl text-background/70 max-w-2xl mx-auto font-light">
                    Every dollar spent is a fraction of the hours you worked to earn it. By shifting your perspective, you regain control over what truly matters.
                </p>
            </motion.div>

            {/* Glowing orb effect */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] max-w-[800px] max-h-[800px] rounded-full bg-accent/20 blur-[140px] pointer-events-none" />
        </section>
    );
}
