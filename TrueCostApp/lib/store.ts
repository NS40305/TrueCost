'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
    IncomeType,
    Category,
    CurrencyCode,
    DEFAULT_HOURS_PER_DAY,
    DEFAULT_DAYS_PER_MONTH,
    CATEGORIES
} from './constants';
import type { Language } from './i18n';

/* ── Types ─────────────────────────── */

export interface ShoppingItem {
    id: string;
    name: string;
    category: Category;
    price: number;
    url?: string;
    addedAt: number; // timestamp
    pinned?: boolean;
    completed?: boolean;
    completedAt?: number;
}

export interface SettingsState {
    incomeType: IncomeType;
    rate: number;
    currency: CurrencyCode;
    hoursPerDay: number;
    daysPerMonth: number;
}

export interface AppState {
    /* settings */
    settings: SettingsState;
    setIncomeType: (t: IncomeType) => void;
    setRate: (r: number) => void;
    setCurrency: (c: CurrencyCode) => void;
    setHoursPerDay: (h: number) => void;
    setDaysPerMonth: (d: number) => void;

    /* shopping list */
    items: ShoppingItem[];
    addItem: (item: Omit<ShoppingItem, 'id' | 'addedAt'>) => void;
    removeItem: (id: string) => void;
    togglePin: (id: string) => void;
    completeItem: (id: string, dateMs?: number) => void;
    uncompleteItem: (id: string) => void;
    clearItems: () => void;

    /* ui */
    darkMode: boolean;
    toggleDarkMode: () => void;
    drawerOpen: boolean;
    setDrawerOpen: (open: boolean) => void;
    language: Language;
    setLanguage: (l: Language) => void;

    /* data management */
    exportData: () => string;
    importData: (json: string) => boolean;
    resetAll: () => void;
    loadDemoData: () => void;
}

/* ── Defaults ──────────────────────── */

const defaultSettings: SettingsState = {
    incomeType: 'hourly',
    rate: 25,
    currency: 'CAD',
    hoursPerDay: DEFAULT_HOURS_PER_DAY,
    daysPerMonth: DEFAULT_DAYS_PER_MONTH,
};

/* ── Store ─────────────────────────── */

