import { create } from 'zustand';

type IncomeType = 'hourly' | 'daily' | 'monthly' | 'freelance';

interface AppState {
    income: number;
    incomeType: IncomeType;
    workingHoursPerDay: number;
    workingDaysPerMonth: number;
    currency: string;

    setIncome: (v: number) => void;
    setIncomeType: (t: IncomeType) => void;
    setWorkingHoursPerDay: (v: number) => void;
    setWorkingDaysPerMonth: (v: number) => void;
}

export const useStore = create<AppState>((set) => ({
    income: 15,
    incomeType: 'hourly',
    workingHoursPerDay: 8,
    workingDaysPerMonth: 22,
    currency: 'USD',

    setIncome: (v) => set({ income: v }),
    setIncomeType: (t) => set({ incomeType: t }),
    setWorkingHoursPerDay: (v) => set({ workingHoursPerDay: v }),
    setWorkingDaysPerMonth: (v) => set({ workingDaysPerMonth: v }),
}));

export function calculateHourlyRate(state: AppState): number {
    const amount = state.income || 0;

    switch (state.incomeType) {
        case 'hourly':
        case 'freelance': // Simplified for storytelling
            return amount > 0 ? amount : 15;

        case 'daily': {
            const hours = state.workingHoursPerDay || 8;
            return amount / hours;
        }

        case 'monthly': {
            const hours = state.workingHoursPerDay || 8;
            const days = state.workingDaysPerMonth || 22;
            return amount / (hours * days);
        }

        default:
            return 15;
    }
}
