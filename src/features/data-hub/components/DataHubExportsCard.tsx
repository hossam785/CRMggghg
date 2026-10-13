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
    <div className="rounded-2xl border border-border bg-card p-6 shadow-2xs space-y-5">
      <div className="border-b border-border pb-3.5 flex items-center justify-between">
        <div>
          <h2 className="text-base sm:text-lg font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
            <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <FileSpreadsheet className="size-4" />
            </div>
            <span>{t('quickExportsTitle')}</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            {t('quickExportsDesc')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
        <div className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-muted/20 hover:bg-muted/40 transition-all">
          <div className="flex items-center gap-2.5">
            <div className="size-7 rounded-full bg-blue-500/10 text-primary flex items-center justify-center">
              <Users className="size-3.5" />
            </div>
            <span className="text-xs font-bold text-foreground">{t('allLeads')}</span>
          </div>
          <ExportButton spec={leadsSpec} size="sm" />
        </div>

        <div className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-muted/20 hover:bg-muted/40 transition-all">
          <div className="flex items-center gap-2.5">
            <div className="size-7 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Clock className="size-3.5" />
            </div>
            <span className="text-xs font-bold text-foreground">{t('followUpQueue')}</span>
          </div>
          <ExportButton spec={followUpsSpec} size="sm" />
        </div>

        <div className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-muted/20 hover:bg-muted/40 transition-all">
          <div className="flex items-center gap-2.5">
            <div className="size-7 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <Briefcase className="size-3.5" />
            </div>
            <span className="text-xs font-bold text-foreground">{t('businessIndustries')}</span>
          </div>
          <ExportButton spec={industriesSpec} size="sm" />
        </div>

        <div className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-muted/20 hover:bg-muted/40 transition-all">
          <div className="flex items-center gap-2.5">
            <div className="size-7 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center">
              <Trash2 className="size-3.5" />
            </div>
            <span className="text-xs font-bold text-foreground">{t('trashRecords')}</span>
          </div>
          <ExportButton spec={trashSpec} size="sm" />
        </div>
      </div>
    </div>
  );
}
