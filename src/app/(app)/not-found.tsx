import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { FileQuestion, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default async function NotFound() {
  const tNav = await getTranslations('nav');

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center p-6 text-center">
      <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <FileQuestion className="size-6 stroke-[1.75]" />
      </div>

      <h2 className="text-lg font-bold text-foreground">
        الصفحة غير موجودة (404)
      </h2>
      <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
        الصفحة التي تبحث عنها غير متوفرة أو تم نقلها.
      </p>

      <div className="mt-6">
        <Button asChild className="gap-2">
          <Link href="/">
            <ArrowLeft className="size-4 rtl:-scale-x-100" />
            <span>{tNav('home')}</span>
          </Link>
        </Button>
      </div>
    </div>
  );
}
