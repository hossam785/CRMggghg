import type { Metadata } from 'next';
import Link from 'next/link';
import { Upload } from 'lucide-react';
import { ImportWizard } from '@/features/data-hub/import/components/ImportWizard';

export const metadata: Metadata = {
  title: 'استيراد العملاء | Scope Mini CRM',
  description: 'استيراد جهات الاتصال والعملاء من ملفات Excel و CSV مع التحقق التلقائي',
};

export default function ImportPage() {
  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      <div className="space-y-1.5 border-b border-border pb-5">
        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
          <Link href="/data" className="hover:text-primary transition-colors">
            مركز البيانات
          </Link>
          <span>/</span>
          <span>استيراد العملاء</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
          <div className="size-9 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Upload className="size-5" />
          </div>
          <span>استيراد العملاء من ملف</span>
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          ارفع ملف Excel أو CSV أو الصق الروابط لتدقيق وإدخال العملاء في النظام مع كشف التكرار التلقائي.
        </p>
      </div>

      <ImportWizard />
    </div>
  );
}
