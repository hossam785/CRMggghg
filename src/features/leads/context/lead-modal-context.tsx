'use client';

import * as React from 'react';

interface LeadModalContextValue {
  isOpen: boolean;
  openCreateLead: () => void;
  closeCreateLead: () => void;
  setIsOpen: (open: boolean) => void;
}

const LeadModalContext = React.createContext<LeadModalContextValue | null>(null);

export function LeadModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = React.useState(false);

  const openCreateLead = React.useCallback(() => setIsOpen(true), []);
  const closeCreateLead = React.useCallback(() => setIsOpen(false), []);

  // Global 'N' keyboard shortcut to open new lead dialog
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return;

      // Ignore if user is typing in an editable field or holding modifier keys
      if (e.key === 'n' || e.key === 'N') {
        if (e.metaKey || e.ctrlKey || e.altKey) return;

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

        e.preventDefault();
        setIsOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <LeadModalContext.Provider
      value={{
        isOpen,
        openCreateLead,
        closeCreateLead,
        setIsOpen,
      }}
    >
      {children}
    </LeadModalContext.Provider>
  );
}

export function useLeadModal() {
  const context = React.useContext(LeadModalContext);
  if (!context) {
    throw new Error('useLeadModal must be used within a LeadModalProvider');
  }
  return context;
}
