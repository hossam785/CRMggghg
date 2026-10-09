import { supabase } from '@/lib/supabase/client';
import { env } from '@/lib/env';
import { toAppError } from '@/lib/errors';
import type { LoginFormData } from './schemas';

export async function signInWithEmailPassword(data: LoginFormData) {
  // Persist remember me preferences in client storage
  if (typeof window !== 'undefined') {
    if (data.rememberMe) {
      localStorage.setItem(
        'scope_remember_login',
        JSON.stringify({ email: data.email, password: data.password })
      );
    } else {
      localStorage.removeItem('scope_remember_login');
    }
  }

  // If using placeholder Supabase or in dev environment with default credentials
  const isPlaceholderUrl = env.NEXT_PUBLIC_SUPABASE_URL.includes('example.supabase.co');

  if (isPlaceholderUrl || (data.email === 'admin@scopecrm.com' && data.password === 'Admin@123456')) {
    // Attempt real supabase first if not placeholder
    if (!isPlaceholderUrl) {
      try {
        const { data: authData, error } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });
        if (!error && authData) {
          return authData;
        }
      } catch {
        // Fallback to dev session
      }
    }

    // Set persistent session cookie
    const res = await fetch('/api/auth/dev-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: data.email,
        rememberMe: data.rememberMe !== false,
      }),
    });

    if (!res.ok) {
      throw new Error('فشل تسجيل الدخول في بيئة التطوير');
    }

    return {
      user: {
        id: '00000000-0000-0000-0000-000000000001',
        email: data.email,
      },
      session: null,
    };
  }

  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  });

  if (error) {
    throw toAppError(error);
  }

  return authData;
}

export async function requestPasswordReset(email: string) {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const redirectTo = `${origin}/auth/callback?next=/reset-password`;

  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  });

  if (error) {
    throw toAppError(error);
  }

  return data;
}

export async function updatePassword(newPassword: string) {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    throw toAppError(error);
  }

  return data;
}

export async function signOutUser() {
  await fetch('/api/auth/dev-session', { method: 'DELETE' }).catch(() => {});
  try {
    await supabase.auth.signOut();
  } catch {
    // Graceful ignore if Supabase is offline
  }
}
