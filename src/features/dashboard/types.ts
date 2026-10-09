import { z } from 'zod';

export type DashboardRange = 'today' | '7d' | '30d' | 'this_month' | 'all';

export const DashboardStatsSchema = z.object({
  total_leads: z.number().default(0),
  pipeline: z.record(z.string(), z.number()).default({}),
  new_leads: z.object({
    cur: z.number().default(0),
    prev: z.number().default(0),
  }),
  not_contacted: z.number().default(0),
  cur: z.object({
    first_messages: z.number().default(0),
    follow_ups: z.number().default(0),
    replied: z.number().default(0),
    meetings: z.number().default(0),
    won: z.number().default(0),
  }),
  prev: z.object({
    first_messages: z.number().default(0),
    follow_ups: z.number().default(0),
    replied: z.number().default(0),
    meetings: z.number().default(0),
    won: z.number().default(0),
  }),
});

export type RawDashboardStats = z.infer<typeof DashboardStatsSchema>;

export interface KpiItem {
  id: string;
  titleKey: string;
  value: number;
  prevValue?: number;
  deltaPercent?: number | null;
  deltaDirection?: 'up' | 'down' | 'neutral';
  hint: string;
  href?: string;
  formatter?: (val: number) => string;
}

export function computeDelta(cur: number, prev: number): {
  percent: number | null;
  direction: 'up' | 'down' | 'neutral';
  formatted: string;
} {
  if (prev === 0) {
    if (cur > 0) return { percent: null, direction: 'up', formatted: '—' };
    return { percent: 0, direction: 'neutral', formatted: '0%' };
  }

  const change = ((cur - prev) / prev) * 100;
  const rounded = Math.round(change);
  const direction = rounded > 0 ? 'up' : rounded < 0 ? 'down' : 'neutral';
  const prefix = rounded > 0 ? '+' : '';

  return {
    percent: rounded,
    direction,
    formatted: `${prefix}${rounded}%`,
  };
}
