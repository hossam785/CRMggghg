'use client';

import * as React from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type {
  CountryRef,
  IndustryRef,
  Mapping,
  MappingTarget,
  SheetData,
  ValidateCtx,
} from '../types';
import { saveMapping, generateHeaderSignature } from '../saved-mappings';
import type { LeadStage } from '@/types/database';

interface MappingStepProps {
  sheetData: SheetData;
  initialMapping: Mapping;
  industries: IndustryRef[];
  countries: CountryRef[];
  onConfirm: (data: { mapping: Mapping; ctx: ValidateCtx }) => void;
  onBack: () => void;
}

const TARGET_OPTIONS: { value: MappingTarget; label: string; group?: string }[] = [
  { value: 'name', label: 'الاسم (Name) ★ مطلوب' },
  { value: 'instagram', label: 'إنستجرام (Instagram) ★' },
  { value: 'whatsapp', label: 'واتساب (WhatsApp) ★' },
  { value: 'company', label: 'الشركة (Company)' },
  { value: 'industry', label: 'نشاط العمل (Industry)' },
  { value: 'job_title', label: 'المسمى الوظيفي (Job Title)' },
  { value: 'country', label: 'الدولة (Country)' },
  { value: 'stage', label: 'المرحلة في النظام (Stage)' },
  { value: 'has_content', label: 'لديه محتوى (Has Content)' },
  { value: 'appears_in_content', label: 'يظهر بنفسه (Appears on camera)' },
  { value: 'has_videographer', label: 'فريق تصوير (Videographer)' },
  { value: 'problems', label: 'المشاكل ونقاط الضعف (Problems)' },
  { value: 'notes', label: 'الملاحظات (Notes)' },
  { value: 'notes_append', label: 'إلحاق بالملاحظات (Append to Notes)' },
  { value: 'ignore', label: 'تجاهل هذا العمود (Ignore)' },
];

