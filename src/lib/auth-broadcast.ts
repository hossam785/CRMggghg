'use client';

/**
 * Cross-tab authentication synchronization using BroadcastChannel with localStorage fallback.
 * Ensures that when a user logs in or out in one tab, all other active tabs immediately react.
 */

export type AuthSyncEvent = {
  type: 'SIGNED_IN' | 'SIGNED_OUT';
  reason?: string;
  timestamp: number;
};

const CHANNEL_NAME = 'scope_crm_auth_sync';
const STORAGE_KEY = 'scope_crm_auth_sync_event';

export function broadcastAuthEvent(event: Omit<AuthSyncEvent, 'timestamp'>): void {
  if (typeof window === 'undefined') return;

  const payload: AuthSyncEvent = {
    ...event,
    timestamp: Date.now(),
  };

  // 1. Modern BroadcastChannel
  try {
    if ('BroadcastChannel' in window) {
      const channel = new BroadcastChannel(CHANNEL_NAME);
      channel.postMessage(payload);
      channel.close();
    }
  } catch {
    // Graceful fallback
  }

  // 2. LocalStorage StorageEvent fallback (fires in all other tabs)
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore storage quota or private browsing errors
  }
}

export function subscribeAuthBroadcast(
  callback: (event: AuthSyncEvent) => void
): () => void {
  if (typeof window === 'undefined') return () => {};

  let channel: BroadcastChannel | null = null;

  // Handler for BroadcastChannel
  const handleChannelMessage = (e: MessageEvent<AuthSyncEvent>) => {
    if (e.data && (e.data.type === 'SIGNED_IN' || e.data.type === 'SIGNED_OUT')) {
      callback(e.data);
    }
  };

  try {
    if ('BroadcastChannel' in window) {
      channel = new BroadcastChannel(CHANNEL_NAME);
      channel.addEventListener('message', handleChannelMessage);
    }
  } catch {
    channel = null;
  }

  // Handler for StorageEvent fallback
  const handleStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue) as AuthSyncEvent;
        if (parsed.type === 'SIGNED_IN' || parsed.type === 'SIGNED_OUT') {
          callback(parsed);
        }
      } catch {
        // Ignore JSON parse error
      }
    }
  };

  window.addEventListener('storage', handleStorage);

  return () => {
    if (channel) {
      channel.removeEventListener('message', handleChannelMessage);
      channel.close();
    }
    window.removeEventListener('storage', handleStorage);
  };
}
