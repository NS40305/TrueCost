import { IncomeType } from './constants';

export interface Settings {
    incomeType: IncomeType;
    rate: number;
    hoursPerDay: number;
    daysPerMonth: number;
}

export interface TimeResult {
    hours: number;
    days: number;
    years: number;
}

export function getHourlyRate(settings: Settings): number {
    const { incomeType, rate, hoursPerDay, daysPerMonth } = settings;
    switch (incomeType) {
        case 'hourly':
            return rate;
        case 'daily':
            return rate / hoursPerDay;
        case 'monthly':
            return rate / (hoursPerDay * daysPerMonth);
        case 'freelance':
            return rate / 2080; // 40 hrs/week × 52 weeks
        default:
            return 0;
    }
}

export function getYearlyIncome(settings: Settings): number {
    const hourlyRate = getHourlyRate(settings);
    return hourlyRate * settings.hoursPerDay * settings.daysPerMonth * 12;
}

export function getTimeNeeded(price: number, settings: Settings): TimeResult {
    const hourlyRate = getHourlyRate(settings);
    if (hourlyRate <= 0) return { hours: 0, days: 0, years: 0 };

    const hours = price / hourlyRate;
    const days = hours / settings.hoursPerDay;
    const years = days / (settings.daysPerMonth * 12);

    return { hours, days, years };
}

export function formatHours(value: number): string {
    return value.toFixed(2);
}

export function formatDays(value: number): string {
    return value.toFixed(2);
}

export function formatYears(value: number): string {
    return value.toFixed(3);
}

export function getMonthlyIncome(settings: Settings): number {
    const hourlyRate = getHourlyRate(settings);
    return hourlyRate * settings.hoursPerDay * settings.daysPerMonth;
}
