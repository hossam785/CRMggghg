'use client';

import { useTranslations } from 'next-intl';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLeadModal } from '@/features/leads/context/lead-modal-context';

export interface FabProps {
  onClick?: () => void;
}

export function Fab({ onClick }: FabProps) {
  const t = useTranslations('nav');
  const leadModal = useLeadModal();

  const handleClick = onClick ?? leadModal.openCreateLead;

  return (
    <div className="md:hidden fixed bottom-20 end-4 z-40">
      <Button
        onClick={handleClick}
        size="icon"
        aria-label={t('newLead')}
        className="size-13 rounded-full shadow-lg shadow-primary/25 hover:shadow-xl transition-transform active:scale-95"
      >
        <Plus className="size-6 stroke-[2]" />
      </Button>
    </div>
  );
}
