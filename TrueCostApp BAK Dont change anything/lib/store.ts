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
    location?: 'list' | 'summary'; // New property to track explicit location
    regretted?: boolean;
    regrettedAt?: number;
}

export type SubscriptionCycle = 'weekly' | 'monthly' | 'yearly';

export interface SubscriptionItem {
    id: string;
    name: string;
    category: Category;
    price: number;
    cycle: SubscriptionCycle;
    startDate: number; // timestamp
    enabled: boolean;
}

export interface QuickAddPreset {
    id: string;
    name: string;
    price: number;
    category: Category;
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
    updateItem: (id: string, updates: Partial<Pick<ShoppingItem, 'name' | 'price' | 'category' | 'completedAt'>>) => void;
    removeItem: (id: string) => void;
    togglePin: (id: string) => void;
    completeItem: (id: string, dateMs?: number) => void;
    uncompleteItem: (id: string) => void;
    regretItem: (id: string) => void;
    clearItems: () => void;

    /* subscriptions */
    subscriptions: SubscriptionItem[];
    addSubscription: (item: Omit<SubscriptionItem, 'id'>) => void;
    updateSubscription: (id: string, updates: Partial<Omit<SubscriptionItem, 'id'>>) => void;
    removeSubscription: (id: string) => void;
    toggleSubscription: (id: string) => void;

    /* quick add presets */
    quickAddItems: QuickAddPreset[];
    addQuickAddItem: (item: Omit<QuickAddPreset, 'id'>) => void;
    updateQuickAddItem: (id: string, updates: Partial<Omit<QuickAddPreset, 'id'>>) => void;
    removeQuickAddItem: (id: string) => void;
    reorderQuickAddItems: (items: QuickAddPreset[]) => void;

