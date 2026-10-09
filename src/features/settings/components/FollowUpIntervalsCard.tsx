'use client';

import * as React from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Calendar, Info } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { SaveIndicator, type SaveState } from '@/components/ui/save-indicator';
import { useSettings, useUpdateSettings } from '../queries';
import type { SettingsRow } from '../api';

export function FollowUpIntervalsCard() {
  const { data: settings } = useSettings();
  const key = settings?.owner_id ? `${settings.owner_id}-${settings.updated_at}` : 'loading';

  return <FollowUpIntervalsForm key={key} initialSettings={settings} />;
}

function FollowUpIntervalsForm({ initialSettings }: { initialSettings?: SettingsRow }) {
  const t = useTranslations('settings');
  const locale = useLocale();
  const updateSettingsMutation = useUpdateSettings();

  const [saveState, setSaveState] = React.useState<SaveState>('idle');

  // Form states initialized cleanly from loaded settings
  const [fu1, setFu1] = React.useState(initialSettings?.fu1_after_days ?? 2);
  const [fu2, setFu2] = React.useState(initialSettings?.fu2_after_days ?? 3);
  const [fu3, setFu3] = React.useState(initialSettings?.fu3_after_days ?? 4);
  const [giveUp, setGiveUp] = React.useState(initialSettings?.give_up_after_days ?? 5);

  const commitField = (key: 'fu1_after_days' | 'fu2_after_days' | 'fu3_after_days' | 'give_up_after_days', val: number) => {
    setSaveState('saving');
    updateSettingsMutation.mutate(
      { [key]: val },
      {
        onSuccess: () => {
          setSaveState('saved');
          setTimeout(() => setSaveState('idle'), 2000);
        },
        onError: () => {
          setSaveState('error');
        },
      }
    );
  };

  // Safe integer clamped parser
  const handleNumChange = (
    setter: React.Dispatch<React.SetStateAction<number>>,
    key: 'fu1_after_days' | 'fu2_after_days' | 'fu3_after_days' | 'give_up_after_days',
    max: number = 60
  ) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = parseInt(e.target.value, 10);
    const clamped = isNaN(raw) ? 1 : Math.max(1, Math.min(max, raw));
    setter(clamped);
    commitField(key, clamped);
  };

  // Compute live calendar dates from today
  const simulation = React.useMemo(() => {
    const today = new Date();
    const addDays = (base: Date, days: number) => {
      const d = new Date(base);
      d.setDate(d.getDate() + days);
      return d;
    };

    const dFu1 = addDays(today, fu1);
    const dFu2 = addDays(dFu1, fu2);
    const dFu3 = addDays(dFu2, fu3);
    const dGiveUp = addDays(dFu3, giveUp);

    const formatOpts: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    };

    return {
      todayStr: today.toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US', formatOpts),
      fu1Date: dFu1.toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US', formatOpts),
      fu2Date: dFu2.toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US', formatOpts),
      fu3Date: dFu3.toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US', formatOpts),
      giveUpDate: dGiveUp.toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US', formatOpts),
      totalDays: fu1 + fu2 + fu3 + giveUp,
    };
  }, [fu1, fu2, fu3, giveUp, locale]);

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-6">
      <div className="flex items-center justify-between border-b border-border/60 pb-4">
        <div>
          <h2 className="text-lg font-bold text-foreground">{t('outreach')}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{t('outreachDesc')}</p>
        </div>
        <SaveIndicator state={saveState} />
      </div>

      {/* 4 Interval Number Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="space-y-1.5 p-3.5 rounded-xl border border-border/70 bg-muted/20">
          <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <span className="inline-flex size-5 items-center justify-center rounded-full bg-primary/10 text-primary text-[11px] font-bold">1</span>
            {t('fu1')}
          </Label>
          <div className="flex items-center gap-2 pt-1">
            <Input
              type="number"
              min={1}
              max={60}
              value={fu1}
              onChange={handleNumChange(setFu1, 'fu1_after_days', 60)}
              className="font-mono text-center font-bold"
            />
            <span className="text-xs text-muted-foreground shrink-0">{t('days')}</span>
          </div>
        </div>

        <div className="space-y-1.5 p-3.5 rounded-xl border border-border/70 bg-muted/20">
          <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <span className="inline-flex size-5 items-center justify-center rounded-full bg-primary/10 text-primary text-[11px] font-bold">2</span>
            {t('fu2')}
          </Label>
          <div className="flex items-center gap-2 pt-1">
            <Input
              type="number"
              min={1}
              max={60}
              value={fu2}
              onChange={handleNumChange(setFu2, 'fu2_after_days', 60)}
              className="font-mono text-center font-bold"
            />
            <span className="text-xs text-muted-foreground shrink-0">{t('days')}</span>
          </div>
        </div>

        <div className="space-y-1.5 p-3.5 rounded-xl border border-border/70 bg-muted/20">
          <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <span className="inline-flex size-5 items-center justify-center rounded-full bg-primary/10 text-primary text-[11px] font-bold">3</span>
            {t('fu3')}
          </Label>
          <div className="flex items-center gap-2 pt-1">
            <Input
              type="number"
              min={1}
              max={60}
              value={fu3}
              onChange={handleNumChange(setFu3, 'fu3_after_days', 60)}
              className="font-mono text-center font-bold"
            />
            <span className="text-xs text-muted-foreground shrink-0">{t('days')}</span>
          </div>
        </div>

        <div className="space-y-1.5 p-3.5 rounded-xl border border-border/70 bg-muted/20">
          <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <span className="inline-flex size-5 items-center justify-center rounded-full bg-destructive/10 text-destructive text-[11px] font-bold">✕</span>
            {t('giveUp')}
          </Label>
          <div className="flex items-center gap-2 pt-1">
            <Input
              type="number"
              min={1}
              max={90}
              value={giveUp}
              onChange={handleNumChange(setGiveUp, 'give_up_after_days', 90)}
              className="font-mono text-center font-bold"
            />
            <span className="text-xs text-muted-foreground shrink-0">{t('days')}</span>
          </div>
        </div>
      </div>

      {/* Live Preview Timeline Simulation */}
      <div className="rounded-xl border border-border/80 bg-muted/30 p-4 space-y-3">
        <div className="flex items-center justify-between text-xs font-medium text-foreground">
          <span className="flex items-center gap-1.5 font-bold">
            <Calendar className="size-4 text-primary" />
            {t('simulationTitle')}
          </span>
          <span className="text-muted-foreground">
            {t('simulationDesc', { today: simulation.todayStr })}
          </span>
        </div>

        {/* Visual timeline steps */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 pt-1 text-xs">
          <div className="flex items-center justify-between md:flex-col md:items-start p-2.5 rounded-lg bg-background border border-border">
            <span className="text-muted-foreground">
              {t('fu1')}
            </span>
            <div className="text-start font-medium text-foreground">
              <span className="font-mono font-bold text-primary">+{fu1}d</span>
              <span className="text-muted-foreground ms-1.5">({simulation.fu1Date})</span>
            </div>
          </div>

          <div className="flex items-center justify-between md:flex-col md:items-start p-2.5 rounded-lg bg-background border border-border">
            <span className="text-muted-foreground">
              {t('fu2')}
            </span>
            <div className="text-start font-medium text-foreground">
              <span className="font-mono font-bold text-primary">+{fu2}d</span>
              <span className="text-muted-foreground ms-1.5">({simulation.fu2Date})</span>
            </div>
          </div>

          <div className="flex items-center justify-between md:flex-col md:items-start p-2.5 rounded-lg bg-background border border-border">
            <span className="text-muted-foreground">
              {t('fu3')}
            </span>
            <div className="text-start font-medium text-foreground">
              <span className="font-mono font-bold text-primary">+{fu3}d</span>
              <span className="text-muted-foreground ms-1.5">({simulation.fu3Date})</span>
            </div>
          </div>

          <div className="flex items-center justify-between md:flex-col md:items-start p-2.5 rounded-lg bg-background border border-border">
            <span className="text-muted-foreground">
              {t('giveUp')}
            </span>
            <div className="text-start font-medium text-destructive">
              <span className="font-mono font-bold">+{giveUp}d</span>
              <span className="text-muted-foreground ms-1.5">({simulation.giveUpDate})</span>
            </div>
          </div>
        </div>

        {/* Informative Note */}
        <div className="flex items-start gap-2 pt-2 text-[11px] text-muted-foreground border-t border-border/40">
          <Info className="size-3.5 shrink-0 mt-0.5 text-primary" />
          <p>{t('futureNote')}</p>
        </div>
      </div>
    </div>
  );
}
