'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updatePassword } from '../api';
import { resetPasswordSchema, type ResetPasswordFormData } from '../schemas';

export function ResetPasswordForm() {
  const t = useTranslations('auth');
  const tErrors = useTranslations('errors');
  const tCommon = useTranslations('common');
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    setFormError(null);
    try {
      await updatePassword(data.password);
      toast.success(tCommon('saved'));
      router.push('/');
      router.refresh();
    } catch {
      setFormError(tErrors('UNKNOWN'));
    }
  };

  return (
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
        <Label htmlFor="reset-password">{t('newPassword')}</Label>
        <div className="relative">
          <Input
            id="reset-password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
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

      <div className="space-y-1.5">
        <Label htmlFor="reset-confirm-password">{t('confirmPassword')}</Label>
        <div className="relative">
          <Input
            id="reset-confirm-password"
            type={showConfirmPassword ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder={t('passwordPlaceholder')}
            disabled={isSubmitting}
            className="pe-10"
            aria-invalid={!!errors.confirmPassword}
            {...register('confirmPassword')}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
            className="absolute inset-y-0 end-0 flex items-center pe-3 text-muted-foreground hover:text-foreground"
          >
            {showConfirmPassword ? (
              <EyeOff className="size-4" />
            ) : (
              <Eye className="size-4" />
            )}
          </button>
        </div>
        {errors.confirmPassword && (
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
            <span>{tCommon('saving')}</span>
          </>
        ) : (
          <span>{t('resetPassword')}</span>
        )}
      </Button>
    </form>
  );
}
