'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useStore } from '@/lib/store';
import { t } from '@/lib/i18n';

const NAV_ITEMS = [
    {
        key: 'calculator',
        href: '/',
        icon: (active: boolean) => (
            <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 1.5 : 1.5} strokeLinecap="round" strokeLinejoin="round">
                <rect x="4" y="2" width="16" height="20" rx="2" />
                <line x1="8" y1="6" x2="16" y2="6" stroke={active ? 'var(--accent)' : 'currentColor'} />
                <line x1="8" y1="10" x2="10" y2="10" stroke={active ? 'var(--accent)' : 'currentColor'} />
                <line x1="14" y1="10" x2="16" y2="10" stroke={active ? 'var(--accent)' : 'currentColor'} />
                <line x1="8" y1="14" x2="10" y2="14" stroke={active ? 'var(--accent)' : 'currentColor'} />
                <line x1="14" y1="14" x2="16" y2="14" stroke={active ? 'var(--accent)' : 'currentColor'} />
                <line x1="8" y1="18" x2="16" y2="18" stroke={active ? 'var(--accent)' : 'currentColor'} />
            </svg>
        ),
    },
    {
        key: 'shoppingList',
        navLabel: 'List',
        href: '/list',
        icon: (active: boolean) => (
            <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" stroke={active ? 'var(--accent)' : 'currentColor'} />
                <path d="M16 10a4 4 0 01-8 0" stroke={active ? 'var(--accent)' : 'currentColor'} fill="none" />
            </svg>
        ),
    },
    {
        key: 'summaryTitle',
        href: '/summary',
        icon: (active: boolean) => (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
        ),
    },
    {
        key: 'quickAddSettings',
        shortKey: 'quickAdd',
        href: '/quick-add',
        icon: (active: boolean) => (
            <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
        ),
    },
    {
        key: 'incomeSetting',
        shortKey: 'currency',
        href: '/settings',
        icon: (active: boolean) => (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
            </svg>
        ),
    },
];

export default function BottomNav() {
    const pathname = usePathname();
    const language = useStore((s) => s.language);
    const T = (key: string) => t(language, key);

    return (
        <nav className="bottom-nav" aria-label="Main navigation">
            <div className="bottom-nav-inner">
                {NAV_ITEMS.map((item) => {
                    const active = pathname === item.href;
                    const label = item.navLabel || T(item.shortKey || item.key);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`bottom-nav-item ${active ? 'active' : ''}`}
                        >
                            <div className={`bottom-nav-icon ${active ? 'active' : ''}`}>
                                {item.icon(active)}
                            </div>
                            <span className="bottom-nav-label">{label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
