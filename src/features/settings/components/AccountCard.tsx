'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { ShieldCheck, KeyRound, LogOut, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { updatePassword, signOutUser } from '@/features/auth/api';
import { toast } from 'sonner';

export function AccountCard() {
  const t = useTranslations('settings');
  const router = useRouter();

  // Password state
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [passwordError, setPasswordError] = React.useState<string | null>(null);
  const [isUpdatingPassword, setIsUpdatingPassword] = React.useState(false);

  // Sign out state
  const [isSignOutOpen, setIsSignOutOpen] = React.useState(false);
  const [isSigningOut, setIsSigningOut] = React.useState(false);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (newPassword.length < 12) {
      setPasswordError(t('passwordMinLength'));
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError(t('passwordMismatch'));
      return;
    }

    setIsUpdatingPassword(true);
    try {
      await updatePassword(newPassword);
      toast.success(t('passwordUpdated'));
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      setPasswordError('حدث خطأ أثناء تحديث كلمة المرور');
      toast.error('فشل تحديث كلمة المرور');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOutUser();
      router.push('/login');
    } catch {
      toast.error('حدث خطأ أثناء تسجيل الخروج');
      setIsSigningOut(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-6">
      <div className="border-b border-border/60 pb-4">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <ShieldCheck className="size-5 text-primary" />
          {t('account')}
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">{t('accountDesc')}</p>
      </div>

      {/* Change Password Form */}
      <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <KeyRound className="size-4 text-muted-foreground" />
          <span>{t('changePassword')}</span>
        </div>

        {passwordError && (
          <div className="flex items-center gap-2 p-3 text-xs text-destructive bg-destructive/10 rounded-lg">
            <AlertCircle className="size-4 shrink-0" />
            <span>{passwordError}</span>
          </div>
        )}

        <div className="space-y-2">
          <div>
            <Label className="text-xs">{t('newPassword')}</Label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••••••"
              required
              minLength={12}
              className="mt-1 font-mono text-sm"
            />
          </div>

          <div>
            <Label className="text-xs">{t('confirmPassword')}</Label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••••••"
              required
              minLength={12}
              className="mt-1 font-mono text-sm"
            />
          </div>
        </div>

        <Button
          type="submit"
          size="sm"
          disabled={isUpdatingPassword || !newPassword || !confirmPassword}
          className="gap-1.5"
        >
          {isUpdatingPassword && <Loader2 className="size-3.5 animate-spin" />}
          <span>{t('updatePassword')}</span>
        </Button>
      </form>

      {/* Sign Out Section */}
      <div className="border-t border-border/40 pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-foreground">{t('signOut')}</div>
          <p className="text-xs text-muted-foreground mt-0.5">
            إنهاء الجلسة الحالية والعودة لصفحة تسجيل الدخول
          </p>
        </div>

        <Dialog open={isSignOutOpen} onOpenChange={setIsSignOutOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30 gap-1.5 self-start sm:self-auto"
            >
              <LogOut className="size-4" />
              <span>{t('signOut')}</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <LogOut className="size-5" />
                <span>{t('signOut')}</span>
              </DialogTitle>
              <DialogDescription className="pt-2 text-sm text-foreground">
                {t('signOutConfirm')}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsSignOutOpen(false)}
              >
                إلغاء
              </Button>
              <Button
                type="button"
                variant="danger"
                disabled={isSigningOut}
                onClick={handleSignOut}
                className="gap-1.5"
              >
                {isSigningOut && <Loader2 className="size-3.5 animate-spin" />}
                <span>تأكيد الخروج</span>
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
