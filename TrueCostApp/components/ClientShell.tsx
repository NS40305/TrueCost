'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useStore } from '@/lib/store';
import TopBar from './TopBar';
import Drawer from './Drawer';
import InstallPrompt from './InstallPrompt';

export default function ClientShell({ children }: { children: ReactNode }) {
    const darkMode = useStore((s) => s.darkMode);
    const [hydrated, setHydrated] = useState(false);

    // Wait for Zustand to rehydrate from localStorage before rendering
    useEffect(() => {
        // Zustand persist onFinishHydration fires synchronously after rehydrate
        setHydrated(true);
    }, []);

    useEffect(() => {
        if (hydrated) {
            document.documentElement.classList.toggle('dark', darkMode);
        }
    }, [darkMode, hydrated]);

    // On SSR/first paint, apply dark class directly via script in layout.tsx.
    // Render children immediately but suppress store-dependent conditional UI
    // until after hydration to avoid mismatch.
    return (
        <>
            <TopBar />
            {hydrated && <Drawer />}
            <InstallPrompt />
            <main className="min-h-screen pt-14">
                {hydrated ? children : (
                    <div className="flex items-center justify-center min-h-[50vh]">
                        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                    </div>
                )}
            </main>
        </>
    );
}
