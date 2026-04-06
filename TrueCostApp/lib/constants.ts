export type IncomeType = 'hourly' | 'daily' | 'monthly' | 'freelance';

export const CATEGORIES = [
    'Food & Drink',
    'Electronics',
    'Clothing',
    'Entertainment',
    'Transport',
    'Housing',
    'Health',
    'Education',
    'Other',
] as const;

export type Category = (typeof CATEGORIES)[number];

export const CURRENCIES = [
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
    { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
    { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
    { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
    { code: 'TWD', symbol: 'NT$', name: 'Taiwan Dollar' },
] as const;

export type CurrencyCode = (typeof CURRENCIES)[number]['code'];

export interface QuickAddItem {
    name: string;
    price: number;
    category: Category;
}

export const QUICK_ADD_PRESETS: QuickAddItem[] = [
    { name: 'Coffee', price: 5, category: 'Food & Drink' },
    { name: 'Milk', price: 4, category: 'Food & Drink' },
    { name: 'iPhone', price: 1199, category: 'Electronics' },
    { name: 'Netflix (month)', price: 15.49, category: 'Entertainment' },
    { name: 'Gym (month)', price: 50, category: 'Health' },
    { name: 'Sneakers', price: 120, category: 'Clothing' },
];

export const DEFAULT_HOURS_PER_DAY = 8;
export const DEFAULT_DAYS_PER_MONTH = 22;

export const SUBSCRIPTION_CYCLES = ['weekly', 'monthly', 'yearly'] as const;
export type SubscriptionCycleType = (typeof SUBSCRIPTION_CYCLES)[number];
