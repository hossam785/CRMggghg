'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';
import { useTranslations } from 'next-intl';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('errors');
  const tCommon = useTranslations('common');

  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center p-6 text-center">
      <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-red-500/10 text-red-600 dark:text-red-400">
        <AlertCircle className="size-6 stroke-[1.75]" />
      </div>

      <h2 className="text-lg font-bold text-foreground">
        {t('UNKNOWN')}
      </h2>
      <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
        يرجى المحاولة مرة أخرى أو التحقق من الاتصال.
      </p>

      <div className="mt-6">
        <Button onClick={() => reset()} className="gap-2">
          <RotateCcw className="size-4" />
          <span>{tCommon('retry')}</span>
        </Button>
      </div>
    </div>
  );
}
