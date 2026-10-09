'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileUp, TableProperties, RefreshCw } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useWorker } from '@/lib/workers/use-worker';
import type { CountryRef, ImportWorkerApi, IndustryRef, Mapping, SheetData, ValidateCtx } from '../types';
import { listSavedMappings } from '../saved-mappings';
import { SourceStep } from './SourceStep';
import { MappingStep } from './MappingStep';
import { StagingStep } from './StagingStep';

type WizardStep = 'source' | 'mapping' | 'staging';

export function ImportWizard() {
  const [step, setStep] = React.useState<WizardStep>('source');

  // Worker instance
  const { api: workerApi } = useWorker<ImportWorkerApi>(
    React.useCallback(
      () =>
        new Worker(new URL('../import.worker.ts', import.meta.url), {
          type: 'module',
        }),
      []
    )
  );

  // Reference queries
  const supabase = createClient();
  const { data: industries = [] } = useQuery<IndustryRef[]>({
    queryKey: ['industries', 'active'],
    queryFn: async () => {
      const { data } = await supabase
        .from('industries')
        .select('id, key, label_ar, label_en')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      return (data || []) as IndustryRef[];
    },
  });

  const { data: countries = [] } = useQuery<CountryRef[]>({
    queryKey: ['countries'],
    queryFn: async () => {
      const { data } = await supabase
        .from('countries')
        .select('code, name_ar, name_en')
        .order('name_ar', { ascending: true });
      return (data || []) as CountryRef[];
    },
  });

  // State between steps
  const [fileData, setFileData] = React.useState<{
    fileOrBuffer: File | ArrayBuffer;
    fileName: string;
    sheetName: string;
    sheetData: SheetData;
  } | null>(null);

  const [mapping, setMapping] = React.useState<Mapping>({});
  const [validateCtx, setValidateCtx] = React.useState<ValidateCtx>({});

  const handleFileReady = async (loaded: {
    fileOrBuffer: File | ArrayBuffer;
    fileName: string;
    sheetName: string;
    sheetData: SheetData;
  }) => {
    setFileData(loaded);
    if (workerApi) {
      const savedMappings = listSavedMappings();
      const autoSuggestions = await workerApi.autoMap({
        industries,
        countries,
        savedMappings,
      });
      setMapping(autoSuggestions);
    }
    setStep('mapping');
  };

  const handleMappingConfirmed = (data: { mapping: Mapping; ctx: ValidateCtx }) => {
    setMapping(data.mapping);
    setValidateCtx(data.ctx);
    setStep('staging');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Stepper Header */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <div
            className={`flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-xl transition-colors ${
              step === 'source'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            <FileUp className="size-3.5" />
            <span>1. اختيار الملف</span>
          </div>

          <div
            className={`flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-xl transition-colors ${
              step === 'mapping'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            <TableProperties className="size-3.5" />
            <span>2. ربط الأعمدة</span>
          </div>

          <div
            className={`flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-xl transition-colors ${
              step === 'staging'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            <RefreshCw className="size-3.5" />
            <span>3. الفحص والرفع</span>
          </div>
        </div>

        <span className="text-xs text-muted-foreground font-medium">
          معالج استيراد العملاء
        </span>
      </div>

      {/* Steps Content */}
      {step === 'source' && (
        <SourceStep
          workerApi={workerApi}
          onFileReady={handleFileReady}
        />
      )}

      {step === 'mapping' && fileData && (
        <MappingStep
          sheetData={fileData.sheetData}
          initialMapping={mapping}
          industries={industries}
          countries={countries}
          onConfirm={handleMappingConfirmed}
          onBack={() => setStep('source')}
        />
      )}

      {step === 'staging' && fileData && workerApi && (
        <StagingStep
          workerApi={workerApi}
          fileOrBuffer={fileData.fileOrBuffer}
          fileName={fileData.fileName}
          sheetName={fileData.sheetName}
          sheetData={fileData.sheetData}
          mapping={mapping}
          ctx={validateCtx}
          onCancel={() => setStep('mapping')}
        />
      )}
    </div>
  );
}
