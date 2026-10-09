'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import {
  GripVertical,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  Loader2,
  Briefcase,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  useAllIndustries,
  useCreateIndustry,
  useUpdateIndustry,
  useReorderIndustries,
  useDeleteIndustry,
} from '../queries';
import { type Industry } from '../api';
import { ExportButton, createIndustriesExportSpec } from '@/features/data-hub/export';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function IndustriesManager() {
  const t = useTranslations('settings');
  const { data: industries = [], isLoading } = useAllIndustries();
  const industriesExportSpec = React.useMemo(() => createIndustriesExportSpec(), []);

  const createMutation = useCreateIndustry();
  const updateMutation = useUpdateIndustry();
  const reorderMutation = useReorderIndustries();
  const deleteMutation = useDeleteIndustry();

  // Add form state
  const [isAdding, setIsAdding] = React.useState(false);
  const [newLabelAr, setNewLabelAr] = React.useState('');
  const [newLabelEn, setNewLabelEn] = React.useState('');

  // Delete / Cannot delete dialog state
  const [deleteTarget, setDeleteTarget] = React.useState<Industry | null>(null);
  const [blockedCount, setBlockedCount] = React.useState<number | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  // Local drag/reorder state
  const [items, setItems] = React.useState<Industry[]>(industries);
  const [prevIndustries, setPrevIndustries] = React.useState(industries);
  if (industries !== prevIndustries) {
    setPrevIndustries(industries);
    setItems(industries);
  }

  // Handle reordering up/down
  const moveItem = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    const newItems = [...items];
    const [moved] = newItems.splice(index, 1);
    if (!moved) return;
    newItems.splice(targetIndex, 0, moved);

    // Recompute sort_order
    const updated = newItems.map((item, idx) => ({
      id: item.id,
      sort_order: (idx + 1) * 10,
    }));

    setItems(newItems.map((item, idx) => ({ ...item, sort_order: (idx + 1) * 10 })));
    reorderMutation.mutate(updated, {
      onSuccess: () => {
        toast.success(t('reorderedSuccess'));
      },
    });
  };

  // Keyboard navigation Alt+Up / Alt+Down
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.altKey && e.key === 'ArrowUp') {
      e.preventDefault();
      moveItem(index, 'up');
    } else if (e.altKey && e.key === 'ArrowDown') {
      e.preventDefault();
      moveItem(index, 'down');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabelAr.trim() || !newLabelEn.trim()) return;

    createMutation.mutate(
      {
        label_ar: newLabelAr.trim(),
        label_en: newLabelEn.trim(),
        sort_order: (items.length + 1) * 10,
      },
      {
        onSuccess: () => {
          setNewLabelAr('');
          setNewLabelEn('');
          setIsAdding(false);
          toast.success('تمت إضافة النشاط بنجاح');
        },
        onError: () => {
          toast.error('فشل إضافة النشاط');
        },
      }
    );
  };

  const handleToggleActive = (ind: Industry) => {
    updateMutation.mutate({
      id: ind.id,
      patch: { is_active: !ind.is_active },
    });
  };

  const handleBlurRename = (
    ind: Industry,
    field: 'label_ar' | 'label_en',
    newVal: string
  ) => {
    const trimmed = newVal.trim();
    if (!trimmed || trimmed === ind[field]) return;

    updateMutation.mutate({
      id: ind.id,
      patch: { [field]: trimmed },
    });
  };

  const handleDeleteRequest = async (ind: Industry) => {
    setDeleteTarget(ind);
    setIsDeleting(true);
    setBlockedCount(null);

    deleteMutation.mutate(ind.id, {
      onSuccess: (res) => {
        setIsDeleting(false);
        if (!res.success) {
          // Blocked by referenced leads!
          setBlockedCount(res.referencedCount);
        } else {
          setDeleteTarget(null);
          toast.success('تم حذف النشاط');
        }
      },
      onError: () => {
        setIsDeleting(false);
        setDeleteTarget(null);
        toast.error('حدث خطأ أثناء الحذف');
      },
    });
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-4 gap-3">
        <div>
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Briefcase className="size-5 text-primary" />
            {t('industries')}
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">{t('industriesDesc')}</p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <ExportButton spec={industriesExportSpec} />
          <Button
            type="button"
            size="sm"
            onClick={() => setIsAdding(!isAdding)}
            className="gap-1.5"
          >
            <Plus className="size-4" />
            <span>{t('addIndustry')}</span>
          </Button>
        </div>
      </div>

      {/* Add New Industry Inline Form */}
      {isAdding && (
        <form
          onSubmit={handleCreate}
          className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3"
        >
          <div className="text-xs font-semibold text-primary">
            {t('addIndustry')}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">{t('industryNameAr')}</Label>
              <Input
                value={newLabelAr}
                onChange={(e) => setNewLabelAr(e.target.value)}
                placeholder="مثال: عقارات، أزياء، تقنية"
                required
                className="mt-1"
                autoFocus
              />
            </div>
            <div>
              <Label className="text-xs">{t('industryNameEn')}</Label>
              <Input
                value={newLabelEn}
                onChange={(e) => setNewLabelEn(e.target.value)}
                placeholder="e.g. Real Estate, Fashion, Tech"
                required
                className="mt-1 font-mono text-xs"
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsAdding(false)}
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={createMutation.isPending || !newLabelAr || !newLabelEn}
            >
              {createMutation.isPending && (
                <Loader2 className="me-1.5 size-3.5 animate-spin" />
              )}
              حفظ النشاط
            </Button>
          </div>
        </form>
      )}

      {/* Industries List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8 text-muted-foreground text-sm gap-2">
          <Loader2 className="size-4 animate-spin" />
          <span>جارِ التحميل…</span>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-8 text-sm text-muted-foreground border border-dashed rounded-xl">
          لا توجد أنشطة مسجلة
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((ind, idx) => (
            <div
              key={ind.id}
              tabIndex={0}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              className={cn(
                'group flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-xl border transition-all focus:outline-none focus:ring-1 focus:ring-primary',
                ind.is_active
                  ? 'border-border bg-background'
                  : 'border-border/40 bg-muted/20 opacity-60'
              )}
            >
              {/* Drag handle & Up/Down reorder controls */}
              <div className="flex items-center gap-1 shrink-0 text-muted-foreground">
                <GripVertical className="size-4 cursor-grab text-muted-foreground/60 group-hover:text-foreground" />
                <div className="flex flex-col">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => moveItem(idx, 'up')}
                    aria-label="نقل لأعلى (Alt+↑)"
                    className="p-0.5 hover:text-foreground disabled:opacity-20"
                  >
                    <ArrowUp className="size-3" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === items.length - 1}
                    onClick={() => moveItem(idx, 'down')}
                    aria-label="نقل لأسفل (Alt+↓)"
                    className="p-0.5 hover:text-foreground disabled:opacity-20"
                  >
                    <ArrowDown className="size-3" />
                  </button>
                </div>
              </div>

              {/* Editable Arabic & English names */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1">
                <Input
                  defaultValue={ind.label_ar}
                  onBlur={(e) => handleBlurRename(ind, 'label_ar', e.target.value)}
                  placeholder={t('industryNameAr')}
                  className="h-8 text-xs font-medium"
                />
                <Input
                  defaultValue={ind.label_en}
                  onBlur={(e) => handleBlurRename(ind, 'label_en', e.target.value)}
                  placeholder={t('industryNameEn')}
                  className="h-8 text-xs font-mono text-muted-foreground"
                />
              </div>

              {/* Status toggle & Actions */}
              <div className="flex items-center justify-end gap-1.5 shrink-0 pt-2 sm:pt-0">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleToggleActive(ind)}
                  aria-label={ind.is_active ? t('industryVisible') : t('industryHidden')}
                  title={ind.is_active ? t('industryVisible') : t('industryHidden')}
                  className="size-8 text-muted-foreground hover:text-foreground"
                >
                  {ind.is_active ? (
                    <Eye className="size-4 text-primary" />
                  ) : (
                    <EyeOff className="size-4 text-muted-foreground" />
                  )}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={ind.is_other || isDeleting}
                  onClick={() => handleDeleteRequest(ind)}
                  aria-label={t('delete')}
                  className="size-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Blocked Deletion Dialog when leads reference this industry */}
      <Dialog
        open={blockedCount !== null}
        onOpenChange={(open) => !open && setBlockedCount(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="size-5" />
              <span>لا يمكن حذف هذا النشاط</span>
            </DialogTitle>
            <DialogDescription className="pt-2 text-sm text-foreground">
              {t('cannotDeleteReferenced', { count: blockedCount ?? 0 })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setBlockedCount(null)}
            >
              إغلاق
            </Button>
            {deleteTarget && (
              <Button
                type="button"
                onClick={() => {
                  if (deleteTarget) {
                    handleToggleActive(deleteTarget);
                    setBlockedCount(null);
                    setDeleteTarget(null);
                    toast.success('تم إخفاء النشاط بنجاح');
                  }
                }}
              >
                إخفاء النشاط الآن
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