export function MappingStep({
  sheetData,
  initialMapping,
  industries,
  countries,
  onConfirm,
  onBack,
}: MappingStepProps) {
  const [mapping, setMapping] = React.useState<Mapping>(initialMapping);

  // Defaults
  const [defaultCountry, setDefaultCountry] = React.useState<string>('EG');
  const [defaultIndustryId, setDefaultIndustryId] = React.useState<number | undefined>(undefined);
  const [defaultStage, setDefaultStage] = React.useState<LeadStage>('new');
  const [duplicateStrategy, setDuplicateStrategy] = React.useState<'skip' | 'fill_empty' | 'replace'>('skip');

  const handleTargetChange = (header: string, newTarget: MappingTarget) => {
    setMapping((prev) => ({
      ...prev,
      [header]: {
        target: newTarget,
        confidence: 1.0,
        reason: 'manual_override',
      },
    }));
  };

  // Validation rules
  const mappedTargets = Object.values(mapping).map((m) => m.target);
  const hasName = mappedTargets.includes('name');
  const hasContact = mappedTargets.includes('instagram') || mappedTargets.includes('whatsapp');
  const canProceed = hasName && hasContact;

  const handleSubmit = () => {
    if (!canProceed) return;

    // Save mapping to localStorage for this file signature
    const sig = generateHeaderSignature(sheetData.headers);
    const simpleMapping: Record<string, MappingTarget> = {};
    for (const [h, m] of Object.entries(mapping)) {
      simpleMapping[h] = m.target;
    }
    saveMapping(sig, simpleMapping);

    onConfirm({
      mapping,
      ctx: {
        defaultCountry: defaultCountry || null,
        defaultIndustryId: defaultIndustryId || null,
        defaultStage,
        duplicateStrategy,
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Top validation alerts if missing mandatory columns */}
      {!canProceed && (
        <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-200 flex items-start gap-3">
          <AlertTriangle className="size-5 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
          <div className="text-xs space-y-1">
            <span className="font-bold block">يرجى استكمال الحقول الإلزامية:</span>
            {!hasName && <div>• يجب ربط عمود واحد على الأقل بـ <strong>الاسم</strong>.</div>}
            {!hasContact && <div>• يجب ربط عمود واحد على الأقل بوسيلة تواصل (<strong>إنستجرام</strong> أو <strong>واتساب</strong>).</div>}
          </div>
        </div>
      )}

      {/* Defaults Card */}
      <div className="p-5 rounded-2xl border border-border bg-card space-y-4">
        <h3 className="text-sm font-bold text-foreground">
          القيم الافتراضية واستراتيجية التكرار
        </h3>
        <p className="text-xs text-muted-foreground">
          تُطبق هذه القيم في حال كانت الخلية فارغة في الملف أو غير محددة
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          {/* Default Country */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">
              الدولة الافتراضية
            </label>
            <select
              value={defaultCountry}
              onChange={(e) => setDefaultCountry(e.target.value)}
              className="w-full text-xs rounded-xl border border-border bg-background p-2.5 font-medium"
            >
              <option value="">بدون دولة افتراضية</option>
              {countries.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name_ar} ({c.code})
                </option>
              ))}
            </select>
          </div>

          {/* Default Industry */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">
              النشاط الافتراضي
            </label>
            <select
              value={defaultIndustryId ?? ''}
              onChange={(e) => setDefaultIndustryId(e.target.value ? Number(e.target.value) : undefined)}
              className="w-full text-xs rounded-xl border border-border bg-background p-2.5 font-medium"
            >
              <option value="">بدون نشاط افتراضي</option>
              {industries.map((ind) => (
                <option key={ind.id} value={ind.id}>
                  {ind.label_ar}
                </option>
              ))}
            </select>
          </div>

          {/* Default Stage */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">
              مرحلة البايبلاين
            </label>
            <select
              value={defaultStage}
              onChange={(e) => setDefaultStage(e.target.value as LeadStage)}
              className="w-full text-xs rounded-xl border border-border bg-background p-2.5 font-medium"
            >
              <option value="new">عميل جديد (New)</option>
              <option value="message_sent">تمت المراسلة (Message Sent)</option>
              <option value="replied">تم الرد (Replied)</option>
            </select>
          </div>

          {/* Duplicate Strategy */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">
              معالجة المكرر في النظام
            </label>
            <select
              value={duplicateStrategy}
              onChange={(e) => setDuplicateStrategy(e.target.value as 'skip' | 'fill_empty' | 'replace')}
              className="w-full text-xs rounded-xl border border-border bg-background p-2.5 font-medium"
            >
              <option value="skip">تخطي وعدم التعديل (موصى به)</option>
              <option value="fill_empty">ملء الحقول الفارغة فقط</option>
              <option value="replace">استبدال البيانات بالكامل</option>
            </select>
          </div>
        </div>
      </div>

      {/* Columns Mapping List */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/30 flex items-center justify-between">
          <span className="text-xs font-bold text-foreground">
            أعمدة الملف ({sheetData.headers.length} عمود)
          </span>
          <span className="text-xs text-muted-foreground">
            الحقل المقابل في Scope Mini CRM
          </span>
        </div>

        <div className="divide-y divide-border">
          {sheetData.headers.map((header, colIdx) => {
            const currentMap = mapping[header] || { target: 'ignore', confidence: 0 };
            const sampleVals = sheetData.sample
              .map((r) => r[colIdx])
              .filter((v): v is string => typeof v === 'string' && v.trim().length > 0)
              .slice(0, 3);

            return (
              <div
                key={header}
                className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-accent/20 transition-colors"
              >
                {/* Column details & sample */}
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-foreground">{header}</span>
                    {currentMap.confidence >= 0.8 && currentMap.target !== 'ignore' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600">
                        <CheckCircle2 className="size-3" />
                        <span>مطابقة ذكية ({Math.round(currentMap.confidence * 100)}%)</span>
                      </span>
                    )}
                  </div>
                  {sampleVals.length > 0 ? (
                    <div className="text-[11px] text-muted-foreground truncate">
                      عينة: {sampleVals.join(' · ')}
                    </div>
                  ) : (
                    <div className="text-[11px] text-muted-foreground/60 italic">عمود فارغ في العينة</div>
                  )}
                </div>

                {/* Target Select */}
                <div className="w-full md:w-72 shrink-0">
                  <select
                    value={currentMap.target}
                    onChange={(e) => handleTargetChange(header, e.target.value as MappingTarget)}
                    className={`w-full text-xs rounded-xl border p-2.5 font-semibold transition-colors ${
                      currentMap.target === 'ignore'
                        ? 'border-border bg-muted/40 text-muted-foreground'
                        : 'border-primary/40 bg-background text-foreground'
                    }`}
                  >
                    {TARGET_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-2">
        <Button variant="outline" onClick={onBack}>
          ← العودة للمصدر
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!canProceed}
          className="px-6 font-bold"
        >
          فحص وتحضير البيانات ←
        </Button>
      </div>
    </div>
  );
}
