'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { LayoutDashboard, Users, Clock, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BottomNavProps {
  dueFollowUpsCount?: number;
}

export function BottomNav({ dueFollowUpsCount = 0 }: BottomNavProps) {
  const t = useTranslations('nav');
  const pathname = usePathname();

  const items = [
    { href: '/', label: t('home'), icon: LayoutDashboard },
    { href: '/leads', label: t('leads'), icon: Users },
    {
      href: '/follow-ups',
      label: t('followUps'),
      icon: Clock,
      badge: dueFollowUpsCount > 0 ? dueFollowUpsCount : null,
    },
    { href: '/settings', label: t('settings'), icon: Settings },
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 inset-x-0 h-16 bg-card/95 backdrop-blur-md border-t border-border z-40 flex items-center justify-around px-2 pb-[env(safe-area-inset-bottom)]"
    >
      {items.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'relative flex flex-col items-center justify-center min-w-[56px] min-h-[44px] py-1 px-2 rounded-lg text-xs font-medium transition-colors select-none',
              isActive
                ? 'text-primary font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <div className="relative">
              <Icon className="size-5 stroke-[1.75]" />
              {item.badge !== null && (
                <span className="absolute -top-1.5 -end-2.5 flex min-w-4 h-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground leading-none">
                  {item.badge}
                </span>
              )}
            </div>
            <span className="mt-1 text-[11px] leading-tight truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
