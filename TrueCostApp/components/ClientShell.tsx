'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useStore } from '@/lib/store';
import TopBar from './TopBar';
import Drawer from './Drawer';
import BottomNav from './BottomNav';
import InstallPrompt from './InstallPrompt';

export default function ClientShell({ children }: { children: ReactNode }) {
    const darkMode = useStore((s) => s.darkMode);
    const language = useStore((s) => s.language);
    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
        setHydrated(true);
    }, []);

    // Prevent iOS Safari swipe-back / swipe-forward navigation
    useEffect(() => {
        const EDGE_ZONE = 20; // px from screen edge

        const handleTouchStart = (e: TouchEvent) => {
            const x = e.touches[0]?.clientX ?? 0;
            const w = window.innerWidth;
            if (x < EDGE_ZONE || x > w - EDGE_ZONE) {
                e.preventDefault();
            }
        };

        document.addEventListener('touchstart', handleTouchStart, { passive: false });
        return () => document.removeEventListener('touchstart', handleTouchStart);
    }, []);

    useEffect(() => {
        if (hydrated) {
            document.documentElement.classList.toggle('dark', darkMode);
            const color = darkMode ? '#000000' : '#f5f5f7';
            document
                .querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')
                .forEach((m) => {
                    m.removeAttribute('media');
                    m.content = color;
                });
        }
    }, [darkMode, hydrated]);

    useEffect(() => {
        if (hydrated) {
            document.documentElement.lang = language;
        }
    }, [language, hydrated]);

    return (
        <>
            <TopBar />
            {hydrated && <Drawer />}
            <InstallPrompt />
            <main className="min-h-screen pt-12">
                {hydrated ? children : (
                    <div className="flex items-center justify-center min-h-[50vh]">
                        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                    </div>
                )}
            </main>
            {hydrated && <BottomNav />}
        </>
    );
}
