'use client';

import { useRef, useEffect, useCallback } from 'react';
import { useStore } from '@/lib/store';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

export default function TopBar() {
    const drawerOpen = useStore((s) => s.drawerOpen);
    const setDrawerOpen = useStore((s) => s.setDrawerOpen);
    const darkMode = useStore((s) => s.darkMode);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dotLottieRef = useRef<any>(null);
    const prevOpen = useRef(false);
    const ready = useRef(false);

    const dotLottieRefCallback = useCallback((dotLottie: unknown) => {
        dotLottieRef.current = dotLottie;
        if (dotLottie) {
            (dotLottie as { addEventListener: (e: string, cb: () => void) => void })
                .addEventListener('load', () => { ready.current = true; });
        }
    }, []);

    useEffect(() => {
        const lottie = dotLottieRef.current;
        if (!lottie || !ready.current) return;

        if (drawerOpen && !prevOpen.current) {
            lottie.setMode('forward');
            lottie.setSegment(0, 45);
            lottie.play();
        } else if (!drawerOpen && prevOpen.current) {
            lottie.setMode('forward');
            lottie.setSegment(45, 90);
            lottie.play();
        }
        prevOpen.current = drawerOpen;
    }, [drawerOpen]);

    return (
        <header className="fixed top-0 left-0 right-0 w-full z-[250] flex items-center justify-between px-4 h-12"
            style={{
                background: darkMode ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.72)',
                backdropFilter: 'saturate(180%) blur(20px)',
                WebkitBackdropFilter: 'saturate(180%) blur(20px)',
                borderBottom: '1px solid var(--border-color)',
            }}
        >
            <button
                onClick={() => setDrawerOpen(!drawerOpen)}
                aria-label={drawerOpen ? 'Close menu' : 'Open menu'}
                className="p-1 -ml-1 rounded-xl hover:bg-surface-hover/50 transition-colors"
            >
                <div style={{
                    width: 28,
                    height: 28,
                    pointerEvents: 'none',
                    filter: darkMode ? 'brightness(0) invert(1)' : 'brightness(0)',
                }}>
                    <DotLottieReact
                        src="/hamburger-menu.json"
                        autoplay={false}
                        loop={false}
                        dotLottieRefCallback={dotLottieRefCallback}
                        style={{ width: 28, height: 28 }}
                    />
                </div>
            </button>

            <h1 className="absolute left-0 right-0 text-center text-lg font-semibold tracking-tight pointer-events-none" style={{ letterSpacing: '-0.03em' }}>
                TrueCost
            </h1>
        </header>
    );
}
