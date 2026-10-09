'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { ShieldAlert, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import type { Backup } from '@/types/database';

export function BackupBanner() {
  const [isDismissed, setIsDismissed] = React.useState(false);
  const supabase = createClient();

  const { data: undownloadedBackup, refetch } = useQuery({
    queryKey: ['undownloaded_backup'],
    queryFn: async () => {
      const { data } = await supabase
        .from('backups')
        .select('*')
        .eq('status', 'ready')
        .is('downloaded_at', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      return data as Backup | null;
    },
    staleTime: 60 * 1000,
  });

  if (isDismissed || !undownloadedBackup) {
    return null;
  }

  const handleDownload = async () => {
    if (!undownloadedBackup.storage_path) return;

    try {
      const { data } = await supabase.storage
        .from('backups')
        .createSignedUrl(undownloadedBackup.storage_path, 60);

      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank');
        await supabase.rpc('mark_backup_downloaded', { p_id: undownloadedBackup.id });
        refetch();
      }
    } catch {
      // Silent catch on download error
    }
  };

  return (
    <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-2.5 text-xs text-amber-900 dark:text-amber-200">
      <div className="container max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShieldAlert className="size-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span className="font-semibold">
            لديك نسخة احتياطية جديدة جاهزة للتحميل ({undownloadedBackup.format.toUpperCase()})
          </span>
          <span className="text-muted-foreground hidden sm:inline">
            · يرجى تنزيلها وحفظها على جهازك لحماية بياناتك
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="primary"
            onClick={handleDownload}
            className="h-7 text-xs bg-amber-600 hover:bg-amber-700 text-white font-bold"
          >
            <Download className="size-3.5 me-1.5" />
            تحميل الآن
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsDismissed(true)}
            className="h-7 text-xs text-muted-foreground hover:bg-amber-500/20"
          >
            لاحقاً
          </Button>
        </div>
      </div>
    </div>
  );
}
