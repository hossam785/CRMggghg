'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Loader2, KeyRound } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { safeNext } from '@/lib/safe-next';
import { AppError } from '@/lib/errors';
import { signInWithEmailPassword, requestPasswordReset } from '../api';
import {
  loginSchema,
  forgotPasswordSchema,
  type LoginFormData,
  type ForgotPasswordFormData,
} from '../schemas';

export function LoginForm() {
  const t = useTranslations('auth');
  const tErrors = useTranslations('errors');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const searchParams = useSearchParams();

  const [showPassword, setShowPassword] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const {
    register: registerForgot,
    handleSubmit: handleForgotSubmit,
    reset: resetForgotForm,
    formState: { errors: forgotErrors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setFormError(null);
    try {
      await signInWithEmailPassword(data);
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

  const onForgotPasswordSubmit = async (data: ForgotPasswordFormData) => {
    setIsSendingReset(true);
    try {
      await requestPasswordReset(data.email);
      toast.success(tCommon('saved'));
      setIsForgotPasswordOpen(false);
      resetForgotForm();
    } catch (err: unknown) {
      if (err instanceof AppError && err.code === 'RATE_LIMITED') {
        toast.error(tErrors('RATE_LIMITED'));
      } else {
        toast.error(tErrors('UNKNOWN'));
      }
    } finally {
      setIsSendingReset(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {formError && (
          <div
            role="alert"
            className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm font-medium text-red-600 dark:text-red-400"
          >
            {formError}
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="login-email">{t('email')}</Label>
          <Input
            id="login-email"
            type="email"
            autoComplete="username"
            placeholder={t('emailPlaceholder')}
            disabled={isSubmitting}
            aria-invalid={!!errors.email}
            {...register('email')}
          />
          {errors.email && (
            <p className="text-xs text-red-600 dark:text-red-400">
              {tErrors('VALIDATION')}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="login-password">{t('password')}</Label>
            <button
              type="button"
              onClick={() => setIsForgotPasswordOpen(true)}
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              {t('forgotPassword')}
            </button>
          </div>
          <div className="relative">
            <Input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder={t('passwordPlaceholder')}
              disabled={isSubmitting}
              className="pe-10"
              aria-invalid={!!errors.password}
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute inset-y-0 end-0 flex items-center pe-3 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-red-600 dark:text-red-400">
              {tErrors('VALIDATION')}
            </p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full gap-2 font-medium"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              <span>{t('signingIn')}</span>
            </>
          ) : (
            <span>{t('signIn')}</span>
          )}
        </Button>
      </form>

      {/* Forgot Password Dialog */}
      <Dialog open={isForgotPasswordOpen} onOpenChange={setIsForgotPasswordOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="mb-2 flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <KeyRound className="size-5" />
            </div>
            <DialogTitle>{t('forgotPassword')}</DialogTitle>
            <DialogDescription>{t('resetPassword')}</DialogDescription>
          </DialogHeader>

          <form
            onSubmit={handleForgotSubmit(onForgotPasswordSubmit)}
            className="mt-4 space-y-4"
          >
            <div className="space-y-1.5">
              <Label htmlFor="forgot-email">{t('email')}</Label>
              <Input
                id="forgot-email"
                type="email"
                autoComplete="email"
                placeholder={t('emailPlaceholder')}
                disabled={isSendingReset}
                {...registerForgot('email')}
              />
              {forgotErrors.email && (
                <p className="text-xs text-red-600 dark:text-red-400">
                  {tErrors('VALIDATION')}
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                disabled={isSendingReset}
                onClick={() => setIsForgotPasswordOpen(false)}
              >
                {tCommon('cancel')}
              </Button>
              <Button type="submit" disabled={isSendingReset} className="gap-2">
                {isSendingReset && <Loader2 className="size-4 animate-spin" />}
                <span>{t('resetPassword')}</span>
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
