import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  try {
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    return reg;
  } catch {
    return null;
  }
}

export async function requestPushPermissionAndSubscribe(
  vapidPublicKey: string,
  supabase: SupabaseClient<Database>
): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window) || !('serviceWorker' in navigator)) {
    return false;
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    return false;
  }

  const reg = await navigator.serviceWorker.ready;
  if (!reg.pushManager) return false;

  try {
    const existingSub = await reg.pushManager.getSubscription();
    const sub =
      existingSub ||
      (await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
      }));

    if (sub) {
      const p256dh = sub.getKey('p256dh');
      const auth = sub.getKey('auth');

      await supabase.from('push_subscriptions').upsert(
        {
          endpoint: sub.endpoint,
          keys: {
            p256dh: p256dh ? arrayBufferToBase64(p256dh) : '',
            auth: auth ? arrayBufferToBase64(auth) : '',
          },
          user_agent: navigator.userAgent,
        },
        { onConflict: 'endpoint' }
      );

      return true;
    }
  } catch {
    // Silent catch on push subscription failure
  }

  return false;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i] || 0);
  }
  return window.btoa(binary);
}
