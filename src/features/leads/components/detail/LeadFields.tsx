'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { SaveIndicator } from '@/components/ui/save-indicator';
import { InstagramField } from '../fields/InstagramField';
import { PhoneField } from '../fields/PhoneField';
import { IndustrySelect } from '../fields/IndustrySelect';
import { CountryCombobox } from '../fields/CountryCombobox';
import { useAutosaveField } from '../../use-autosave-field';
import { cn } from '@/lib/utils';
import type { Lead } from '../../schema';

export interface LeadFieldsProps {
  lead: Lead;
  className?: string;
}

export function LeadFields({ lead, className }: LeadFieldsProps) {
  const t = useTranslations('leads');

  // Autosave instances for each field
  const nameAutosave = useAutosaveField({
    leadId: lead.id,
    field: 'name',
    initialValue: lead.name,
    currentLead: lead,
  });

  const companyAutosave = useAutosaveField({
    leadId: lead.id,
    field: 'company',
    initialValue: lead.company,
    currentLead: lead,
  });

  const jobTitleAutosave = useAutosaveField({
    leadId: lead.id,
    field: 'job_title',
    initialValue: lead.job_title,
    currentLead: lead,
  });

  const instagramAutosave = useAutosaveField({
    leadId: lead.id,
    field: 'instagram_handle',
    initialValue: lead.instagram_handle,
    currentLead: lead,
  });

  const whatsappAutosave = useAutosaveField({
    leadId: lead.id,
    field: 'whatsapp_e164',
    initialValue: lead.whatsapp_e164,
    currentLead: lead,
  });

  const industryAutosave = useAutosaveField({
    leadId: lead.id,
    field: 'industry_id',
    initialValue: lead.industry_id,
    currentLead: lead,
    debounceMs: 0,
  });

  const industryOtherAutosave = useAutosaveField({
    leadId: lead.id,
    field: 'industry_other',
    initialValue: lead.industry_other,
    currentLead: lead,
  });

  const countryAutosave = useAutosaveField({
    leadId: lead.id,
    field: 'country_code',
    initialValue: lead.country_code,
    currentLead: lead,
    debounceMs: 0,
  });

  return (
    <div
      className={cn(
        'p-5 sm:p-6 rounded-[var(--radius-xl)] bg-[var(--surface)] border border-[var(--border)] shadow-xs space-y-5',
        className
      )}
    >
      <h2 className="text-base font-bold text-[var(--fg)] border-b border-[var(--border)] pb-3">
        البيانات الأساسية
      </h2>

      <div className="space-y-4">
        {/* Name */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="lead-name" className="text-xs font-semibold">
              {t('name')} <span className="text-[var(--danger)]">*</span>
            </Label>
            <SaveIndicator
              state={nameAutosave.saveState}
              onRetry={nameAutosave.retry}
            />
          </div>
          <Input
            id="lead-name"
            value={nameAutosave.value}
            onChange={(e) => nameAutosave.setValue(e.target.value)}
            onBlur={nameAutosave.flush}
            className="h-10 text-sm"
          />
          {nameAutosave.errorMessage && (
            <p className="text-xs text-[var(--danger)]">{nameAutosave.errorMessage}</p>
          )}
        </div>

        {/* Company & Job Title */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="lead-company" className="text-xs font-semibold">
                {t('company')}
              </Label>
              <SaveIndicator
                state={companyAutosave.saveState}
                onRetry={companyAutosave.retry}
              />
            </div>
            <Input
              id="lead-company"
              value={companyAutosave.value || ''}
              onChange={(e) => companyAutosave.setValue(e.target.value || null)}
              onBlur={companyAutosave.flush}
              className="h-10 text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="lead-job-title" className="text-xs font-semibold">
                {t('jobTitle')}
              </Label>
              <SaveIndicator
                state={jobTitleAutosave.saveState}
                onRetry={jobTitleAutosave.retry}
              />
            </div>
            <Input
              id="lead-job-title"
              value={jobTitleAutosave.value || ''}
              onChange={(e) => jobTitleAutosave.setValue(e.target.value || null)}
              onBlur={jobTitleAutosave.flush}
              className="h-10 text-sm"
            />
          </div>
        </div>

        {/* Instagram & WhatsApp */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="lead-instagram" className="text-xs font-semibold">
                {t('instagram')}
              </Label>
              <SaveIndicator
                state={instagramAutosave.saveState}
                onRetry={instagramAutosave.retry}
              />
            </div>
            <InstagramField
              id="lead-instagram"
              value={instagramAutosave.value}
              onChange={(val) => {
                instagramAutosave.setValue(val);
                instagramAutosave.flush();
              }}
              onBlur={instagramAutosave.flush}
              excludeLeadId={lead.id}
              error={instagramAutosave.errorMessage || undefined}
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="lead-whatsapp" className="text-xs font-semibold">
                {t('whatsapp')}
              </Label>
              <SaveIndicator
                state={whatsappAutosave.saveState}
                onRetry={whatsappAutosave.retry}
              />
            </div>
            <PhoneField
              id="lead-whatsapp"
              value={whatsappAutosave.value}
              onChange={(val) => {
                whatsappAutosave.setValue(val);
                whatsappAutosave.flush();
              }}
              onBlur={whatsappAutosave.flush}
              countryCode={countryAutosave.value || 'EG'}
              error={whatsappAutosave.errorMessage || undefined}
            />
          </div>
        </div>

        {/* Industry & Country */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold">{t('industry')}</Label>
              <SaveIndicator
                state={
                  industryAutosave.saveState !== 'idle'
                    ? industryAutosave.saveState
                    : industryOtherAutosave.saveState
                }
                onRetry={industryAutosave.retry}
              />
            </div>
            <IndustrySelect
              industryId={industryAutosave.value}
              industryOther={industryOtherAutosave.value}
              onIndustryChange={(id) => {
                industryAutosave.setValue(id);
                industryAutosave.flush();
              }}
              onOtherChange={(other) => {
                industryOtherAutosave.setValue(other);
              }}
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold">{t('country')}</Label>
              <SaveIndicator
                state={countryAutosave.saveState}
                onRetry={countryAutosave.retry}
              />
            </div>
            <CountryCombobox
              value={countryAutosave.value}
              onChange={(c) => {
                countryAutosave.setValue(c);
                countryAutosave.flush();
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
