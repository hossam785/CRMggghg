'use client';

import * as React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { BackupScheduleCard } from '@/features/data-hub/backups/components/BackupScheduleCard';
import { BackupsListTable } from '@/features/data-hub/backups/components/BackupsListTable';

export default function BackupsPage() {
  const searchParams = useSearchParams();
  const downloadId = searchParams.get('download');
  const supabase = createClient();

  // Handle ?download=<id> deep link from push notification or email
  React.useEffect(() => {
    if (!downloadId) return;
    const targetId = downloadId;

    async function handleAutoDownload() {
      try {
        const { data: backup } = await supabase
          .from('backups')
          .select('storage_path')
          .eq('id', targetId)
          .single();

        if (backup?.storage_path) {
          const { data } = await supabase.storage
            .from('backups')
            .createSignedUrl(backup.storage_path, 60);

          if (data?.signedUrl) {
            window.open(data.signedUrl, '_blank');
            await supabase.rpc('mark_backup_downloaded', { p_id: targetId });
          }
        }
      } catch {
        // Silent catch for auto-download deep link failures
      }
    }

    handleAutoDownload();
  }, [downloadId, supabase]);

  return (
    <div className="container max-w-5xl mx-auto py-8 px-4 space-y-8">
      {/* Header */}
      <div className="space-y-1 border-b border-border pb-5">
        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
          <Link href="/data" className="hover:underline">
            مركز البيانات
          </Link>
          <span>/</span>
          <span>النسخ الاحتياطي والاسترجاع</span>
        </div>
        <h1 className="text-xl font-black text-foreground flex items-center gap-2.5">
          <ShieldCheck className="size-6 text-primary" />
          <span>النسخ الاحتياطي التلقائي والأرشيف</span>
        </h1>
        <p className="text-xs text-muted-foreground">
          حماية وتشفير قاعدة بيانات العملاء بجدولة دورية، وتنزيل الأرشيفات، واسترجاع البيانات بضغطة واحدة.
        </p>
      </div>

      {/* Schedule Configuration Card */}
      <BackupScheduleCard />

      {/* Backups List & Archive Table */}
      <BackupsListTable />
    </div>
  );
}
