'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import {
  MoreHorizontal,
  Trash2,
  Copy,
  Check,
  ExternalLink,
  MessageCircle,
} from 'lucide-react';
import { InstagramIcon as Instagram } from '@/components/icons/instagram';
import { Button } from '@/components/ui/button';
import { StageBadge } from '@/components/ui/stage-badge';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useSoftDeleteLead, useRestoreLead } from '@/features/leads/queries';
import { instagramUrl } from '@/lib/normalize/instagram';
import { waUrl } from '@/lib/normalize/phone';
import { cn } from '@/lib/utils';
import type { Lead } from '../../schema';

export interface LeadHeaderProps {
  lead: Lead;
  onDeleted?: () => void;
  className?: string;
}

export function LeadHeader({ lead, onDeleted, className }: LeadHeaderProps) {
  const router = useRouter();
  const t = useTranslations('leads');
  const tCommon = useTranslations('common');

  const [copiedHandle, setCopiedHandle] = React.useState(false);
  const [copiedPhone, setCopiedPhone] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);

  const softDeleteMutation = useSoftDeleteLead();
  const restoreMutation = useRestoreLead();

  // Copy helpers
  const handleCopyHandle = async () => {
    if (!lead.instagram_handle) return;
    try {
      await navigator.clipboard.writeText(`@${lead.instagram_handle}`);
      setCopiedHandle(true);
      setTimeout(() => setCopiedHandle(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleCopyPhone = async () => {
    if (!lead.whatsapp_e164) return;
    try {
      await navigator.clipboard.writeText(lead.whatsapp_e164);
      setCopiedPhone(true);
      setTimeout(() => setCopiedPhone(false), 2000);
    } catch {
      // Fallback
    }
  };

  // Delete flow
  const handleDeleteConfirm = () => {
    softDeleteMutation.mutate(lead.id, {
      onSuccess: () => {
        setIsDeleteDialogOpen(false);

        // Toast with Undo button
        toast.success(t('leadDeletedToast', { name: lead.name }), {
          duration: 6000,
          action: {
            label: tCommon('undo'),
            onClick: () => {
              restoreMutation.mutate(lead.id);
            },
          },
        });

        if (onDeleted) {
          onDeleted();
        } else {
          router.push('/leads');
        }
      },
    });
  };

  return (
    <>
      <div
        className={cn(
          'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 sm:p-6 rounded-2xl bg-card border border-border shadow-2xs',
          className
        )}
      >
        {/* Left Side: Name and Contact Action Chips */}
        <div className="space-y-3 min-w-0 flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground truncate">
              {lead.name}
            </h1>
            <StageBadge stage={lead.stage} size="md" />
          </div>

          {/* Subtitle details */}
          {(lead.company || lead.job_title) && (
            <p className="text-xs sm:text-sm text-muted-foreground">
              {lead.job_title && <span>{lead.job_title}</span>}
              {lead.job_title && lead.company && <span> · </span>}
              {lead.company && <span>{lead.company}</span>}
            </p>
          )}

          {/* Contact Action Chips */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {lead.instagram_handle && (
              <div className="inline-flex items-center rounded-full border border-pink-500/20 bg-pink-500/10 text-pink-700 dark:text-pink-300 text-xs font-mono ps-3 pe-1 py-1 gap-1.5 shadow-2xs">
                <Instagram className="size-3.5 text-pink-600 shrink-0" />
                <bdi className="dir-ltr">@{lead.instagram_handle}</bdi>

                {/* Copy button */}
                <button
                  type="button"
                  onClick={handleCopyHandle}
                  title={t('copyInstagram')}
                  className="p-1 rounded-full hover:bg-pink-500/20 transition-colors"
                >
                  {copiedHandle ? (
                    <Check className="size-3 text-emerald-600" />
                  ) : (
                    <Copy className="size-3 opacity-70" />
                  )}
                </button>

                {/* Direct Link */}
                <a
                  href={instagramUrl(lead.instagram_handle)}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={t('openProfile')}
                  className="p-1 rounded-full hover:bg-pink-500/20 transition-colors"
                >
                  <ExternalLink className="size-3 opacity-70" />
                </a>
              </div>
            )}

            {lead.whatsapp_e164 && (
              <div className="inline-flex items-center rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-mono ps-3 pe-1 py-1 gap-1.5 shadow-2xs">
                <MessageCircle className="size-3.5 text-emerald-600 shrink-0" />
                <bdi className="dir-ltr">{lead.whatsapp_e164}</bdi>

                {/* Copy button */}
                <button
                  type="button"
                  onClick={handleCopyPhone}
                  title={t('copyPhone')}
                  className="p-1 rounded-full hover:bg-emerald-500/20 transition-colors"
                >
                  {copiedPhone ? (
                    <Check className="size-3 text-emerald-600" />
                  ) : (
                    <Copy className="size-3 opacity-70" />
                  )}
                </button>

                {/* Direct Link */}
                <a
                  href={waUrl(lead.whatsapp_e164)}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={t('openChat')}
                  className="p-1 rounded-full hover:bg-emerald-500/20 transition-colors"
                >
                  <ExternalLink className="size-3 opacity-70" />
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: ⋯ Menu */}
        <div className="flex items-center self-start sm:self-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="size-9 p-0 rounded-full border-border text-muted-foreground hover:text-foreground"
              >
                <MoreHorizontal className="size-4" />
                <span className="sr-only">خيارات إضافية</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 border-border bg-card">
              <DropdownMenuItem
                onClick={() => setIsDeleteDialogOpen(true)}
                className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
              >
                <Trash2 className="size-4 me-2" />
                <span>{t('deleteLead')}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md border-border bg-card">
          <DialogHeader className="text-start">
            <DialogTitle className="text-base font-bold text-foreground">
              {t('deleteConfirmTitle')}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-1.5">
              {t('deleteConfirmDesc')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              {tCommon('cancel')}
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={handleDeleteConfirm}
              disabled={softDeleteMutation.isPending}
            >
              {t('deleteConfirmAction')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
