'use client';

import * as React from 'react';
import Link from 'next/link';
import { Sparkles, UserPlus, FileUp, Sliders, ArrowLeft, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FirstRunOnboardingCardProps {
  totalLeads: number;
}

export function FirstRunOnboardingCard({ totalLeads }: FirstRunOnboardingCardProps) {
  const [isDismissed, setIsDismissed] = React.useState(false);

  // If there are already leads or the user dismissed it, do not show
  if (totalLeads > 0 || isDismissed) {
    return null;
  }

  const steps = [
    {
      num: '١',
      title: 'إضافة أول عميل يدويًا',
      desc: 'سجل عميل محتمل بـ 4 حقول أساسية في أقل من 10 ثوانٍ.',
      href: '/leads?new=true',
      actionLabel: 'إضافة عميل',
      icon: UserPlus,
    },
    {
      num: '٢',
      title: 'استيراد قائمة من Excel',
      desc: 'ارفع ملفك أو الصق الروابط وسيقوم النظام بمطابقة الأعمدة تلقائيًا.',
      href: '/data/import',
      actionLabel: 'استيراد الآن',
      icon: FileUp,
    },
    {
      num: '٣',
      title: 'تخصيص مواعيد المتابعة',
      desc: 'اضبط المدد الافتراضية للمتابعات (FU1, FU2, FU3) لتناسب جدول عملك.',
      href: '/settings',
      actionLabel: 'ضبط الإعدادات',
      icon: Sliders,
    },
  ];

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-5 relative overflow-hidden">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="size-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 shadow-xs">
            <Sparkles className="size-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground tracking-tight">
              مرحبًا بك في Scope CRM 🎉
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              نظامك جاهز تمامًا. ابدأ بإحدى هذه الخطوات الثلاث لتفعيل خط المبيعات والمتابعة:
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsDismissed(true)}
          className="text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-muted/40 transition-colors cursor-pointer"
          title="إخفاء مؤقت"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {steps.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.num}
              className="rounded-2xl border border-border bg-muted/20 p-4.5 flex flex-col justify-between space-y-4 hover:border-primary/40 hover:bg-muted/40 transition-all shadow-xs"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="size-7 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center">
                    {s.num}
                  </span>
                  <Icon className="size-4 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-foreground">{s.title}</h3>
                  <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                    {s.desc}
                  </p>
                </div>
              </div>

              <Button
                asChild
                size="sm"
                variant="outline"
                className="w-full text-xs font-semibold h-8 justify-between rounded-full border-border hover:border-primary text-foreground hover:text-primary bg-card"
              >
                <Link href={s.href}>
                  <span>{s.actionLabel}</span>
                  <ArrowLeft className="size-3.5 rtl:rotate-180" />
                </Link>
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
