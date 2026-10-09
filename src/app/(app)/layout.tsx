import { Providers } from './providers';
import { Sidebar } from '@/components/layout/sidebar';
import { BottomNav } from '@/components/layout/bottom-nav';
import { AppHeader } from '@/components/layout/app-header';
import { Fab } from '@/components/layout/fab';
import { BackupBanner } from '@/features/data-hub/backups/components/BackupBanner';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { ServiceWorkerProvider } from '@/components/pwa/ServiceWorkerProvider';
import { ShortcutsProvider } from '@/lib/shortcuts/ShortcutsContext';
import { ShortcutsHelpModal } from '@/lib/shortcuts/ShortcutsHelpModal';

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <Providers>
      <ServiceWorkerProvider>
        <ShortcutsProvider>
          {/* Global Shortcuts Cheat Sheet Modal */}
          <ShortcutsHelpModal />

          <div className="flex h-screen w-full overflow-hidden bg-background flex-col">
            {/* Global Network Connectivity Alert */}
            <OfflineBanner />

            <div className="flex flex-1 w-full overflow-hidden">
              {/* Desktop Collapsible Sidebar */}
              <Sidebar />

              {/* Main Content Area */}
              <div className="flex flex-1 flex-col overflow-hidden">
                {/* In-app Backup Notification Banner */}
                <BackupBanner />

                {/* Mobile Top Header */}
                <AppHeader />

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 md:pb-8">
                  <div className="mx-auto max-w-7xl">{children}</div>
                </main>

                {/* Mobile Navigation & FAB */}
                <Fab />
                <BottomNav />
              </div>
            </div>
          </div>
        </ShortcutsProvider>
      </ServiceWorkerProvider>
    </Providers>
  );
}
