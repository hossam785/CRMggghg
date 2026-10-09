'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { qk } from '@/lib/query-keys';
import { followUpsApi } from './api';
import { type FollowUpQueueRow, type FollowUpBucket } from '@/types/database';

export interface GroupedFollowUps {
  due_fu1: FollowUpQueueRow[];
  due_fu2: FollowUpQueueRow[];
  due_fu3: FollowUpQueueRow[];
  reminder: FollowUpQueueRow[];
  meeting_today: FollowUpQueueRow[];
  exhausted: FollowUpQueueRow[];
  waiting: FollowUpQueueRow[];
  totals: Record<FollowUpBucket, number>;
  totalDue: number;
  waitingTotal: number;
  nextDueAfterZero: string | null;
}

export function groupFollowUps(rows: FollowUpQueueRow[] = []): GroupedFollowUps {
  const groups: GroupedFollowUps = {
    due_fu1: [],
    due_fu2: [],
    due_fu3: [],
    reminder: [],
    meeting_today: [],
    exhausted: [],
    waiting: [],
    totals: {
      due_fu1: 0,
      due_fu2: 0,
      due_fu3: 0,
      reminder: 0,
      meeting_today: 0,
      exhausted: 0,
      waiting: 0,
    },
    totalDue: 0,
    waitingTotal: 0,
    nextDueAfterZero: null,
  };

  for (const row of rows) {
    const bucket = row.bucket as FollowUpBucket;
    if (bucket in groups && Array.isArray((groups as unknown as Record<string, unknown>)[bucket])) {
      (groups[bucket] as FollowUpQueueRow[]).push(row);
      groups.totals[bucket] = Number(row.bucket_total) || groups[bucket].length;
    }
  }

  groups.waitingTotal = groups.totals.waiting;
  groups.totalDue =
    groups.due_fu1.length +
    groups.due_fu2.length +
    groups.due_fu3.length +
    groups.reminder.length +
    groups.meeting_today.length +
    groups.exhausted.length;

  if (groups.waiting.length > 0) {
    const dates = groups.waiting
      .map((r) => r.next_follow_up_on)
      .filter((d): d is string => Boolean(d))
      .sort();
    groups.nextDueAfterZero = dates[0] || null;
  }

  return groups;
}

export function useFollowUpQueue(waitingLimit: number = 100) {
  const query = useQuery({
    queryKey: qk.followUps(),
    queryFn: ({ signal }) => followUpsApi.getFollowUpQueue(waitingLimit, signal),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

  const grouped = React.useMemo(() => {
    return groupFollowUps(query.data || []);
  }, [query.data]);

  return {
    ...query,
    grouped,
  };
}
