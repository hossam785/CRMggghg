'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import type { ShortcutGroup } from './types';

interface ShortcutsContextType {
  isHelpOpen: boolean;
  setIsHelpOpen: (open: boolean) => void;
  groups: ShortcutGroup[];
}

const ShortcutsContext = React.createContext<ShortcutsContextType | null>(null);

export function ShortcutsProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isHelpOpen, setIsHelpOpen] = React.useState(false);
  const sequencePrefixRef = React.useRef<{ key: string; time: number } | null>(null);

  const groups: ShortcutGroup[] = React.useMemo(
    () => [
      {
        category: 'navigation',
        titleAr: 'التنقل بين الصفحات',
        titleEn: 'Navigation',
        items: [
          {
            id: 'go-dashboard',
            keys: ['G', 'D'],
            labelAr: 'الذهاب للوحة المعلومات (Dashboard)',
            labelEn: 'Go to Dashboard',
            category: 'navigation',
            action: () => router.push('/'),
          },
          {
            id: 'go-leads',
            keys: ['G', 'L'],
            labelAr: 'الذهاب لقائمة العملاء (Leads)',
            labelEn: 'Go to Leads',
            category: 'navigation',
            action: () => router.push('/leads'),
          },
          {
            id: 'go-followups',
            keys: ['G', 'F'],
            labelAr: 'الذهاب للمتابعات (Follow-ups)',
            labelEn: 'Go to Follow-ups',
            category: 'navigation',
            action: () => router.push('/follow-ups'),
          },
          {
            id: 'go-data',
            keys: ['G', 'B'],
            labelAr: 'مركز البيانات والنسخ الاحتياطي',
            labelEn: 'Data & Backups Hub',
            category: 'navigation',
            action: () => router.push('/data'),
          },
          {
            id: 'go-settings',
            keys: ['G', 'S'],
            labelAr: 'الذهاب للإعدادات (Settings)',
            labelEn: 'Go to Settings',
            category: 'navigation',
            action: () => router.push('/settings'),
          },
        ],
      },
      {
        category: 'actions',
        titleAr: 'الإجراءات العامة',
        titleEn: 'General Actions',
        items: [
          {
            id: 'focus-search',
            keys: ['/'],
            labelAr: 'التركيز على خانة البحث',
            labelEn: 'Focus Search Bar',
            category: 'actions',
            action: () => {
              const searchInput = document.querySelector<HTMLInputElement>(
                'input[type="search"], input[placeholder*="بحث"], input[placeholder*="Search"]'
              );
              if (searchInput) {
                searchInput.focus();
                searchInput.select();
              }
            },
          },
          {
            id: 'new-lead',
            keys: ['N'],
            labelAr: 'إضافة عميل محتمل جديد',
            labelEn: 'New Lead',
            category: 'actions',
            action: () => router.push('/leads?new=true'),
          },
          {
            id: 'help-shortcuts',
            keys: ['?'],
            labelAr: 'فتح دليل الاختصارات',
            labelEn: 'Show Shortcuts Help',
            category: 'actions',
            action: () => setIsHelpOpen((prev) => !prev),
          },
        ],
      },
      {
        category: 'list',
        titleAr: 'التنقل في الجداول والقوائم',
        titleEn: 'List Navigation',
        items: [
          {
            id: 'list-down',
            keys: ['J'],
            labelAr: 'الانتقال للصف التالي في القائمة',
            labelEn: 'Next Row in List',
            category: 'list',
            action: () => window.dispatchEvent(new CustomEvent('crm:list-next')),
          },
          {
            id: 'list-up',
            keys: ['K'],
            labelAr: 'الانتقال للصف السابق في القائمة',
            labelEn: 'Previous Row in List',
            category: 'list',
            action: () => window.dispatchEvent(new CustomEvent('crm:list-prev')),
          },
          {
            id: 'list-enter',
            keys: ['Enter'],
            labelAr: 'فتح تفاصيل العميل المحدد',
            labelEn: 'Open Selected Lead',
            category: 'list',
            action: () => window.dispatchEvent(new CustomEvent('crm:list-open')),
          },
          {
            id: 'list-action',
            keys: ['E'],
            labelAr: 'تنفيذ الإجراء الرئيسي للعميل',
            labelEn: 'Execute Primary Lead Action',
            category: 'list',
            action: () => window.dispatchEvent(new CustomEvent('crm:list-action')),
          },
        ],
      },
    ],
    [router]
  );

  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Ignore if user is currently typing in an editable field
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      // Ignore if modifier keys (Ctrl/Cmd/Alt) are pressed, unless it's a specific shortcut
      if (e.ctrlKey || e.metaKey || e.altKey) {
        return;
      }

      const key = e.key.toLowerCase();
      const now = Date.now();

      // Check sequence (G then X within 1200ms)
      if (sequencePrefixRef.current && now - sequencePrefixRef.current.time < 1200) {
        const prefix = sequencePrefixRef.current.key;
        sequencePrefixRef.current = null;

        if (prefix === 'g') {
          if (key === 'd') {
            e.preventDefault();
            router.push('/');
            return;
          }
          if (key === 'l') {
            e.preventDefault();
            router.push('/leads');
            return;
          }
          if (key === 'f') {
            e.preventDefault();
            router.push('/follow-ups');
            return;
          }
          if (key === 'b') {
            e.preventDefault();
            router.push('/data');
            return;
          }
          if (key === 's') {
            e.preventDefault();
            router.push('/settings');
            return;
          }
        }
      }

      // Check single keys
      if (key === 'g') {
        sequencePrefixRef.current = { key: 'g', time: now };
        return;
      }

      if (e.key === '?') {
        e.preventDefault();
        setIsHelpOpen((prev) => !prev);
        return;
      }

      if (key === '/') {
        e.preventDefault();
        const searchInput = document.querySelector<HTMLInputElement>(
          'input[type="search"], input[placeholder*="بحث"], input[placeholder*="Search"]'
        );
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
        return;
      }

      if (key === 'n') {
        e.preventDefault();
        router.push('/leads?new=true');
        return;
      }

      if (key === 'j') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('crm:list-next'));
        return;
      }

      if (key === 'k') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('crm:list-prev'));
        return;
      }

      if (key === 'e') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('crm:list-action'));
        return;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  return (
    <ShortcutsContext.Provider value={{ isHelpOpen, setIsHelpOpen, groups }}>
      {children}
    </ShortcutsContext.Provider>
  );
}

export function useShortcuts() {
  const context = React.useContext(ShortcutsContext);
  if (!context) {
    throw new Error('useShortcuts must be used within a ShortcutsProvider');
  }
  return context;
}