    /* ui */
    darkMode: boolean;
    toggleDarkMode: () => void;
    deepGreyMode: boolean;
    toggleDeepGreyMode: () => void;
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

import { QUICK_ADD_PRESETS } from './constants';

const defaultQuickAddItems: QuickAddPreset[] = QUICK_ADD_PRESETS.map((p) => ({
    id: crypto.randomUUID(),
    name: p.name,
    price: p.price,
    category: p.category,
}));

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
            subscriptions: [],
            quickAddItems: [...defaultQuickAddItems],
            addItem: (item) =>
                set((s) => ({
                    items: [
                        ...s.items,
                        { ...item, id: crypto.randomUUID(), addedAt: Date.now(), location: 'list' },
                    ],
                })),
            updateItem: (id, updates) =>
                set((s) => ({
                    items: s.items.map((i) =>
                        i.id === id ? { ...i, ...updates } : i
                    ),
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
                                location: 'summary',
                            }
                            : i
                    ),
                })),
            uncompleteItem: (id) =>
                set((s) => ({
                    items: s.items.map((i) =>
                        i.id === id
                            ? { ...i, completed: false, completedAt: undefined, location: 'list' }
                            : i
                    ),
                })),
            regretItem: (id) =>
                set((s) => ({
                    items: s.items.map((i) =>
                        i.id === id
                            ? { ...i, regretted: !i.regretted, regrettedAt: i.regretted ? undefined : Date.now() }
                            : i
                    ),
                })),
            clearItems: () => set({ items: [] }),

            addSubscription: (item) =>
                set((s) => ({
                    subscriptions: [
                        ...s.subscriptions,
                        { ...item, id: crypto.randomUUID() },
                    ],
                })),
            updateSubscription: (id, updates) =>
                set((s) => ({
                    subscriptions: s.subscriptions.map((i) =>
                        i.id === id ? { ...i, ...updates } : i
                    ),
                })),
            removeSubscription: (id) =>
                set((s) => ({
                    subscriptions: s.subscriptions.filter((i) => i.id !== id),
                })),
            toggleSubscription: (id) =>
                set((s) => ({
                    subscriptions: s.subscriptions.map((i) =>
                        i.id === id ? { ...i, enabled: !i.enabled } : i
                    ),
                })),

            addQuickAddItem: (item) =>
                set((s) => ({
                    quickAddItems: [...s.quickAddItems, { ...item, id: crypto.randomUUID() }],
                })),
            updateQuickAddItem: (id, updates) =>
                set((s) => ({
                    quickAddItems: s.quickAddItems.map((i) =>
                        i.id === id ? { ...i, ...updates } : i
                    ),
                })),
            removeQuickAddItem: (id) =>
                set((s) => ({
                    quickAddItems: s.quickAddItems.filter((i) => i.id !== id),
                })),
            reorderQuickAddItems: (items) => set({ quickAddItems: items }),

            darkMode: true,
            toggleDarkMode: () => set((s) => ({ darkMode: !s.darkMode })),
            deepGreyMode: false,
            toggleDeepGreyMode: () => set((s) => ({ deepGreyMode: !s.deepGreyMode })),
            drawerOpen: false,
            setDrawerOpen: (open) => set({ drawerOpen: open }),
            language: 'en' as Language,
            setLanguage: (l) => set({ language: l }),

            exportData: () => {
                const { settings, items, subscriptions, quickAddItems, darkMode, deepGreyMode, language } = get();
                return JSON.stringify({ settings, items, subscriptions, quickAddItems, darkMode, deepGreyMode, language }, null, 2);
            },
            importData: (json: string) => {
                try {
                    const data = JSON.parse(json);
                    if (data.settings && Array.isArray(data.items)) {
                        set({
                            settings: data.settings,
                            items: data.items,
                            ...(Array.isArray(data.subscriptions) && { subscriptions: data.subscriptions }),
                            ...(Array.isArray(data.quickAddItems) && { quickAddItems: data.quickAddItems }),
                            ...(data.darkMode !== undefined && { darkMode: data.darkMode }),
                            ...(data.deepGreyMode !== undefined && { deepGreyMode: data.deepGreyMode }),
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
                    subscriptions: [],
                    quickAddItems: QUICK_ADD_PRESETS.map((p) => ({
                        id: crypto.randomUUID(),
                        name: p.name,
                        price: p.price,
                        category: p.category,
                    })),
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
                    const price = Math.floor(Math.random() * (baseItem.max - baseItem.min + 1)) + baseItem.min;
                    // ~15% of completed items are regretted, biased toward expensive ones
                    const isRegretted = price > 80 ? Math.random() > 0.7 : Math.random() > 0.9;
                    demoItems.push({
                        id: crypto.randomUUID(),
                        name: baseItem.name,
                        category: baseItem.category,
                        price,
                        addedAt: ts - (Math.random() * msPerDay * 5), // Added sometime before completion
                        completed: true,
                        completedAt: ts,
                        ...(isRegretted && { regretted: true, regrettedAt: ts + Math.random() * msPerDay * 3 }),
                    });
                }

                // Guaranteed recent completed items (this week) including regretted ones for demo
                const recentDemoItems = [
                    { name: 'Dinner out', category: 'Food & Drink', price: 85, regretted: true },
                    { name: 'Headphones', category: 'Electronics', price: 199, regretted: true },
                    { name: 'Online Course', category: 'Education', price: 150, regretted: true },
                    { name: 'Coffee', category: 'Food & Drink', price: 6, regretted: false },
                    { name: 'Groceries', category: 'Food & Drink', price: 95, regretted: false },
                    { name: 'Movie Ticket', category: 'Entertainment', price: 18, regretted: false },
                    { name: 'Gas', category: 'Transport', price: 55, regretted: false },
                    { name: 'Book', category: 'Education', price: 25, regretted: false },
                ] as const;

                for (const ri of recentDemoItems) {
                    const hoursAgo = Math.floor(Math.random() * 72) + 1; // within last 3 days
                    const ts = now - hoursAgo * 60 * 60 * 1000;
                    demoItems.push({
                        id: crypto.randomUUID(),
                        name: ri.name,
                        category: ri.category,
                        price: ri.price,
                        addedAt: ts - msPerDay,
                        completed: true,
                        completedAt: ts,
                        ...(ri.regretted && { regretted: true, regrettedAt: ts + 60 * 60 * 1000 }),
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
            version: 2,
            migrate: (persisted: unknown, version: number) => {
                const state = persisted as Record<string, unknown>;
                if (version < 1 || !state.quickAddItems) {
                    state.quickAddItems = QUICK_ADD_PRESETS.map((p) => ({
                        id: crypto.randomUUID(),
                        name: p.name,
                        price: p.price,
                        category: p.category,
                    }));
                }
                if (version < 2 || !state.subscriptions) {
                    state.subscriptions = [];
                }
                return state;
            },
            partialize: (state) => ({
                settings: state.settings,
                items: state.items,
                subscriptions: state.subscriptions,
                quickAddItems: state.quickAddItems,
                darkMode: state.darkMode,
                deepGreyMode: state.deepGreyMode,
                language: state.language,
            }),
        }
    )
);
