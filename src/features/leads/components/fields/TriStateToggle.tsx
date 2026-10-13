'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Label } from '@/components/ui/label';
import { SegmentedControl, type SegmentedControlOption } from '@/components/ui/segmented-control';
import type { TriState } from '@/types/database';
import { cn } from '@/lib/utils';

export interface BooleanToggleProps {
  mode?: 'boolean';
  id?: string;
  label: string;
  value: boolean | null | undefined;
  onChange: (value: boolean | null) => void;
  hint?: string;
  disabled?: boolean;
  className?: string;
}

export interface TriStateToggleProps {
  mode: 'tristate';
  id?: string;
  label: string;
  value: TriState | null | undefined;
  onChange: (value: TriState) => void;
  hint?: string;
  disabled?: boolean;
  className?: string;
}

export type ToggleFieldProps = BooleanToggleProps | TriStateToggleProps;

export function TriStateToggle(props: ToggleFieldProps) {
  const t = useTranslations('common');
  const { id = 'toggle-field', label, hint, disabled, className } = props;

  if (props.mode === 'tristate') {
    const { value, onChange } = props;

    const options: SegmentedControlOption[] = [
      { value: 'yes', label: t('yes') },
      { value: 'no', label: t('no') },
      { value: 'unknown', label: t('unknown') },
    ];

    const stringValue = value || 'unknown';

    return (
      <div className={cn('flex flex-col gap-1.5', className)}>
        <div className="flex items-center justify-between">
          <Label htmlFor={id} className="text-sm font-medium text-foreground">
            {label}
          </Label>
          {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
        </div>

        <SegmentedControl
          options={options}
          value={stringValue}
          onChange={(val) => {
            if (val === 'yes' || val === 'no' || val === 'unknown') {
              onChange(val);
            } else {
              onChange('unknown');
            }
          }}
          disabled={disabled}
        />
      </div>
    );
  }

  // Boolean mode with allowDeselect
  const { value, onChange } = props;

  const options: SegmentedControlOption[] = [
    { value: 'true', label: t('yes') },
    { value: 'false', label: t('no') },
  ];

  const stringValue = value === true ? 'true' : value === false ? 'false' : null;

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <div className="flex items-center justify-between">
        <Label htmlFor={id} className="text-sm font-medium text-foreground">
          {label}
        </Label>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </div>

      <SegmentedControl
        options={options}
        value={stringValue}
        allowDeselect
        onChange={(val) => {
          if (val === 'true') {
            onChange(true);
          } else if (val === 'false') {
            onChange(false);
          } else {
            onChange(null);
          }
        }}
        disabled={disabled}
      />
    </div>
  );
}
