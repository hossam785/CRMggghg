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
    <html lang="ar" dir="rtl">
      <body className="flex min-h-screen flex-col items-center justify-center p-6 text-center font-sans antialiased">
        <div className="max-w-md space-y-4">
          <h1 className="text-2xl font-bold tracking-tight">حدث خطأ غير متوقع</h1>
          <p className="text-sm text-gray-500">
            واجه النظام مشكلة أثناء معالجة طلبك، تم إرسال تقرير بالخطأ للفحص.
          </p>
          <button
            onClick={() => reset()}
            className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 dark:bg-white dark:text-black"
          >
            إعادة المحاولة
          </button>
        </div>
      </body>
    </html>
  );
}
