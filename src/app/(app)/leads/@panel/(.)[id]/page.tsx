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
        className="hidden lg:flex flex-col w-full sm:max-w-2xl p-0 gap-0 overflow-hidden bg-card border-s border-border shadow-2xl"
      >
        {/* Panel Header Bar */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-muted/20 shrink-0">
          <SheetHeader className="text-start">
            <SheetTitle className="text-base font-bold text-foreground truncate">
              {lead?.name || 'تفاصيل العميل'}
            </SheetTitle>
          </SheetHeader>

          <div className="flex items-center gap-2">
            {lead && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  router.push(`/leads/${lead.id}`);
                }}
                className="h-8 px-3 text-xs text-muted-foreground hover:text-foreground gap-1.5 rounded-full border-border bg-card shadow-xs"
                title="فتح الصفحة كاملة"
              >
                <ExternalLink className="size-3.5" />
                <span>الصفحة كاملة</span>
              </Button>
            )}
            <button
              type="button"
              onClick={() => handleClose(false)}
              className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Panel Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 text-muted-foreground gap-3">
              <Loader2 className="size-7 animate-spin text-primary" />
              <span className="text-sm font-medium">جاري تحميل بيانات العميل…</span>
            </div>
          ) : isError || !lead ? (
            <div className="text-center py-20 text-destructive font-medium">
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
