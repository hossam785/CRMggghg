'use client';

import { useLeadModal } from '../context/lead-modal-context';
import { LeadFormDialog } from './LeadFormDialog';

export function LeadFormDialogGlobal() {
  const { isOpen, setIsOpen } = useLeadModal();
  return <LeadFormDialog open={isOpen} onOpenChange={setIsOpen} />;
}
