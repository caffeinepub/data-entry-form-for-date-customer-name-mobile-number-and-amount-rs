import type { Entry } from '../backend';
import { parseManualDate } from './date';

export interface MonthlyData {
  month: string;
  monthIndex: number;
  totalAmount: number;
  count: number;
}

export interface YearlyData {
  year: number;
  totalAmount: number;
  count: number;
}

/**
 * Aggregates entries by month for a given year.
 * Returns data for all 12 months (Jan-Dec), with 0 values for months with no entries.
 */
export function aggregateByMonth(entries: Entry[], year: number): MonthlyData[] {
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  // Initialize all months with 0 values
  const monthlyMap = new Map<number, { totalAmount: number; count: number }>();
  for (let i = 0; i < 12; i++) {
    monthlyMap.set(i, { totalAmount: 0, count: 0 });
  }

  // Aggregate entries
  entries.forEach((entry) => {
    const date = parseManualDate(entry.manualDate);
    if (!date) return;

    if (date.getFullYear() === year) {
      const month = date.getMonth();
      const existing = monthlyMap.get(month)!;
      existing.totalAmount += Number(entry.amountRs);
      existing.count += 1;
    }
  });

  // Convert to array
  return Array.from(monthlyMap.entries()).map(([monthIndex, data]) => ({
    month: monthNames[monthIndex],
    monthIndex,
    totalAmount: data.totalAmount,
    count: data.count,
  }));
}

/**
 * Aggregates entries by year.
 * Returns data for all years present in the entries.
 */
export function aggregateByYear(entries: Entry[]): YearlyData[] {
  const yearlyMap = new Map<number, { totalAmount: number; count: number }>();

  entries.forEach((entry) => {
    const date = parseManualDate(entry.manualDate);
    if (!date) return;

    const year = date.getFullYear();
    const existing = yearlyMap.get(year) || { totalAmount: 0, count: 0 };
    existing.totalAmount += Number(entry.amountRs);
    existing.count += 1;
    yearlyMap.set(year, existing);
  });

  // Convert to array and sort by year
  return Array.from(yearlyMap.entries())
    .map(([year, data]) => ({
      year,
      totalAmount: data.totalAmount,
      count: data.count,
    }))
    .sort((a, b) => a.year - b.year);
}

/**
 * Gets all unique years from entries.
 */
export function getAvailableYears(entries: Entry[]): number[] {
  const years = new Set<number>();

  entries.forEach((entry) => {
    const date = parseManualDate(entry.manualDate);
    if (date) {
      years.add(date.getFullYear());
    }
  });

  return Array.from(years).sort((a, b) => b - a); // Descending order
}
