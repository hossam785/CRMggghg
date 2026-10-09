'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { LeadHeader } from '@/features/leads/components/detail/LeadHeader';
import { ActionBar } from '@/features/pipeline/components/ActionBar';
import { LeadFields } from '@/features/leads/components/detail/LeadFields';
import { QualificationCard } from '@/features/leads/components/detail/QualificationCard';
import { NotesCard } from '@/features/leads/components/detail/NotesCard';
import { NextFollowUpCard } from '@/features/leads/components/detail/NextFollowUpCard';
import { Timeline } from '@/features/pipeline/components/Timeline';
import { useLead } from '@/features/leads/queries';

export default function LeadDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const router = useRouter();
  const locale = useLocale();

  const { data: lead, isLoading, isError } = useLead(id || '');

  const BackIcon = locale === 'ar' ? ArrowRight : ArrowLeft;

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 pb-20 px-4 sm:px-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-9 w-24 rounded-md" />
        </div>
        <div className="p-6 rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-28 rounded-full" />
            <Skeleton className="h-6 w-28 rounded-full" />
          </div>
        </div>
        <div className="p-6 rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] space-y-4">
          <Skeleton className="h-6 w-32" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !lead) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 space-y-4">
        <h2 className="text-xl font-bold text-[var(--danger)]">العميل غير موجود</h2>
        <p className="text-sm text-[var(--fg-muted)] max-w-sm">
          قد يكون هذا العميل قد تم حذفه أو أن الرابط غير صحيح.
        </p>
        <Button asChild variant="outline" size="sm">
          <Link href="/leads" className="gap-2">
            <BackIcon className="size-4" />
            <span>العودة لقائمة العملاء</span>
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-24 px-4 sm:px-6">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/leads')}
          className="gap-2 text-[var(--fg-muted)] hover:text-[var(--fg)] -ms-2"
        >
          <BackIcon className="size-4" />
          <span>العودة للقائمة</span>
        </Button>
      </div>

      {/* 1. Header with Name, Copy buttons, links, stage badge, delete */}
      <LeadHeader lead={lead} onDeleted={() => router.push('/leads')} />

      {/* Pipeline Action Bar */}
      <ActionBar lead={lead} />

      {/* 2. Next Follow-up Card */}
      <NextFollowUpCard lead={lead} />

      {/* 3. Core Lead Fields (Inline Autosave) */}
      <LeadFields lead={lead} />

      {/* 4. Qualification Details */}
      <QualificationCard lead={lead} />

      {/* 5. Notes */}
      <NotesCard lead={lead} />

      {/* 6. Activity & Stage History Timeline */}
      <Timeline leadId={lead.id} />
    </div>
  );
}
