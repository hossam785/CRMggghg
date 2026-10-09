'use client';

import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Clock, Bell, Check, Loader2, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/types/database';

type BackupSettingsRow = Database['public']['Tables']['backup_settings']['Row'];

interface FormProps {
  settings: BackupSettingsRow | null;
  onRefetch: () => void;
}

function BackupScheduleForm({ settings, onRefetch }: FormProps) {
  const queryClient = useQueryClient();
  const supabase = createClient();
  const [isSaved, setIsSaved] = React.useState(false);

  const [frequency, setFrequency] = React.useState<BackupSettingsRow['frequency']>(
    settings?.frequency ?? 'weekly'
  );
  const [weekday, setWeekday] = React.useState<number>(settings?.weekday ?? 5); // الجمعة
  const [monthDay, setMonthDay] = React.useState<number>(settings?.month_day ?? 1);
  const [hourLocal, setHourLocal] = React.useState<number>(settings?.hour_local ?? 9);
  const [format, setFormat] = React.useState<BackupSettingsRow['format']>(
    settings?.format ?? 'xlsx'
  );
  const [keepLast, setKeepLast] = React.useState<number>(settings?.keep_last ?? 8);
  const [notifyInapp, setNotifyInapp] = React.useState<boolean>(settings?.notify_inapp ?? true);
  const [notifyPush, setNotifyPush] = React.useState<boolean>(settings?.notify_push ?? true);
  const [notifyEmail, setNotifyEmail] = React.useState<boolean>(settings?.notify_email ?? false);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('backup_settings').upsert({
        frequency,
        weekday,
        month_day: monthDay,
        hour_local: hourLocal,
        format,
        keep_last: keepLast,
        notify_inapp: notifyInapp,
        notify_push: notifyPush,
        notify_email: notifyEmail,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
      onRefetch();
      queryClient.invalidateQueries({ queryKey: ['backup_settings'] });
    },
  });

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
        <div className="space-y-1">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <Clock className="size-5 text-primary" />
            <span>جدولة النسخ الاحتياطي التلقائي</span>
          </h2>
          <p className="text-xs text-muted-foreground">
            تحديد مواعيد إنشاء النسخ الاحتياطية تلقائيًا والاحتفاظ بعدد معين منها.
          </p>
        </div>

        {settings?.next_run_at && frequency !== 'off' && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 text-primary text-xs font-bold border border-primary/20">
            <Calendar className="size-3.5" />
            <span>
              النسخة القادمة: {new Date(settings.next_run_at).toLocaleString('ar-EG')}
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        {/* Frequency */}
        <div>
          <label className="font-semibold text-foreground block mb-1.5">التكرار</label>
          <select
            value={frequency}
            onChange={(e) => setFrequency(e.target.value as BackupSettingsRow['frequency'])}
            className="w-full rounded-xl border border-border bg-background p-2.5 font-medium"
          >
            <option value="weekly">أسبوعيًا (موصى به)</option>
            <option value="biweekly">كل أسبوعين</option>
            <option value="monthly">شهريًا</option>
            <option value="daily">يوميًا</option>
            <option value="off">مُعطل (إيقاف النسخ التلقائي)</option>
          </select>
        </div>

        {/* Day selection */}
        {['weekly', 'biweekly'].includes(frequency) && (
          <div>
            <label className="font-semibold text-foreground block mb-1.5">يوم التشغيل</label>
            <select
              value={weekday}
              onChange={(e) => setWeekday(Number(e.target.value))}
              className="w-full rounded-xl border border-border bg-background p-2.5 font-medium"
            >
              <option value={5}>الجمعة</option>
              <option value={6}>السبت</option>
              <option value={0}>الأحد</option>
              <option value={1}>الإثنين</option>
              <option value={2}>الثلاثاء</option>
              <option value={3}>الأربعاء</option>
              <option value={4}>الخميس</option>
            </select>
          </div>
        )}

        {frequency === 'monthly' && (
          <div>
            <label className="font-semibold text-foreground block mb-1.5">يوم الشهر</label>
            <input
              type="number"
              min={1}
              max={28}
              value={monthDay}
              onChange={(e) => setMonthDay(Number(e.target.value))}
              className="w-full rounded-xl border border-border bg-background p-2.5 font-medium"
            />
          </div>
        )}

        {/* Hour */}
        {frequency !== 'off' && (
          <div>
            <label className="font-semibold text-foreground block mb-1.5">الساعة (بالتوقيت المحلي)</label>
            <select
              value={hourLocal}
              onChange={(e) => setHourLocal(Number(e.target.value))}
              className="w-full rounded-xl border border-border bg-background p-2.5 font-medium"
            >
              {Array.from({ length: 24 }, (_, i) => (
                <option key={i} value={i}>
                  {i === 0 ? '12 منتصف الليل' : i < 12 ? `${i}:00 صباحًا` : i === 12 ? '12 ظهرًا' : `${i - 12}:00 مساءً`}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Format */}
        <div>
          <label className="font-semibold text-foreground block mb-1.5">صيغة النسخة</label>
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value as BackupSettingsRow['format'])}
            className="w-full rounded-xl border border-border bg-background p-2.5 font-medium"
          >
            <option value="xlsx">Excel (.xlsx) - منسق</option>
            <option value="csv_zip">CSV في أرشيف مضغوط (.zip)</option>
            <option value="json">JSON (.json) - برمجي</option>
          </select>
        </div>

        {/* Retention */}
        <div>
          <label className="font-semibold text-foreground block mb-1.5">الاحتفاظ بآخر</label>
          <select
            value={keepLast}
            onChange={(e) => setKeepLast(Number(e.target.value))}
            className="w-full rounded-xl border border-border bg-background p-2.5 font-medium"
          >
            <option value={4}>آخر 4 نسخ</option>
            <option value={8}>آخر 8 نسخ (موصى به)</option>
            <option value={12}>آخر 12 نسخة</option>
            <option value={24}>آخر 24 نسخة</option>
          </select>
        </div>
      </div>

      {/* Notification options */}
      <div className="pt-2 border-t border-border/60 space-y-3">
        <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
          <Bell className="size-3.5 text-primary" />
          <span>قنوات التنبيه عند جهوزية النسخة:</span>
        </span>

        <div className="flex flex-wrap items-center gap-6 text-xs">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={notifyInapp}
              onChange={(e) => setNotifyInapp(e.target.checked)}
              className="rounded border-border text-primary focus:ring-primary"
            />
            <span className="font-medium">شريط تنبيه داخل التطبيق</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={notifyPush}
              onChange={(e) => setNotifyPush(e.target.checked)}
              className="rounded border-border text-primary focus:ring-primary"
            />
            <span className="font-medium">إشعار المتصفح (Web Push)</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={notifyEmail}
              onChange={(e) => setNotifyEmail(e.target.checked)}
              className="rounded border-border text-primary focus:ring-primary"
            />
            <span className="font-medium">رسالة إلى البريد الإلكتروني</span>
          </label>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        {isSaved && (
          <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
            <Check className="size-4" />
            <span>تم حفظ الجدولة بنجاح</span>
          </span>
        )}
        <Button
          size="sm"
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="font-bold px-5"
        >
          {saveMutation.isPending && <Loader2 className="size-4 animate-spin me-1.5" />}
          حفظ إعدادات الجدولة
        </Button>
      </div>
    </div>
  );
}

export function BackupScheduleCard() {
  const supabase = createClient();

  const { data: settings, isLoading, refetch } = useQuery({
    queryKey: ['backup_settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('backup_settings')
        .select('*')
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data as BackupSettingsRow | null;
    },
  });

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 flex items-center justify-center py-12 text-muted-foreground text-xs gap-2">
        <Loader2 className="size-4 animate-spin text-primary" />
        <span>جارِ تحميل إعدادات الجدولة…</span>
      </div>
    );
  }

  return (
    <BackupScheduleForm
      key={settings ? `${settings.frequency}-${settings.weekday}-${settings.hour_local}` : 'initial'}
      settings={settings ?? null}
      onRefetch={refetch}
    />
  );
}
