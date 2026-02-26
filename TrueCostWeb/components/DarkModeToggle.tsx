'use client';

import { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';

export default function DarkModeToggle() {
    const [dark, setDark] = useState(true);

    useEffect(() => {
        // Check localStorage or system preference on mount
        const stored = localStorage.getItem('theme');
        if (stored === 'light') {
            setDark(false);
            document.documentElement.classList.remove('dark');
        } else {
            setDark(true);
            document.documentElement.classList.add('dark');
        }
    }, []);

    const toggle = () => {
        const next = !dark;
        setDark(next);
        if (next) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    };

    return (
        <button
            onClick={toggle}
            aria-label="Toggle dark mode"
            className="fixed bottom-6 right-6 z-50 p-3 rounded-full
        bg-foreground/10 border border-border-color
        backdrop-blur-md shadow-lg
        hover:bg-foreground/20 hover:scale-110
        active:scale-95
        transition-all duration-300 cursor-pointer"
        >
            {dark ? (
                <Sun className="w-5 h-5 text-amber-400" />
            ) : (
                <Moon className="w-5 h-5 text-indigo-600" />
            )}
        </button>
    );
}
