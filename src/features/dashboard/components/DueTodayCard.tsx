'use client';

import * as React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { CalendarClock, CheckCircle2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import type { FollowUpQueueRow } from '@/types/database';
import { isDemoMode, demoStore } from '@/lib/demo/demo-store';

export function DueTodayCard() {
  const supabase = createClient();

  const { data: queue = [] } = useQuery<FollowUpQueueRow[]>({
    queryKey: ['follow_up_queue'],
    queryFn: async () => {
      if (isDemoMode()) {
        return demoStore.getFollowUpQueue();
      }
      const { data, error } = await supabase.rpc('follow_up_queue');
      if (error) throw error;
      return (data || []) as FollowUpQueueRow[];
    },
    staleTime: 30 * 1000,
  });

  const dueItems = queue.filter((item) =>
    ['due_fu1', 'due_fu2', 'due_fu3', 'reminder', 'meeting_today'].includes(item.bucket)
  );
  const dueCount = dueItems.length;

  if (dueCount === 0) {
    return (
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="size-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-foreground block">
              لا توجد متابعات مستحقة اليوم 🎉
            </span>
            <span className="text-[11px] text-muted-foreground">
              جميع العملاء تمت متابعتهم في مواعيدهم المحددة. عمل رائع!
            </span>
          </div>
        </div>

        <Button asChild size="sm" variant="outline" className="text-xs h-8">
          <Link href="/follow-ups">عرض قائمة المتابعات</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
      <div className="flex items-center gap-3.5">
        <div className="size-11 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
          <CalendarClock className="size-6" />
        </div>
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="text-sm font-black text-foreground">
              لديك {dueCount} {dueCount === 1 ? 'متابعة مستحقة' : 'متابعات مستحقة'} اليوم
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300">
              مستحق الآن
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            تواصل مع هؤلاء العملاء الآن للحفاظ على تفاعلهم وزيادة نسبة التحويل.
          </p>
        </div>
      </div>

      <Button asChild size="sm" className="font-bold bg-amber-600 hover:bg-amber-700 text-white shrink-0 shadow-xs">
        <Link href="/follow-ups">
          <span>فتح قائمة المتابعات</span>
          <ArrowLeft className="size-4 ms-1.5 rtl:rotate-180" />
        </Link>
      </Button>
    </div>
  );
}
