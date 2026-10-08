'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  LayoutDashboard,
  Users,
  Clock,
  Database,
  Settings,
  Plus,
  PanelLeftClose,
  PanelLeft,
  LogOut,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Kbd } from '@/components/ui/kbd';
import { LanguageToggle } from '@/components/ui/language-toggle';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { signOutUser } from '@/features/auth/api';
import { useLeadModal } from '@/features/leads/context/lead-modal-context';

export interface SidebarProps {
  dueFollowUpsCount?: number;
  onNewLeadClick?: () => void;
}

export function Sidebar({ dueFollowUpsCount = 0, onNewLeadClick }: SidebarProps) {
  const t = useTranslations('nav');
  const tAuth = useTranslations('auth');
  const pathname = usePathname();
  const router = useRouter();
  const leadModal = useLeadModal();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleNewLead = onNewLeadClick ?? leadModal.openCreateLead;

  const navItems = [
    { href: '/', label: t('home'), icon: LayoutDashboard },
    { href: '/leads', label: t('leads'), icon: Users },
    {
      href: '/follow-ups',
      label: t('followUps'),
      icon: Clock,
      badge: dueFollowUpsCount > 0 ? dueFollowUpsCount : null,
    },
    { href: '/data', label: t('data'), icon: Database },
    { href: '/settings', label: t('settings'), icon: Settings },
  ];

  const handleSignOut = async () => {
    try {
      await signOutUser();
      router.push('/login');
      router.refresh();
    } catch {
      router.push('/login');
    }
  };

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col border-e border-border bg-card transition-all duration-200 select-none shrink-0',
        isCollapsed ? 'w-18' : 'w-64'
      )}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between border-b border-border px-4">
        {!isCollapsed && (
          <Link href="/" className="flex items-center gap-2 font-bold text-base tracking-tight text-foreground">
            <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground text-xs font-black">
              S
            </span>
            <span>Scope CRM</span>
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="size-8 text-muted-foreground hover:text-foreground ms-auto"
        >
          {isCollapsed ? (
            <PanelLeft className="size-4 stroke-[1.75]" />
          ) : (
            <PanelLeftClose className="size-4 stroke-[1.75]" />
          )}
        </Button>
      </div>

      {/* Prominent "+ New Lead" Button Slot */}
      <div className="p-3">
        {isCollapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="primary"
                size="icon"
                onClick={handleNewLead}
                className="w-full size-11 rounded-lg"
                aria-label={t('newLead')}
              >
                <Plus className="size-5 stroke-[2]" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" className="flex items-center gap-2">
              <span>{t('newLead')}</span>
              <Kbd>N</Kbd>
            </TooltipContent>
          </Tooltip>
        ) : (
          <Button
            variant="primary"
            onClick={handleNewLead}
            className="w-full justify-between h-10 px-3 font-semibold shadow-xs"
          >
            <div className="flex items-center gap-2">
              <Plus className="size-4 stroke-[2]" />
              <span>{t('newLead')}</span>
            </div>
            <Kbd className="bg-primary-foreground/20 text-primary-foreground border-transparent">
              N
            </Kbd>
          </Button>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1 p-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          const content = (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary font-semibold'
                  : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                isCollapsed && 'justify-center px-0'
              )}
            >
              <Icon className="size-5 shrink-0 stroke-[1.75]" />
              {!isCollapsed && (
                <span className="flex-1 truncate">{item.label}</span>
              )}
              {!isCollapsed && item.badge !== null && (
                <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                  {item.badge}
                </span>
              )}
            </Link>
          );

          if (isCollapsed) {
            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>{content}</TooltipTrigger>
                <TooltipContent side="right" className="flex items-center gap-2">
                  <span>{item.label}</span>
                  {item.badge !== null && (
                    <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] text-primary-foreground">
                      {item.badge}
                    </span>
                  )}
                </TooltipContent>
              </Tooltip>
            );
          }

          return content;
        })}
      </nav>

      {/* Footer: Theme, Lang, SignOut */}
      <div className="border-t border-border p-3 space-y-2">
        <div className={cn('flex items-center', isCollapsed ? 'flex-col gap-2' : 'justify-between')}>
          <ThemeToggle />
          <LanguageToggle />
        </div>

        {isCollapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSignOut}
                aria-label={tAuth('signOut')}
                className="w-full size-9 text-muted-foreground hover:text-red-600 dark:hover:text-red-400"
              >
                <LogOut className="size-4 stroke-[1.75]" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              {tAuth('signOut')}
            </TooltipContent>
          </Tooltip>
        ) : (
          <Button
            variant="ghost"
            onClick={handleSignOut}
            className="w-full justify-start gap-2 h-9 text-xs text-muted-foreground hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400"
          >
            <LogOut className="size-4 stroke-[1.75]" />
            <span>{tAuth('signOut')}</span>
          </Button>
        )}
      </div>
    </aside>
  );
}
