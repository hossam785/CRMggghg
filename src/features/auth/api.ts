import { supabase } from '@/lib/supabase/client';
import { toAppError } from '@/lib/errors';
import type { LoginFormData } from './schemas';

export async function signInWithEmailPassword(data: LoginFormData) {
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
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw toAppError(error);
  }
}
