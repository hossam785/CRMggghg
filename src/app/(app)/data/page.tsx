import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { DownloadTemplateButton } from '@/features/data-hub/template/DownloadTemplateButton';
import { DataHubExportsCard } from '@/features/data-hub/components/DataHubExportsCard';
import { Upload, ShieldCheck, Sparkles } from 'lucide-react';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('nav');
  return {
    title: `${t('data')} · Scope CRM`,
  };
}

export default async function DataPage() {
  const t = await getTranslations('data');
  const tNav = await getTranslations('nav');

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16 px-4 sm:px-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          {tNav('data')}
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          إدارة وتصدير بيانات النظام، تحميل نماذج الاستيراد، والنسخ الاحتياطي
        </p>
      </div>

      <div className="space-y-6">
        {/* 1. Excel Template Download Card */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary">
                <Sparkles className="size-3.5" />
                <span>نموذج جاهز مع قوائم منسدلة حية</span>
              </div>
              <h2 className="text-lg font-extrabold tracking-tight text-foreground">
                {t('downloadTemplate')}
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {t('downloadTemplateDesc')}
              </p>
            </div>

            <DownloadTemplateButton
              variant="primary"
              size="md"
              className="shrink-0 self-start sm:self-center shadow-2xs"
            />
          </div>
        </div>

        {/* 2. One-click Exports Card */}
        <DataHubExportsCard />

        {/* 3. Overview Grid of Bulk Import & Scheduled Backups */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Import section */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-2xs flex flex-col justify-between space-y-5">
            <div className="space-y-3">
              <div className="size-11 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <Upload className="size-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold tracking-tight text-foreground">
                  الاستيراد الضخم (Bulk Import)
                </h3>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                  استيراد حتى 200,000 عميل من ملفات Excel أو CSV أو لصق مباشر، مع كشف تلقائي للتكرار ومطابقة الأعمدة الذكية والمراجعة قبل الاعتماد.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-border">
              <Link
                href="/data/import"
                className="inline-flex items-center justify-center text-xs font-bold rounded-full px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground transition-all shadow-2xs"
              >
                بدء استيراد جديد
              </Link>
              <Link
                href="/data/imports"
                className="inline-flex items-center justify-center text-xs font-semibold rounded-full px-3.5 py-2 border border-border bg-card hover:bg-muted/40 text-muted-foreground hover:text-foreground transition-all shadow-2xs"
              >
                سجل العمليات السابقة
              </Link>
            </div>
          </div>

          {/* Backup section */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-2xs flex flex-col justify-between space-y-5">
            <div className="space-y-3">
              <div className="size-11 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <ShieldCheck className="size-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold tracking-tight text-foreground">
                  النسخ الاحتياطي التلقائي (Backups)
                </h3>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                  جدولة أسبوعية أو شهرية للنسخ الاحتياطي المشفر، تنزيل الأرشيفات، واسترجاع قاعدة البيانات بضغطة واحدة.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-border">
              <Link
                href="/data/backups"
                className="inline-flex items-center justify-center text-xs font-bold rounded-full px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-2xs"
              >
                إدارة الجدولة والأرشيف
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
