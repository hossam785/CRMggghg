'use client';

import * as React from 'react';
import { WifiOff, Wifi } from 'lucide-react';

function getSnapshot() {
  return navigator.onLine;
}

function getServerSnapshot() {
  return true;
}

function subscribe(callback: () => void) {
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
}

export function OfflineBanner() {
  const isOnline = React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [showRestored, setShowRestored] = React.useState(false);
  const prevOnlineRef = React.useRef(isOnline);

  React.useEffect(() => {
    if (!prevOnlineRef.current && isOnline) {
      setShowRestored(true);
      const timer = setTimeout(() => setShowRestored(false), 3500);
      return () => clearTimeout(timer);
    }
    prevOnlineRef.current = isOnline;
  }, [isOnline]);

  if (isOnline && !showRestored) {
    return null;
  }

  if (showRestored) {
    return (
      <div className="bg-emerald-600 text-white text-xs py-2 px-4 text-center font-bold flex items-center justify-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
        <Wifi className="size-4 shrink-0" />
        <span>تمت استعادة الاتصال بالإنترنت بنجاح.</span>
      </div>
    );
  }

  return (
    <div className="bg-amber-600 dark:bg-amber-700 text-white text-xs py-2.5 px-4 text-center font-bold flex items-center justify-center gap-2 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
      <WifiOff className="size-4 shrink-0" />
      <span>
        أنت غير متصل بالإنترنت حاليًا. يمكنك استعراض الصفحات المحفوظة، لكن عمليات الإضافة والتعديل متوقفة حتى عودة الاتصال.
      </span>
    </div>
  );
}
