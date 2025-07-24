// utils/dateShortcuts.ts
import { addDays, subDays, startOfToday, endOfToday, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subWeeks, subMonths } from 'date-fns';
import { createStaticRanges, defaultStaticRanges } from 'react-date-range';

export const customStaticRanges = createStaticRanges([
    {
        label: 'Azi',
        range: () => ({
            startDate: startOfToday(),
            endDate: endOfToday(),
        }),
    },
    {
        label: 'Ieri',
        range: () => ({
            startDate: subDays(startOfToday(), 1),
            endDate: subDays(endOfToday(), 1),
        }),
    },
    {
        label: 'Săptămâna aceasta',
        range: () => ({
            startDate: startOfWeek(new Date(), { weekStartsOn: 1 }), // luni
            endDate: endOfWeek(new Date(), { weekStartsOn: 1 }),
        }),
    },
    {
        label: 'Ultima săptămână',
        range: () => {
            const lastWeekStart = startOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 });
            const lastWeekEnd = endOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 });
            return {
                startDate: lastWeekStart,
                endDate: lastWeekEnd,
            };
        },
    },
    {
        label: 'Luna aceasta',
        range: () => ({
            startDate: startOfMonth(new Date()),
            endDate: endOfMonth(new Date()),
        }),
    },
    {
        label: 'Luna trecută',
        range: () => ({
            startDate: startOfMonth(subMonths(new Date(), 1)),
            endDate: endOfMonth(subMonths(new Date(), 1)),
        }),
    },
    {
        label: 'Ultimele 7 zile până azi',
        range: () => ({
            startDate: subDays(startOfToday(), 6),
            endDate: endOfToday(),
        }),
    },
    {
        label: 'Următoarele 7 zile de azi',
        range: () => ({
            startDate: startOfToday(),
            endDate: addDays(startOfToday(), 6),
        }),
    },
]);
