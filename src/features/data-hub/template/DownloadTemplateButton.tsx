'use client';

import * as React from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { FileSpreadsheet, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIndustries, useCountries } from '@/features/leads/queries';
import { buildTemplateWorkbook } from './build-template';
import { triggerFileDownload } from '../export/run-export';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export interface DownloadTemplateButtonProps {
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export function DownloadTemplateButton({
  className,
  variant = 'outline',
  size = 'sm',
}: DownloadTemplateButtonProps) {
  const t = useTranslations('data');
  const locale = useLocale() as 'ar' | 'en';
  const { data: industries = [] } = useIndustries();
  const { data: countries = [] } = useCountries();

  const [isGenerating, setIsGenerating] = React.useState(false);

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      const buffer = await buildTemplateWorkbook({
        industries,
        countries,
        locale,
      });

      triggerFileDownload(buffer, 'scope-import-template.xlsx', 'xlsx');
      toast.success(t('templateSuccess'));
    } catch {
      toast.error('حدث خطأ أثناء إنشاء النموذج');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleDownload}
      disabled={isGenerating}
      className={cn('gap-1.5', className)}
    >
      {isGenerating ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : (
        <FileSpreadsheet className="size-3.5" />
      )}
      <span>{isGenerating ? t('generatingTemplate') : t('downloadTemplate')}</span>
    </Button>
  );
}
