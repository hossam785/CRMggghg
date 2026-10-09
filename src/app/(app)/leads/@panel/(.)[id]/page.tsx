'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { X, ExternalLink, Loader2 } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { LeadHeader } from '@/features/leads/components/detail/LeadHeader';
import { ActionBar } from '@/features/pipeline/components/ActionBar';
import { LeadFields } from '@/features/leads/components/detail/LeadFields';
import { QualificationCard } from '@/features/leads/components/detail/QualificationCard';
import { NotesCard } from '@/features/leads/components/detail/NotesCard';
import { NextFollowUpCard } from '@/features/leads/components/detail/NextFollowUpCard';
import { Timeline } from '@/features/pipeline/components/Timeline';
import { useLead } from '@/features/leads/queries';

export default function LeadPanelIntercept() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const router = useRouter();

  const [open, setOpen] = React.useState(true);

  const { data: lead, isLoading, isError } = useLead(id || '');

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      setOpen(false);
      router.back();
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent
        side="end"
        className="hidden lg:flex flex-col w-full sm:max-w-2xl p-0 gap-0 overflow-hidden bg-[var(--surface)] border-s border-[var(--border)] shadow-xl"
      >
        {/* Panel Header Bar */}
        <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4 bg-[var(--surface-2)]/40 shrink-0">
          <SheetHeader className="text-start">
            <SheetTitle className="text-base font-bold text-[var(--fg)] truncate">
              {lead?.name || 'تفاصيل العميل'}
            </SheetTitle>
          </SheetHeader>

          <div className="flex items-center gap-2">
            {lead && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  router.push(`/leads/${lead.id}`);
                }}
                className="h-8 px-2 text-xs text-[var(--fg-muted)] hover:text-[var(--fg)] gap-1"
                title="فتح الصفحة كاملة"
              >
                <ExternalLink className="size-3.5" />
                <span>الصفحة كاملة</span>
              </Button>
            )}
            <button
              type="button"
              onClick={() => handleClose(false)}
              className="p-1 rounded-[var(--radius-sm)] text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--surface)] transition-colors"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Panel Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 text-[var(--fg-muted)] gap-3">
              <Loader2 className="size-7 animate-spin text-[var(--primary)]" />
              <span className="text-sm">جاري تحميل بيانات العميل…</span>
            </div>
          ) : isError || !lead ? (
            <div className="text-center py-20 text-[var(--danger)]">
              لم يتم العثور على العميل أو تم حذفه.
            </div>
          ) : (
            <>
              <LeadHeader lead={lead} onDeleted={() => handleClose(false)} />
              <ActionBar lead={lead} />
              <NextFollowUpCard lead={lead} />
              <LeadFields lead={lead} />
              <QualificationCard lead={lead} />
              <NotesCard lead={lead} />
              <Timeline leadId={lead.id} />
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
