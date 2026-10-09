import type { Metadata } from 'next';
import { ImportWizard } from '@/features/data-hub/import/components/ImportWizard';

export const metadata: Metadata = {
  title: 'استيراد العملاء | Scope Mini CRM',
  description: 'استيراد جهات الاتصال والعملاء من ملفات Excel و CSV مع التحقق التلقائي',
};

export default function ImportPage() {
  return (
    <div className="container max-w-5xl mx-auto py-8 px-4 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-black text-foreground tracking-tight">
          استيراد العملاء من ملف
        </h1>
        <p className="text-sm text-muted-foreground">
          ارفع ملف Excel أو CSV أو الصق الروابط لتدقيق وإدخال العملاء في النظام مع كشف التكرار التلقائي.
        </p>
      </div>

      <ImportWizard />
    </div>
  );
}
