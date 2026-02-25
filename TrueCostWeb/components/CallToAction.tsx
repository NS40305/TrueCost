'use client';

import { motion } from 'framer-motion';
import { Calculator, ShoppingBag, Download } from 'lucide-react';
import Image from 'next/image';

export default function CallToAction() {
    return (
        <section className="min-h-screen w-full flex flex-col items-center justify-center py-24 px-6 relative overflow-hidden">
            <div className="w-full max-w-6xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-16 z-10">

                {/* Left Content */}
                <motion.div
                    initial={{ opacity: 0, x: -40 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-10%" }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="flex-1 space-y-10 text-center lg:text-left"
                >
                    <div className="space-y-6">
                        <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1]">
                            Make conscious<br /> decisions.
                        </h2>
                        <p className="text-xl text-foreground/60 max-w-lg mx-auto lg:mx-0">
                            Stop measuring your purchases by the price tag. Start measuring them by your life. Use TrueCost to actively track and evaluate your spending.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                        <a
                            href="https://turecostapp.vercel.app/"
                            target="_blank"
                            className="group flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-4 bg-foreground text-background font-semibold rounded-2xl hover:scale-105 transition-all shadow-xl"
                        >
                            <Calculator className="w-5 h-5" />
                            <span>Open Calculator</span>
                        </a>

                        <a
                            href="https://turecostapp.vercel.app/list"
                            target="_blank"
                            className="group flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-4 bg-surface/80 border border-border text-foreground font-semibold rounded-2xl hover:bg-surface hover:scale-105 transition-all backdrop-blur-md"
                        >
                            <ShoppingBag className="w-5 h-5" />
                            <span>Shopping List</span>
                        </a>
                    </div>

                    <div className="pt-8 border-t border-border mt-8 w-3/4 mx-auto lg:mx-0 lg:w-full flex-col lg:flex-row flex items-center justify-center lg:justify-start gap-4">
                        <p className="text-sm font-medium text-foreground/50">Experience the App natively</p>
                        <button className="flex items-center gap-2 text-accent hover:text-accent/80 font-medium px-4 py-2 rounded-xl bg-accent/10 transition-colors">
                            <Download className="w-4 h-4" />
                            Install TrueCost PWA
                        </button>
                    </div>
                </motion.div>

                {/* Right Mockup (for screenshot integration) */}
                <motion.div
                    initial={{ opacity: 0, y: 40, rotate: -5 }}
                    whileInView={{ opacity: 1, y: 0, rotate: -2 }}
                    viewport={{ once: true, margin: "-10%" }}
                    transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                    className="flex-1 w-full max-w-sm relative group perspective-[1000px]"
                >
                    <div className="relative w-full aspect-[9/19] rounded-[3rem] border-[8px] border-foreground bg-background shadow-2xl overflow-hidden transition-transform duration-700 ease-out group-hover:rotate-0 group-hover:scale-105">
                        {/* Status bar mockup */}
                        <div className="absolute top-0 w-full h-7 bg-transparent z-20 flex justify-center">
                            <div className="w-[120px] h-[24px] bg-foreground rounded-b-3xl"></div>
                        </div>

                        {/* Mockup Screenshot */}
                        <div className="absolute inset-0 bg-surface">
                            <Image
                                src="/mockup.png"
                                alt="TrueCost App Preview"
                                fill
                                className="object-cover"
                                priority
                            />
                        </div>
                    </div>

                    {/* Glowing shadow behind the phone */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-accent/30 blur-[80px] -z-10 rounded-full mix-blend-screen opacity-50 group-hover:opacity-80 transition-opacity duration-700 pointer-events-none" />
                </motion.div>

            </div>
        </section>
    );
}
