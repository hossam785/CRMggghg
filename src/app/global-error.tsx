'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="ar" dir="rtl" className="dark">
      <body className="flex min-h-screen flex-col items-center justify-center p-6 text-center font-sans antialiased bg-background text-foreground">
        <div className="max-w-md space-y-4">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">حدث خطأ غير متوقع</h1>
          <p className="text-sm text-muted-foreground">
            واجه النظام مشكلة أثناء معالجة طلبك، تم إرسال تقرير بالخطأ للفحص.
          </p>
          <button
            onClick={() => reset()}
            className="rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-all shadow-xs"
          >
            إعادة المحاولة
          </button>
        </div>
      </body>
    </html>
  );
}
