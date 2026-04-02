'use client';

import { useStore } from '@/lib/store';

export default function TopBar() {
    const setDrawerOpen = useStore((s) => s.setDrawerOpen);

    return (
        <header className="fixed top-0 left-0 right-0 w-full z-40 flex items-center justify-between px-4 h-14 bg-surface/90 backdrop-blur-lg border-b border-border">
            {/* Hamburger */}
            <button
                onClick={() => setDrawerOpen(true)}
                aria-label="Open menu"
                className="topbar-hamburger p-2 -ml-2 rounded-xl hover:bg-surface-hover transition-colors"
            >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
            </button>

            {/* Title */}
            <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-accent to-purple-400 bg-clip-text text-transparent">
                TrueCost
            </h1>

            {/* Avatar */}
            <button className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent hover:bg-accent/30 transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="8" r="4" />
                    <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
                </svg>
            </button>
        </header>
    );
}
