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
      <div className="rounded-2xl border border-border bg-card p-4.5 sm:p-5 flex items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="size-10 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-emerald-400 inline-block" />
              <span className="text-xs font-bold text-foreground">
                لا توجد متابعات متأخرة اليوم 🎉
              </span>
            </div>
            <span className="text-[11px] text-muted-foreground mt-0.5 block">
              جميع العملاء تمت متابعتهم في مواعيدهم المحددة بنجاح.
            </span>
          </div>
        </div>

        <Button
          asChild
          size="sm"
          variant="outline"
          className="text-xs h-8 rounded-full border-border hover:border-primary hover:text-primary px-4"
        >
          <Link href="/follow-ups">عرض قائمة المتابعات</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs relative overflow-hidden">
      {/* Soft Amber Accent wash */}
      <div className="absolute inset-y-0 start-0 w-1.5 bg-amber-500 rounded-s-full" />

      <div className="flex items-center gap-3.5 ps-2">
        <div className="size-11 rounded-2xl bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0 shadow-xs">
          <CalendarClock className="size-6" />
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-sm sm:text-base font-semibold text-foreground tracking-tight">
              لديك {dueCount} {dueCount === 1 ? 'متابعة مستحقة' : 'متابعات مستحقة'} اليوم
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/20">
              <span className="size-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span>مستحق الآن</span>
            </span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            تواصل مع هؤلاء العملاء عبر إنستجرام أو واتساب للحفاظ على تفاعلهم وزيادة نسبة التحويل.
          </p>
        </div>
      </div>

      <Button
        asChild
        size="sm"
        className="rounded-full font-semibold border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 px-5 py-2 shrink-0 shadow-xs transition-all active:scale-[0.98] cursor-pointer"
      >
        <Link href="/follow-ups">
          <span>فتح قائمة المتابعات</span>
          <ArrowLeft className="size-4 ms-1.5 rtl:rotate-180" />
        </Link>
      </Button>
    </div>
  );
}
