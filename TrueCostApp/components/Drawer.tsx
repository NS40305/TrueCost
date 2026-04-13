'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useStore } from '@/lib/store';
import { t, LANGUAGES, type Language } from '@/lib/i18n';

export default function Drawer() {
    const pathname = usePathname();
    const {
        drawerOpen, setDrawerOpen,
        darkMode, toggleDarkMode,
        language, setLanguage,
        exportData, importData, resetAll,
        loadDemoData,
    } = useStore();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const T = (key: string) => t(language, key);

    const NAV_ITEMS = [
        {
            label: T('calculator'),
            href: '/',
            icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="4" y="2" width="16" height="20" rx="2" />
                    <line x1="8" y1="6" x2="16" y2="6" />
                    <line x1="8" y1="10" x2="10" y2="10" />
                    <line x1="12" y1="10" x2="14" y2="10" />
                    <line x1="16" y1="10" x2="16" y2="10" />
                    <line x1="8" y1="14" x2="10" y2="14" />
                    <line x1="12" y1="14" x2="14" y2="14" />
                    <line x1="8" y1="18" x2="10" y2="18" />
                    <line x1="12" y1="18" x2="16" y2="18" />
                </svg>
            ),
        },
        {
            label: T('shoppingList'),
            href: '/list',
            icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <path d="M16 10a4 4 0 01-8 0" />
                </svg>
            ),
        },
        {
            label: T('summaryTitle'),
            href: '/summary',
            icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="20" x2="18" y2="10" />
                    <line x1="12" y1="20" x2="12" y2="4" />
                    <line x1="6" y1="20" x2="6" y2="14" />
                </svg>
            ),
        },
        {
            label: T('quickAddSettings'),
            href: '/quick-add',
            icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
            ),
        },
        {
            label: T('incomeSetting'),
            href: '/settings',
            icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="1" x2="12" y2="23" />
                    <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
                </svg>
            ),
        },
    ];

    const handleExport = () => {
        const json = exportData();
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const hh = String(now.getHours()).padStart(2, '0');
        const min = String(now.getMinutes()).padStart(2, '0');
        const ss = String(now.getSeconds()).padStart(2, '0');
        const timestamp = `${yyyy}${mm}${dd}-${hh}${min}${ss}`;
        a.download = `truecost-data-${timestamp}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleImport = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            const ok = importData(reader.result as string);
            if (!ok) alert('Invalid file format.');
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    const handleReset = () => {
        if (confirm(T('resetConfirm'))) {
            resetAll();
        }
    };

    const handleDemo = () => {
        if (confirm(T('demoConfirm'))) {
            resetAll();
            loadDemoData();
            setDrawerOpen(false);
        }
    };

    return (
        <>
            {/* Overlay */}
            <div
                className={`drawer-overlay ${drawerOpen ? 'open' : ''}`}
                onClick={() => setDrawerOpen(false)}
            />

            {/* Panel */}
            <nav className={`drawer-panel ${drawerOpen ? 'open' : ''}`}>
                {/* Header */}
                <div className="flex items-center justify-between px-5 h-12 shrink-0"
                    style={{ borderBottom: '1px solid var(--border-color)' }}
                >
                    <span className="font-semibold text-lg" style={{ letterSpacing: '-0.03em' }}>
                        TrueCost
                    </span>
                    <button
                        onClick={() => setDrawerOpen(false)}
                        className="p-1.5 rounded-lg hover:bg-surface-hover transition-colors"
                        aria-label="Close menu"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                {/* Nav links */}
                <div className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
                    {NAV_ITEMS.map((item) => {
                        const active = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setDrawerOpen(false)}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${active
                                    ? 'bg-accent/10 text-accent'
                                    : 'text-muted hover:bg-surface-hover hover:text-foreground'
                                    }`}
                            >
                                {item.icon}
                                {item.label}
                            </Link>
                        );
                    })}

                    {/* Dark mode toggle */}
                    <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border-color)' }}>
                        <button
                            onClick={toggleDarkMode}
                            className="flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-sm font-medium text-muted hover:bg-surface-hover hover:text-foreground transition-colors"
                        >
                            <span className="flex items-center gap-3">
                                {darkMode ? (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
                                    </svg>
                                ) : (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="5" />
                                        <line x1="12" y1="1" x2="12" y2="3" />
                                        <line x1="12" y1="21" x2="12" y2="23" />
                                        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                                        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                                        <line x1="1" y1="12" x2="3" y2="12" />
                                        <line x1="21" y1="12" x2="23" y2="12" />
                                        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                                        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                                    </svg>
                                )}
                                {T('darkMode')}
                            </span>
                            <div className={`relative w-[42px] h-[25px] rounded-full transition-colors ${darkMode ? 'bg-accent' : 'bg-[#e0e0e0]'}`}>
                                <div className={`absolute top-[2px] w-[21px] h-[21px] rounded-full bg-white shadow-sm transition-transform ${darkMode ? 'translate-x-[19px]' : 'translate-x-[2px]'}`} />
                            </div>
                        </button>
                    </div>

                    {/* Language selector */}
                    <div className="pt-2">
                        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="2" y1="12" x2="22" y2="12" />
                                <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
                            </svg>
                            <select
                                value={language}
                                onChange={(e) => setLanguage(e.target.value as Language)}
                                className="flex-1 px-3 py-2 rounded-lg bg-surface-hover text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-accent/40 transition-all appearance-none cursor-pointer"
                                style={{ border: '1px solid var(--border-color)' }}
                            >
                                {LANGUAGES.map((lang) => (
                                    <option key={lang.code} value={lang.code}>
                                        {lang.flag} {lang.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Bottom actions */}
                <div className="p-3 space-y-2 shrink-0" style={{ borderTop: '1px solid var(--border-color)' }}>
                    <div className="flex gap-2">
                        <button
                            onClick={handleExport}
                            className="flex-1 px-3 py-2 rounded-lg text-xs font-semibold bg-surface-hover hover:bg-accent/10 hover:text-accent transition-colors"
                        >
                            {T('export')}
                        </button>
                        <button
                            onClick={handleImport}
                            className="flex-1 px-3 py-2 rounded-lg text-xs font-semibold bg-surface-hover hover:bg-accent/10 hover:text-accent transition-colors"
                        >
                            {T('import')}
                        </button>
                    </div>
                    <button
                        onClick={handleReset}
                        className="w-full px-3 py-2 rounded-lg text-xs font-semibold text-red-500 bg-red-500/8 hover:bg-red-500/15 transition-colors mt-2"
                    >
                        {T('resetAllData')}
                    </button>
                    <button
                        onClick={handleDemo}
                        className="w-full px-3 py-2 rounded-lg text-xs font-semibold text-amber-600 bg-amber-500/8 hover:bg-amber-500/15 transition-colors mt-2"
                    >
                        {T('demoMode')}
                    </button>
                    <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleFileChange} />
                    <p className="text-center text-[10px] text-muted/40 pt-2">v1.1.0</p>
                </div>
            </nav>
        </>
    );
}
