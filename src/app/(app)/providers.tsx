'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { TooltipProvider } from '@/components/ui/tooltip';
import { toAppError } from '@/lib/errors';
import { LeadModalProvider } from '@/features/leads/context/lead-modal-context';
import { LeadFormDialogGlobal } from '@/features/leads/components/LeadFormDialogGlobal';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            gcTime: 10 * 60_000,
            refetchOnWindowFocus: true,
            retry: (n, e) => toAppError(e).code === 'NETWORK' && n < 2,
          },
          mutations: {
            retry: 0,
          },
        },
      })
  );

  return (
    <NuqsAdapter>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider delayDuration={200}>
          <LeadModalProvider>
            {children}
            <LeadFormDialogGlobal />
          </LeadModalProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </NuqsAdapter>
  );
}
