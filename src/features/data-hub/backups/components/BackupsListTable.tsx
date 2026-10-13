'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Download,
  RotateCcw,
  Trash2,
  CheckCircle2,
  Shield,
  Loader2,
  HardDrive,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import type { Backup } from '@/types/database';
import { RestoreModal } from './RestoreModal';

export function BackupsListTable() {
  const supabase = createClient();
  const [restoringBackup, setRestoringBackup] = React.useState<Backup | null>(null);
  const [isGenerating, setIsGenerating] = React.useState(false);

  const { data: backups = [], isLoading, refetch } = useQuery({
    queryKey: ['backups_list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('backups')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as Backup[];
    },
  });

  const handleDownload = async (backup: Backup) => {
    if (!backup.storage_path) return;
    try {
      const { data } = await supabase.storage
        .from('backups')
        .createSignedUrl(backup.storage_path, 60);

      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank');
        await supabase.rpc('mark_backup_downloaded', { p_id: backup.id });
        refetch();
      }
    } catch {
      // Silent catch on download error
    }
  };

  const handleDelete = async (backup: Backup) => {
    if (!confirm('هل أنت متأكد من حذف هذه النسخة الاحتياطية؟')) return;

    try {
      if (backup.storage_path) {
        await supabase.storage.from('backups').remove([backup.storage_path]);
      }
      await supabase.from('backups').delete().eq('id', backup.id);
      refetch();
    } catch {
      // Silent catch on delete error
    }
  };

  const handleBackupNow = async () => {
    setIsGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/generate-backup`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ kind: 'manual' }),
        }
      );

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to trigger backup');
      }

      refetch();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'فشل إنشاء النسخة الاحتياطية');
    } finally {
      setIsGenerating(false);
    }
  };

  const formatSize = (bytes: number | null) => {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getKindLabel = (kind: Backup['kind']) => {
    switch (kind) {
      case 'scheduled':
        return 'مجدولة تلقائيًا';
      case 'manual':
        return 'نسخة يدوية';
      case 'pre_restore':
        return 'قبل الاسترجاع';
      case 'pre_import':
        return 'قبل الاستيراد';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base sm:text-lg font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
            <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <HardDrive className="size-4" />
            </div>
            <span>أرشيف النسخ الاحتياطية المحفوظة</span>
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            يمكنك تحميل أي نسخة أو استرجاع بياناتك منها بأمان
          </p>
        </div>

        <Button
          size="sm"
          onClick={handleBackupNow}
          disabled={isGenerating}
          className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-2xs self-start sm:self-center"
        >
          {isGenerating ? <Loader2 className="size-4 animate-spin me-1.5" /> : <Shield className="size-4 me-1.5" />}
          إنشاء نسخة احتياطية الآن
        </Button>
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-2xs">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-muted-foreground">
            <Loader2 className="size-6 animate-spin text-primary mx-auto mb-2" />
            جارِ تحميل قائمة النسخ…
          </div>
        ) : backups.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground space-y-2">
            <HardDrive className="size-8 text-muted-foreground/50 mx-auto" />
            <div className="text-xs font-bold text-foreground">لا توجد نسخ احتياطية محفوظة حتى الآن</div>
            <p className="text-[11px] text-muted-foreground">اضغط على زر &quot;إنشاء نسخة احتياطية الآن&quot; للبدء</p>
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {backups.map((b) => (
              <div
                key={b.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/20 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-foreground">
                      {new Date(b.created_at).toLocaleString('ar-EG')}
                    </span>
                    <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                      {getKindLabel(b.kind)}
                    </span>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                      {b.format}
                    </span>
                    {b.downloaded_at && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400">
                        <CheckCircle2 className="size-3" />
                        <span>تم التنزيل</span>
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-3">
                    <span>الحجم: {formatSize(b.size_bytes)}</span>
                    {b.checksum && (
                      <span className="font-mono text-[10px] text-muted-foreground/80">
                        SHA: {b.checksum.slice(0, 8)}…
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(b)}
                    className="rounded-full h-8 text-xs font-semibold border-border shadow-2xs"
                  >
                    <Download className="size-3.5 me-1.5" />
                    تحميل
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setRestoringBackup(b)}
                    className="rounded-full h-8 text-xs font-semibold border-border text-primary hover:bg-primary/10 shadow-2xs"
                  >
                    <RotateCcw className="size-3.5 me-1.5" />
                    استرجاع
                  </Button>

                  {b.kind === 'manual' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(b)}
                      className="rounded-full size-8 text-destructive hover:bg-destructive/10"
                      title="حذف هذه النسخة"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {restoringBackup && (
        <RestoreModal
          backup={restoringBackup}
          onClose={() => setRestoringBackup(null)}
          onRestored={() => {
            refetch();
            setRestoringBackup(null);
          }}
        />
      )}
    </div>
  );
}
