'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Zap,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { useLocale } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { safeNext } from '@/lib/safe-next';
import { AppError } from '@/lib/errors';
import { signInWithEmailPassword } from '../api';
import { loginSchema, type LoginFormData } from '../schemas';

const DEFAULT_EMAIL = 'admin@scopecrm.com';
const DEFAULT_PASSWORD = 'Admin@123456';

export function LoginForm() {
  const t = useTranslations('auth');
  const tErrors = useTranslations('errors');
  const locale = useLocale();
  const isRtl = locale === 'ar';
  const router = useRouter();
  const searchParams = useSearchParams();

  const [showPassword, setShowPassword] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [rememberMe, setRememberMe] = React.useState(true);
  const [isDemoSubmitting, setIsDemoSubmitting] = React.useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: DEFAULT_EMAIL,
      password: DEFAULT_PASSWORD,
      rememberMe: true,
    },
  });

  // Restore saved credentials if available
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem('scope_remember_login');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.email) setValue('email', parsed.email);
        if (parsed?.password) setValue('password', parsed.password);
      }
    } catch {
      // ignore storage error
    }
  }, [setValue]);

  // Handle URL errors and redirect reasons (Pillar 2: Smart Error Handling)
  React.useEffect(() => {
    const errorParam = searchParams.get('error');
    const reasonParam = searchParams.get('reason');
    const key = errorParam || reasonParam;

    if (key) {
      try {
        const translated = t(`callbackErrors.${key}` as any);
        if (translated && !translated.startsWith('auth.callbackErrors')) {
          setFormError(translated);
          return;
        }
      } catch {
        // ignore fallback
      }

      if (key === 'multi_tab_signout') {
        setFormError(
          isRtl
            ? 'تم تسجيل الخروج من نافذة أخرى للحفاظ على أمان بياناتك.'
            : 'You were signed out from another tab to keep your session secure.'
        );
      } else if (key === 'session_expired') {
        setFormError(
          isRtl
            ? 'انتهت صلاحية جلستك السابقة لدواعي الأمان، يرجى تسجيل الدخول مجدداً.'
            : 'Your session has expired for security reasons. Please sign in again.'
        );
      } else if (key === 'auth_callback_failed' || key === 'code_exchange_failed') {
        setFormError(
          isRtl
            ? 'انتهت صلاحية جلسة التحقق أو تم استخدام الرابط مسبقاً.'
            : 'Verification link has expired or has already been used.'
        );
      } else if (key === 'access_denied') {
        setFormError(
          isRtl
            ? 'تم إلغاء عملية تسجيل الدخول أو رفض الصلاحية.'
            : 'Sign in was cancelled or access was denied.'
        );
      }
    }
  }, [searchParams, t, isRtl]);

  const onSubmit = async (data: LoginFormData) => {
    setFormError(null);
    try {
      await signInWithEmailPassword({ ...data, rememberMe });
      const rawNext = searchParams.get('next');
      const target = safeNext(rawNext);
      router.push(target);
      router.refresh();
    } catch (err: unknown) {
      if (err instanceof AppError) {
        if (err.code === 'RATE_LIMITED') {
          setFormError(tErrors('RATE_LIMITED'));
          return;
        }
      }
      setFormError(t('invalidCredentials'));
    }
  };

  // Instant 1-click Demo Login
  const handleQuickDemoLogin = async () => {
    setFormError(null);
    setIsDemoSubmitting(true);
    setValue('email', DEFAULT_EMAIL);
    setValue('password', DEFAULT_PASSWORD);

    try {
      await signInWithEmailPassword({
        email: DEFAULT_EMAIL,
        password: DEFAULT_PASSWORD,
        rememberMe: true,
      });
      const rawNext = searchParams.get('next');
      const target = safeNext(rawNext);
      router.push(target);
      router.refresh();
    } catch {
      setFormError(t('invalidCredentials'));
      setIsDemoSubmitting(false);
    }
  };

  const isPending = isSubmitting || isDemoSubmitting;
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  return (
    <div className="space-y-5">
      {/* 1-Click Quick Demo Access Pill (Relate Card + Ghost Outline Pill Button) */}
      <div className="rounded-2xl border border-stone-divider bg-surface-card p-3.5 shadow-xs transition-all hover:border-royal-signal/40">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-lavender-wash text-royal-signal shadow-xs">
              <Zap className="size-4 fill-royal-signal/20 text-royal-signal" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-midnight-ink">
                {t('quickDemoLogin')}
              </p>
              <p className="text-[11px] text-ash-helper truncate">
                {t('quickDemoDesc')}
              </p>
            </div>
          </div>

          {/* Relate Ghost Outline Pill Button */}
          <button
            type="button"
            disabled={isPending}
            onClick={handleQuickDemoLogin}
            className="shrink-0 inline-flex items-center gap-1.5 rounded-full border border-royal-signal bg-surface-card hover:bg-lavender-wash text-royal-signal px-3.5 py-1.5 text-xs font-semibold shadow-none transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
          >
            {isDemoSubmitting ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <>
                <span>دخول فوري</span>
                <ArrowIcon className="size-3" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Divider */}
      <div className="relative flex items-center justify-center">
        <div className="w-full border-t border-stone-divider" />
        <span className="absolute bg-snow-canvas px-3 text-[11px] font-medium text-ash-helper uppercase tracking-wider">
          {isRtl ? 'أو بالحساب الشخصي' : 'Or with your account'}
        </span>
      </div>

      {/* Main Login Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {formError && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-xl border border-coral-lost/30 bg-coral-lost/10 p-3 text-xs font-medium text-coral-lost animate-in fade-in zoom-in-95 duration-200"
          >
            <AlertCircle className="size-4 shrink-0 mt-0.5" />
            <span className="flex-1 leading-relaxed">{formError}</span>
            <button
              type="button"
              onClick={() => setFormError(null)}
              className="text-coral-lost/70 hover:text-coral-lost text-xs font-bold px-1 transition-colors cursor-pointer"
              aria-label="Dismiss error"
            >
              ×
            </button>
          </div>
        )}

        {/* Email Field */}
        <div className="space-y-1.5">
          <Label htmlFor="login-email" className="text-xs font-semibold text-graphite-body">
            {t('email')}
          </Label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3.5 text-ash-helper">
              <Mail className="size-4" />
            </div>
            <Input
              id="login-email"
              type="email"
              autoComplete="username"
              placeholder={t('emailPlaceholder')}
              disabled={isPending}
              className="ps-10 h-11 text-sm bg-surface-card border-stone-divider text-graphite-body placeholder:text-ash-helper focus-visible:border-royal-signal focus-visible:ring-azure-focus/30 transition-all rounded-xl"
              invalid={!!errors.email}
              {...register('email')}
            />
          </div>
          {errors.email && (
            <p className="text-[11px] font-medium text-coral-lost">
              {tErrors('VALIDATION')}
            </p>
          )}
        </div>

        {/* Password Field */}
        <div className="space-y-1.5">
          <Label htmlFor="login-password" className="text-xs font-semibold text-graphite-body">
            {t('password')}
          </Label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3.5 text-ash-helper">
              <Lock className="size-4" />
            </div>
            <Input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder={t('passwordPlaceholder')}
              disabled={isPending}
              className="ps-10 pe-10 h-11 text-sm bg-surface-card border-stone-divider text-graphite-body placeholder:text-ash-helper focus-visible:border-royal-signal focus-visible:ring-azure-focus/30 transition-all rounded-xl font-mono"
              invalid={!!errors.password}
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute inset-y-0 end-0 flex items-center pe-3.5 text-ash-helper hover:text-midnight-ink transition-colors cursor-pointer"
            >
              {showPassword ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-[11px] font-medium text-coral-lost">
              {tErrors('VALIDATION')}
            </p>
          )}
        </div>

        {/* Remember Me & Security Notice */}
        <div className="flex items-center justify-between pt-1">
          <label
            htmlFor="login-remember"
            className="flex items-center gap-2 cursor-pointer select-none text-xs font-medium text-slate-caption hover:text-midnight-ink transition-colors"
          >
            <Checkbox
              id="login-remember"
              checked={rememberMe}
              onCheckedChange={(checked) => setRememberMe(Boolean(checked))}
            />
            <span>{t('rememberMe')}</span>
          </label>

          <span className="text-[11px] text-ash-helper font-medium inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-mint-win inline-block" />
            <span>{t('securityBadge')}</span>
          </span>
        </div>

        {/* Submit Button (Relate Pill Button in Royal Signal) */}
        <Button
          type="submit"
          size="lg"
          variant="primary"
          className="w-full h-11 rounded-full text-sm font-semibold bg-royal-signal text-white hover:bg-royal-signal/90 hover:shadow-md transition-all active:scale-[0.99] gap-2 cursor-pointer shadow-xs"
          disabled={isPending}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              <span>{t('signingIn')}</span>
            </>
          ) : (
            <>
              <span>{t('signIn')}</span>
              <ArrowIcon className="size-4 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
