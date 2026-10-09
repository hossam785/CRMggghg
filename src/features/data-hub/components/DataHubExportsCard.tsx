'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { FileSpreadsheet, Users, Clock, Briefcase, Trash2 } from 'lucide-react';
import { ExportButton } from '../export/ExportButton';
import { createLeadsExportSpec } from '../export/specs/leads-spec';
import { createFollowUpsExportSpec } from '../export/specs/followups-spec';
import { createIndustriesExportSpec } from '../export/specs/industries-spec';
import { createTrashExportSpec } from '../export/specs/trash-spec';

export function DataHubExportsCard() {
  const t = useTranslations('data');
  const leadsSpec = React.useMemo(() => createLeadsExportSpec(), []);
  const followUpsSpec = React.useMemo(() => createFollowUpsExportSpec(), []);
  const industriesSpec = React.useMemo(() => createIndustriesExportSpec(), []);
  const trashSpec = React.useMemo(() => createTrashExportSpec(), []);

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
      <div className="border-b border-border/60 pb-3">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <FileSpreadsheet className="size-5 text-primary" />
          <span>{t('quickExportsTitle')}</span>
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          {t('quickExportsDesc')}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
        <div className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-background">
          <div className="flex items-center gap-2.5">
            <Users className="size-4 text-primary" />
            <span className="text-xs font-semibold text-foreground">{t('allLeads')}</span>
          </div>
          <ExportButton spec={leadsSpec} size="sm" />
        </div>

        <div className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-background">
          <div className="flex items-center gap-2.5">
            <Clock className="size-4 text-amber-500" />
            <span className="text-xs font-semibold text-foreground">{t('followUpQueue')}</span>
          </div>
          <ExportButton spec={followUpsSpec} size="sm" />
        </div>

        <div className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-background">
          <div className="flex items-center gap-2.5">
            <Briefcase className="size-4 text-emerald-500" />
            <span className="text-xs font-semibold text-foreground">{t('businessIndustries')}</span>
          </div>
          <ExportButton spec={industriesSpec} size="sm" />
        </div>

        <div className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-background">
          <div className="flex items-center gap-2.5">
            <Trash2 className="size-4 text-destructive" />
            <span className="text-xs font-semibold text-foreground">{t('trashRecords')}</span>
          </div>
          <ExportButton spec={trashSpec} size="sm" />
        </div>
      </div>
    </div>
  );
}
