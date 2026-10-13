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
import { ExportButton, createLeadDetailExportSpec } from '@/features/data-hub/export';

export default function LeadDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const router = useRouter();
  const locale = useLocale();

  const { data: lead, isLoading, isError } = useLead(id || '');
  const leadExportSpec = React.useMemo(
    () => (lead ? createLeadDetailExportSpec(lead) : null),
    [lead]
  );

  const BackIcon = locale === 'ar' ? ArrowRight : ArrowLeft;

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 pb-20 px-4 sm:px-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-9 w-24 rounded-full" />
        </div>
        <div className="p-6 rounded-2xl border border-border bg-card space-y-4 shadow-2xs">
          <Skeleton className="h-8 w-48 rounded-lg" />
          <Skeleton className="h-4 w-32 rounded-lg" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-28 rounded-full" />
            <Skeleton className="h-6 w-28 rounded-full" />
          </div>
        </div>
        <div className="p-6 rounded-2xl border border-border bg-card space-y-4 shadow-2xs">
          <Skeleton className="h-6 w-32 rounded-lg" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !lead) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 space-y-4">
        <div className="size-14 rounded-full flex items-center justify-center bg-destructive/10 text-destructive">
          <span className="text-2xl font-bold">!</span>
        </div>
        <h2 className="text-xl font-extrabold text-foreground">
          العميل غير موجود
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-sm">
          قد يكون هذا العميل قد تم حذفه أو أن الرابط غير صحيح.
        </p>
        <Button asChild variant="outline" size="sm" className="rounded-full h-9 px-4 border-border bg-card hover:bg-muted/40 text-foreground shadow-2xs">
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
      {/* Top Relate Navigation Bar with Pill Buttons */}
      <div className="flex items-center justify-between pt-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push('/leads')}
          className="rounded-full h-9 px-3.5 gap-2 border-border bg-card text-muted-foreground hover:text-foreground shadow-2xs transition-all"
        >
          <BackIcon className="size-4" />
          <span>العودة للعملاء</span>
        </Button>
        {leadExportSpec && <ExportButton spec={leadExportSpec} />}
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
