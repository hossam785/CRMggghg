import type { DashboardRange } from './types';

export interface DateRangeResult {
  range: DashboardRange;
  from: string; // ISO string
  to: string;   // ISO string
  labelAr: string;
  labelEn: string;
}

export function computeDateRange(range: DashboardRange): DateRangeResult {
  const now = new Date();

  switch (range) {
    case 'today': {
      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);
      return {
        range: 'today',
        from: startOfDay.toISOString(),
        to: now.toISOString(),
        labelAr: 'اليوم',
        labelEn: 'Today',
      };
    }

    case '7d': {
      const past = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return {
        range: '7d',
        from: past.toISOString(),
        to: now.toISOString(),
        labelAr: 'آخر 7 أيام',
        labelEn: 'Last 7 days',
      };
    }

    case 'this_month': {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      return {
        range: 'this_month',
        from: startOfMonth.toISOString(),
        to: now.toISOString(),
        labelAr: 'هذا الشهر',
        labelEn: 'This month',
      };
    }

    case 'all': {
      const epoch = new Date('2020-01-01T00:00:00.000Z');
      return {
        range: 'all',
        from: epoch.toISOString(),
        to: now.toISOString(),
        labelAr: 'كل الوقت',
        labelEn: 'All time',
      };
    }

    case '30d':
    default: {
      const past = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return {
        range: '30d',
        from: past.toISOString(),
        to: now.toISOString(),
        labelAr: 'آخر 30 يوم',
        labelEn: 'Last 30 days',
      };
    }
  }
}
