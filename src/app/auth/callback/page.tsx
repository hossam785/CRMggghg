'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ShieldCheck,
  Loader2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { useLocale } from 'next-intl';
import { safeNext } from '@/lib/safe-next';
import { broadcastAuthEvent } from '@/lib/auth-broadcast';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const isRtl = locale === 'ar';
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  const code = searchParams.get('code');
  const rawNext = searchParams.get('next');
  const target = safeNext(rawNext ?? '/');
  const initialError = searchParams.get('error') || searchParams.get('error_description');

  const [status, setStatus] = React.useState<'verifying' | 'success' | 'error'>(
    initialError ? 'error' : 'verifying'
  );
  const [errorMessage, setErrorMessage] = React.useState<string>(
    initialError
      ? isRtl
        ? 'تم إلغاء عملية التحقق أو رفض الصلاحية من خادم المصادقة.'
        : 'Authentication request was cancelled or denied by the provider.'
      : ''
  );
  const [progress, setProgress] = React.useState(25);

  React.useEffect(() => {
    if (initialError) {
      setStatus('error');
      return;
    }

    if (!code) {
      setStatus('error');
      setErrorMessage(
        isRtl
          ? 'رمز التحقق مفقود من الرابط، يرجى التأكد من سلامة الرابط وإعادة المحاولة.'
          : 'Verification code is missing from this link. Please check and retry.'
      );
      return;
    }

    let isMounted = true;
    setProgress(50);

    const performExchange = async () => {
      try {
        const res = await fetch('/api/auth/callback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, next: target }),
        });

        const data = await res.json();

        if (!isMounted) return;

        if (res.ok && data.success) {
          setProgress(100);
          setStatus('success');
          broadcastAuthEvent({ type: 'SIGNED_IN' });

          // Smooth micro-transition before navigating
          setTimeout(() => {
            router.replace(data.target || target);
            router.refresh();
          }, 600);
        } else {
          setStatus('error');
          const codeReason = data.error;
          if (codeReason === 'code_exchange_failed') {
            setErrorMessage(
              isRtl
                ? 'انتهت صلاحية جلسة التحقق أو تم استخدام الرابط مسبقاً.'
                : 'The verification code has expired or has already been used.'
            );
          } else {
            setErrorMessage(
              data.message ||
                (isRtl
                  ? 'تعذر إتمام التحقق من الجلسة، يرجى تسجيل الدخول مجدداً.'
                  : 'Failed to verify session, please sign in again.')
            );
          }
        }
      } catch {
        if (!isMounted) return;
        setStatus('error');
        setErrorMessage(
          isRtl
            ? 'تعذر الاتصال بخادم المصادقة، يرجى التحقق من الشبكة وإعادة المحاولة.'
            : 'Could not connect to authentication server. Please check your network.'
        );
      }
    };

    performExchange();

    return () => {
      isMounted = false;
    };
  }, [code, initialError, target, router, isRtl]);

  return (
    <main className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-snow-canvas font-sans text-graphite-body antialiased selection:bg-royal-signal/15 selection:text-royal-signal relative overflow-hidden">
      {/* Ambient Radial Glows (Relate Style) */}
      <div className="absolute -top-32 -start-32 size-[450px] rounded-full bg-royal-signal/[0.08] blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-32 -end-32 size-[400px] rounded-full bg-cobalt-glow/[0.06] blur-[120px] pointer-events-none" />

      {/* Floating Centered Handshake Card */}
      <div className="relative z-10 w-full max-w-md rounded-3xl border border-stone-divider bg-surface-card p-7 sm:p-9 shadow-[rgba(0,0,0,0.08)_0px_0.36px_1.8px_-1.4px,rgba(0,0,0,0.07)_0px_1.37px_6.87px_-2.8px,rgba(0,0,0,0.016)_0px_6px_30px_-4.25px] space-y-6 text-center">
        {/* Brand Mark Badge */}
        <div className="flex justify-center">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-royal-signal text-white font-bold text-lg shadow-xs">
            s
          </div>
        </div>

        {/* State 1: Verifying */}
        {status === 'verifying' && (
          <div className="space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="relative mx-auto size-16 flex items-center justify-center rounded-full bg-lavender-wash text-royal-signal">
              <ShieldCheck className="size-8" />
              <div className="absolute inset-0 rounded-full border-2 border-royal-signal/30 border-t-royal-signal animate-spin" />
            </div>

            <div className="space-y-1.5">
              <h1 className="text-xl sm:text-2xl font-semibold tracking-[-0.025em] text-midnight-ink">
                {isRtl ? 'جارِ التحقق وتأمين الجلسة…' : 'Verifying & Securing Session…'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-caption leading-relaxed">
                {isRtl
                  ? 'يتم الآن تأكيد مفتاح الحماية وتجهيز لوحة التحكم بأمان عالي.'
                  : 'Validating security keys and preparing your dashboard.'}
              </p>
            </div>

            {/* Relate Animated Pill Progress Bar */}
            <div className="space-y-2 pt-1">
              <div className="h-1.5 w-full bg-fog-surface rounded-full overflow-hidden">
                <div
                  className="h-full bg-royal-signal rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-ash-helper">
                <span className="inline-flex items-center gap-1">
                  <Lock className="size-3 text-royal-signal" />
                  <span>{isRtl ? 'تشفير PKCE نشط' : 'PKCE Active'}</span>
                </span>
                <span className="font-mono">{progress}%</span>
              </div>
            </div>
          </div>
        )}

        {/* State 2: Success */}
        {status === 'success' && (
          <div className="space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="mx-auto size-16 flex items-center justify-center rounded-full bg-mint-win/10 text-mint-win">
              <CheckCircle2 className="size-8 animate-bounce" />
            </div>

            <div className="space-y-1.5">
              <h1 className="text-xl sm:text-2xl font-semibold tracking-[-0.025em] text-midnight-ink">
                {isRtl ? 'تم التحقق بنجاح!' : 'Session Verified!'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-caption leading-relaxed">
                {isRtl
                  ? 'جارِ نقلك إلى لوحة التحكم فوراً…'
                  : 'Redirecting to your dashboard…'}
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 text-xs font-semibold text-mint-win">
              <Loader2 className="size-3.5 animate-spin" />
              <span>{isRtl ? 'تحميل البيانات…' : 'Loading suite…'}</span>
            </div>
          </div>
        )}

        {/* State 3: Error */}
        {status === 'error' && (
          <div className="space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="mx-auto size-16 flex items-center justify-center rounded-full bg-coral-lost/10 text-coral-lost">
              <AlertCircle className="size-8" />
            </div>

            <div className="space-y-1.5">
              <h1 className="text-xl sm:text-2xl font-semibold tracking-[-0.025em] text-midnight-ink">
                {isRtl ? 'تعذر إتمام التحقق' : 'Verification Incomplete'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-caption leading-relaxed">
                {errorMessage}
              </p>
            </div>

            {/* Relate Ghost Outline Pill CTA to return to login */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => router.push('/login')}
                className="w-full inline-flex items-center justify-center gap-2 rounded-full border border-royal-signal bg-surface-card hover:bg-lavender-wash text-royal-signal px-5 py-2.5 text-sm font-semibold shadow-xs transition-all active:scale-[0.98] cursor-pointer"
              >
                <span>{isRtl ? 'العودة لتسجيل الدخول' : 'Return to Sign In'}</span>
                <ArrowIcon className="size-4" />
              </button>
            </div>
          </div>
        )}

        {/* Footer Security Badge */}
        <div className="pt-3 border-t border-stone-divider/70 flex items-center justify-center gap-1.5 text-[11px] text-ash-helper font-medium">
          <span className="size-2 rounded-full bg-mint-win inline-block" />
          <span>{isRtl ? 'اتصال مؤمن ومشفر بالكامل' : '100% Encrypted Handshake'}</span>
        </div>
      </div>
    </main>
  );
}
