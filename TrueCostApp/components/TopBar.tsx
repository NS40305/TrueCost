'use client';

import { useStore } from '@/lib/store';

export default function TopBar() {
    const setDrawerOpen = useStore((s) => s.setDrawerOpen);
    const darkMode = useStore((s) => s.darkMode);

    return (
        <header className="fixed top-0 left-0 right-0 w-full z-40 flex items-center justify-between px-4 h-12"
            style={{
                background: darkMode ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.72)',
                backdropFilter: 'saturate(180%) blur(20px)',
                WebkitBackdropFilter: 'saturate(180%) blur(20px)',
                borderBottom: '1px solid var(--border-color)',
            }}
        >
            {/* Hamburger */}
            <button
                onClick={() => setDrawerOpen(true)}
                aria-label="Open menu"
                className="p-2 -ml-2 rounded-xl hover:bg-surface-hover/50 transition-colors"
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
            </button>

            {/* Title */}
            <h1 className="text-lg font-semibold tracking-tight" style={{ letterSpacing: '-0.03em' }}>
                TrueCost
            </h1>

            {/* Spacer to keep title centered */}
            <div className="w-8 h-8" />
        </header>
    );
}
