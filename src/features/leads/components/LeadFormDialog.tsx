'use client';

import * as React from 'react';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
} from '@/components/ui/responsive-dialog';
import { InstagramField } from './fields/InstagramField';
import { PhoneField } from './fields/PhoneField';
import { CountryCombobox } from './fields/CountryCombobox';
import { IndustrySelect } from './fields/IndustrySelect';
import { TriStateToggle } from './fields/TriStateToggle';
import { leadInputSchema, type LeadInput } from '../schema';
import { useCreateLead } from '../queries';
import { pipelineApi } from '@/features/pipeline/api';
import { AppError } from '@/lib/errors';
import { cn } from '@/lib/utils';

const DRAFT_STORAGE_KEY = 'scope_lead_draft';
const LAST_COUNTRY_STORAGE_KEY = 'scope_last_country';

function getInitialCountry(): string {
  if (typeof window === 'undefined') return 'EG';
  try {
    return localStorage.getItem(LAST_COUNTRY_STORAGE_KEY) || 'EG';
  } catch {
    return 'EG';
  }
}

function getInitialDraft(): Partial<LeadInput> | null {
  if (typeof window === 'undefined') return null;
  try {
    const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

export interface LeadFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LeadFormDialog({ open, onOpenChange }: LeadFormDialogProps) {
  const t = useTranslations('leads');
  const tCommon = useTranslations('common');
  const createLeadMutation = useCreateLead();

  const [showMoreDetails, setShowMoreDetails] = React.useState(false);
  const [isDuplicate, setIsDuplicate] = React.useState(false);
  const [alreadyMessaged, setAlreadyMessaged] = React.useState(false);

  const defaultCountry = React.useMemo(() => getInitialCountry(), []);
  const initialDraft = React.useMemo(() => getInitialDraft(), []);

  const form = useForm<LeadInput>({
    resolver: zodResolver(leadInputSchema),
    defaultValues: {
      name: initialDraft?.name || '',
      company: initialDraft?.company || null,
      industry_id: initialDraft?.industry_id ?? null,
      industry_other: initialDraft?.industry_other || null,
      job_title: initialDraft?.job_title || null,
      instagram_handle: initialDraft?.instagram_handle || null,
      whatsapp_e164: initialDraft?.whatsapp_e164 || null,
      country_code: initialDraft?.country_code || defaultCountry,
      notes: initialDraft?.notes || null,
      has_content: initialDraft?.has_content ?? null,
      appears_in_content: initialDraft?.appears_in_content ?? null,
      has_videographer: initialDraft?.has_videographer ?? 'unknown',
      problems: initialDraft?.problems || null,
    },
  });

  const {
    register,
    handleSubmit,
    control,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = form;

  const currentCountryCode = useWatch({ control, name: 'country_code' });
  const problemsValue = useWatch({ control, name: 'problems' }) || '';
  const problemsLength = problemsValue.length;

  // Persist draft to localStorage on change (debounced)
  const formValues = useWatch({ control });
  React.useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(formValues));
      } catch {
        // Ignore quota errors
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [formValues, open]);

  // Focus Instagram field on modal open
  React.useEffect(() => {
    if (open) {
      setTimeout(() => {
        document.getElementById('instagram-field')?.focus();
      }, 100);
    }
  }, [open]);

  const handleSave = async (data: LeadInput, addAnother = false) => {
    try {
      const created = await createLeadMutation.mutateAsync(data);

      if (alreadyMessaged) {
        try {
          await pipelineApi.leadAction({
            leadId: created.id,
            action: 'send_message',
            expectedStage: 'new',
          });
        } catch {
          toast.error(t('alreadyMessagedFailed'), {
            action: {
              label: tCommon('retry'),
              onClick: () => {
                void pipelineApi.leadAction({
                  leadId: created.id,
                  action: 'send_message',
                  expectedStage: 'new',
                });
              },
            },
          });
        }
      }

      // Save last used country
      if (data.country_code) {
        try {
          localStorage.setItem(LAST_COUNTRY_STORAGE_KEY, data.country_code);
        } catch {
          // Ignore storage errors
        }
      }

      // Clear draft
      try {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
      } catch {
        // Ignore storage errors
      }

      toast.success(t('leadSavedToast', { name: created.name }));

      if (addAnother) {
        // Reset keeping selected country and industry for rapid entry
        reset({
          name: '',
          company: null,
          industry_id: data.industry_id ?? null,
          industry_other: data.industry_other || null,
          job_title: null,
          instagram_handle: null,
          whatsapp_e164: null,
          country_code: data.country_code || defaultCountry,
          notes: null,
          has_content: null,
          appears_in_content: null,
          has_videographer: 'unknown',
          problems: null,
        });
        setIsDuplicate(false);
        setTimeout(() => {
          document.getElementById('instagram-field')?.focus();
        }, 100);
      } else {
        onOpenChange(false);
      }
    } catch (err) {
      if (err instanceof AppError) {
        if (err.code === 'DUPLICATE_INSTAGRAM') {
          setError('instagram_handle', { message: t('duplicateWarning') });
        } else if (err.code === 'DUPLICATE_WHATSAPP') {
          setError('whatsapp_e164', { message: t('duplicateWarning') });
        } else {
          toast.error(err.message);
        }
      } else {
        toast.error(tCommon('retry'));
      }
    }
  };

  // Keyboard shortcut Ctrl/⌘+Enter inside the form triggers Save & Add Another
  const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      void handleSubmit((data) => handleSave(data, true))();
    }
  };

  const isSaveDisabled = isDuplicate || isSubmitting || createLeadMutation.isPending;

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>{t('createLeadTitle')}</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>{t('createLeadDesc')}</ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <form
          onSubmit={handleSubmit((data) => handleSave(data, false))}
          onKeyDown={handleKeyDown}
          className="flex flex-col gap-4 py-2"
        >
          {/* LAYER 1: Core Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* 1. Instagram Field */}
            <div className="sm:col-span-2">
              <Controller
                control={control}
                name="instagram_handle"
                render={({ field }) => (
                  <InstagramField
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    error={errors.instagram_handle?.message ? t('invalidHandleError') : undefined}
                    onDuplicateChange={setIsDuplicate}
                    autoFocus
                  />
                )}
              />
            </div>

            {/* 2. Name Field */}
            <div className="sm:col-span-2 flex flex-col gap-1.5">
              <Label htmlFor="lead-name" className="text-sm font-medium text-[var(--color-fg-primary)]">
                {t('name')} *
              </Label>
              <Input
                id="lead-name"
                {...register('name')}
                placeholder={t('name')}
                maxLength={120}
                className={cn(
                  'text-base sm:text-sm',
                  errors.name ? 'border-[var(--color-error)] focus-visible:ring-[var(--color-error)]' : ''
                )}
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? 'lead-name-error' : undefined}
              />
              {errors.name && (
                <p id="lead-name-error" role="alert" className="text-xs text-[var(--color-error)] font-medium">
                  {t('required')}
                </p>
              )}
            </div>

            {/* 3. Industry Field */}
            <div className="sm:col-span-1">
              <Controller
                control={control}
                name="industry_id"
                render={({ field: indField }) => (
                  <Controller
                    control={control}
                    name="industry_other"
                    render={({ field: otherField }) => (
                      <IndustrySelect
                        industryId={indField.value}
                        industryOther={otherField.value}
                        onIndustryChange={indField.onChange}
                        onOtherChange={otherField.onChange}
                        industryError={errors.industry_id?.message ? t('required') : undefined}
                        otherError={errors.industry_other?.message ? t('required') : undefined}
                      />
                    )}
                  />
                )}
              />
            </div>

            {/* 4. Country Combobox */}
            <div className="sm:col-span-1">
              <Controller
                control={control}
                name="country_code"
                render={({ field }) => (
                  <CountryCombobox
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.country_code?.message ? t('required') : undefined}
                  />
                )}
              />
            </div>
          </div>

          {/* Contact validation alert if both contact methods are empty */}
          {errors.instagram_handle?.message === 'contact_required' && (
            <p role="alert" className="text-xs text-[var(--color-error)] font-medium p-2 rounded bg-[var(--color-error-subtle)] border border-[var(--color-error)]">
              {t('contactRequired')}
            </p>
          )}

          {/* Already Messaged Checkbox (Layer 1, remembered across Save & Add Another) */}
          <div className="flex items-center gap-2 pt-1 pb-1">
            <Checkbox
              id="already-messaged-checkbox"
              checked={alreadyMessaged}
              onCheckedChange={(checked) => setAlreadyMessaged(Boolean(checked))}
            />
            <Label
              htmlFor="already-messaged-checkbox"
              className="text-xs font-medium text-[var(--fg)] cursor-pointer select-none"
            >
              {t('alreadyMessaged')}
            </Label>
          </div>

          {/* Toggle for Layer 2: More Details */}
          <div className="pt-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowMoreDetails((prev) => !prev)}
              className="text-xs text-[var(--color-fg-secondary)] hover:text-[var(--color-fg-primary)] flex items-center gap-1.5 px-2"
            >
              <span>{showMoreDetails ? t('lessDetails') : t('moreDetails')}</span>
              {showMoreDetails ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
            </Button>
          </div>

          {/* LAYER 2: Collapsible Details */}
          {showMoreDetails && (
            <div className="flex flex-col gap-3.5 pt-2 border-t border-[var(--color-border-subtle)] animate-in fade-in-50 duration-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Company */}
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="lead-company" className="text-sm font-medium text-[var(--color-fg-primary)]">
                    {t('company')}
                  </Label>
                  <Input
                    id="lead-company"
                    {...register('company')}
                    placeholder={t('company')}
                    maxLength={120}
                  />
                </div>

                {/* Job Title */}
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="lead-job-title" className="text-sm font-medium text-[var(--color-fg-primary)]">
                    {t('jobTitle')}
                  </Label>
                  <Input
                    id="lead-job-title"
                    {...register('job_title')}
                    placeholder={t('jobTitle')}
                    maxLength={80}
                  />
                </div>
              </div>

              {/* WhatsApp Phone */}
              <Controller
                control={control}
                name="whatsapp_e164"
                render={({ field }) => (
                  <PhoneField
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    countryCode={currentCountryCode}
                    error={errors.whatsapp_e164?.message ? t('invalidPhoneError', { country: '' }) : undefined}
                  />
                )}
              />

              {/* Qualification: 3 Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <Controller
                  control={control}
                  name="has_content"
                  render={({ field }) => (
                    <TriStateToggle
                      mode="boolean"
                      label={t('hasContent')}
                      value={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="appears_in_content"
                  render={({ field }) => (
                    <TriStateToggle
                      mode="boolean"
                      label={t('appearsInContent')}
                      value={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="has_videographer"
                  render={({ field }) => (
                    <TriStateToggle
                      mode="tristate"
                      label={t('hasVideographer')}
                      value={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
              </div>

              {/* Problems & Challenges with 280 char counter */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="lead-problems" className="text-sm font-medium text-[var(--color-fg-primary)]">
                    {t('problems')}
                  </Label>
                  <span
                    className={cn(
                      'text-xs font-mono',
                      problemsLength >= 270 ? 'text-[var(--color-warning)] font-semibold' : 'text-[var(--color-fg-muted)]'
                    )}
                  >
                    {t('charsRemaining', { count: 280 - problemsLength })}
                  </span>
                </div>
                <Textarea
                  id="lead-problems"
                  {...register('problems')}
                  placeholder={t('problems')}
                  maxLength={280}
                  rows={2}
                />
              </div>

              {/* Notes */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="lead-notes" className="text-sm font-medium text-[var(--color-fg-primary)]">
                  {t('notes')}
                </Label>
                <Textarea
                  id="lead-notes"
                  {...register('notes')}
                  placeholder={t('notes')}
                  maxLength={5000}
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* FOOTER ACTIONS */}
          <ResponsiveDialogFooter className="flex flex-col-reverse sm:flex-row items-center gap-2 pt-3 border-t border-[var(--color-border-subtle)] mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              {tCommon('cancel')}
            </Button>

            <Button
              type="button"
              variant="secondary"
              disabled={isSaveDisabled}
              onClick={handleSubmit((data) => handleSave(data, true))}
              className="w-full sm:w-auto"
              title="Ctrl / ⌘ + Enter"
            >
              {isSubmitting ? (
                <Loader2 className="size-4 animate-spin me-1.5" />
              ) : null}
              <span>{t('saveAndAddAnother')}</span>
            </Button>

            <Button
              type="submit"
              disabled={isSaveDisabled}
              className="w-full sm:w-auto"
            >
              {isSubmitting ? (
                <Loader2 className="size-4 animate-spin me-1.5" />
              ) : null}
              <span>{tCommon('save')}</span>
            </Button>
          </ResponsiveDialogFooter>
        </form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