export const useStore = create<AppState>()(
    persist(
        (set, get) => ({
            settings: { ...defaultSettings },
            setIncomeType: (t) =>
                set((s) => ({ settings: { ...s.settings, incomeType: t } })),
            setRate: (r) =>
                set((s) => ({ settings: { ...s.settings, rate: r } })),
            setCurrency: (c) =>
                set((s) => ({ settings: { ...s.settings, currency: c } })),
            setHoursPerDay: (h) =>
                set((s) => ({ settings: { ...s.settings, hoursPerDay: h } })),
            setDaysPerMonth: (d) =>
                set((s) => ({ settings: { ...s.settings, daysPerMonth: d } })),

            items: [],
            addItem: (item) =>
                set((s) => ({
                    items: [
                        ...s.items,
                        { ...item, id: crypto.randomUUID(), addedAt: Date.now() },
                    ],
                })),
            removeItem: (id) =>
                set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
            togglePin: (id) =>
                set((s) => ({
                    items: s.items.map((i) =>
                        i.id === id ? { ...i, pinned: !i.pinned } : i
                    ),
                })),
            completeItem: (id, dateMs) =>
                set((s) => ({
                    items: s.items.map((i) =>
                        i.id === id
                            ? {
                                ...i,
                                completed: true,
                                completedAt: dateMs ?? Date.now(),
                            }
                            : i
                    ),
                })),
            uncompleteItem: (id) =>
                set((s) => ({
                    items: s.items.map((i) =>
                        i.id === id
                            ? { ...i, completed: false, completedAt: undefined }
                            : i
                    ),
                })),
            clearItems: () => set({ items: [] }),

            darkMode: true,
            toggleDarkMode: () => set((s) => ({ darkMode: !s.darkMode })),
            drawerOpen: false,
            setDrawerOpen: (open) => set({ drawerOpen: open }),
            language: 'en' as Language,
            setLanguage: (l) => set({ language: l }),

            exportData: () => {
                const { settings, items, darkMode, language } = get();
                return JSON.stringify({ settings, items, darkMode, language }, null, 2);
            },
            importData: (json: string) => {
                try {
                    const data = JSON.parse(json);
                    if (data.settings && Array.isArray(data.items)) {
                        set({
                            settings: data.settings,
                            items: data.items,
                            ...(data.darkMode !== undefined && { darkMode: data.darkMode }),
                            ...(data.language !== undefined && { language: data.language })
                        });
                        return true;
                    }
                    return false;
                } catch {
                    return false;
                }
            },
            resetAll: () =>
                set({
                    settings: { ...defaultSettings },
                    items: [],
                }),
            loadDemoData: () => {
                const demoItems: ShoppingItem[] = [];
                const now = Date.now();
                const msPerDay = 24 * 60 * 60 * 1000;

                const DEMO_ITEMS = [
                    { name: 'Coffee', category: 'Food & Drink', min: 3, max: 8 },
                    { name: 'Dinner out', category: 'Food & Drink', min: 25, max: 150 },
                    { name: 'Groceries', category: 'Food & Drink', min: 40, max: 200 },
                    { name: 'Headphones', category: 'Electronics', min: 50, max: 350 },
                    { name: 'Phone Bill', category: 'Electronics', min: 40, max: 120 },
                    { name: 'New Laptop', category: 'Electronics', min: 800, max: 2500 },
                    { name: 'New Shoes', category: 'Clothing', min: 60, max: 200 },
                    { name: 'Winter Jacket', category: 'Clothing', min: 80, max: 300 },
                    { name: 'Movie Ticket', category: 'Entertainment', min: 12, max: 25 },
                    { name: 'Concert Ticket', category: 'Entertainment', min: 50, max: 250 },
                    { name: 'Software Sub', category: 'Entertainment', min: 10, max: 30 },
                    { name: 'Gas', category: 'Transport', min: 30, max: 80 },
                    { name: 'Train Ticket', category: 'Transport', min: 15, max: 120 },
                    { name: 'Furniture', category: 'Housing', min: 100, max: 800 },
                    { name: 'Rent', category: 'Housing', min: 1000, max: 3000 },
                    { name: 'Gym Membership', category: 'Health', min: 20, max: 100 },
                    { name: 'Pharmacy', category: 'Health', min: 15, max: 60 },
                    { name: 'Book', category: 'Education', min: 10, max: 40 },
                    { name: 'Online Course', category: 'Education', min: 20, max: 200 },
                    { name: 'Gift for friend', category: 'Other', min: 20, max: 100 }
                ] as const;

                const getRandomDemoItem = () => DEMO_ITEMS[Math.floor(Math.random() * DEMO_ITEMS.length)];

                // 100 Completed Items spanning up to 365 days ago
                for (let i = 0; i < 100; i++) {
                    const daysAgo = Math.floor(Math.random() * 365);
                    const ts = now - (daysAgo * msPerDay);
                    const baseItem = getRandomDemoItem();
                    demoItems.push({
                        id: crypto.randomUUID(),
                        name: baseItem.name,
                        category: baseItem.category,
                        price: Math.floor(Math.random() * (baseItem.max - baseItem.min + 1)) + baseItem.min,
                        addedAt: ts - (Math.random() * msPerDay * 5), // Added sometime before completion
                        completed: true,
                        completedAt: ts
                    });
                }

                // 30 Active Items spanning up to last 30 days
                for (let i = 0; i < 30; i++) {
                    const daysAgo = Math.floor(Math.random() * 30);
                    const ts = now - (daysAgo * msPerDay);
                    const baseItem = getRandomDemoItem();
                    demoItems.push({
                        id: crypto.randomUUID(),
                        name: baseItem.name,
                        category: baseItem.category,
                        price: Math.floor(Math.random() * (baseItem.max - baseItem.min + 1)) + baseItem.min,
                        addedAt: ts,
                        pinned: Math.random() > 0.8 // 20% chance to be pinned
                    });
                }

                set({ items: demoItems });
            },
        }),
        {
            name: 'truecost-storage',
            partialize: (state) => ({
                settings: state.settings,
                items: state.items,
                darkMode: state.darkMode,
                language: state.language,
            }),
        }
    )
);
