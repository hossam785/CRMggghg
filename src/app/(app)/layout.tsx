import { Providers } from './providers';
import { Sidebar } from '@/components/layout/sidebar';
import { BottomNav } from '@/components/layout/bottom-nav';
import { AppHeader } from '@/components/layout/app-header';
import { Fab } from '@/components/layout/fab';

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <Providers>
      <div className="flex h-screen w-full overflow-hidden bg-background">
        {/* Desktop Collapsible Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <div className="flex flex-1 flex-col overflow-hidden">
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
    </Providers>
  );
}
