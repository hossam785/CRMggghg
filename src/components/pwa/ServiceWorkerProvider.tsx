'use client';

import * as React from 'react';
import { RefreshCw, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ServiceWorkerProvider({ children }: { children: React.ReactNode }) {
  const [waitingWorker, setWaitingWorker] = React.useState<ServiceWorker | null>(null);
  const [showUpdate, setShowUpdate] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    navigator.serviceWorker.register('/sw.js').then((reg) => {
      // Check if there's already a waiting worker
      if (reg.waiting) {
        setWaitingWorker(reg.waiting);
        setShowUpdate(true);
      }

      // Listen for new worker installing
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            setWaitingWorker(newWorker);
            setShowUpdate(true);
          }
        });
      });
    }).catch(() => {
      // Ignore registration errors
    });

    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
  }, []);

  const handleUpdate = () => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    }
  };

  return (
    <>
      {showUpdate && (
        <div className="bg-primary text-primary-foreground py-2.5 px-4 text-xs font-bold shadow-md flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 shrink-0" />
            <span>يتوفر إصدار أحدث من التطبيق. قم بالتحديث للحصول على أحدث التحسينات.</span>
          </div>

          <Button
            size="sm"
            variant="secondary"
            onClick={handleUpdate}
            className="h-7 text-xs font-bold bg-white text-primary hover:bg-white/90"
          >
            <RefreshCw className="size-3.5 me-1.5" />
            تحديث الآن
          </Button>
        </div>
      )}
      {children}
    </>
  );
}
