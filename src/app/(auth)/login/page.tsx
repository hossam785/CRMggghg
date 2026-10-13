import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import {
  TrendingUp,
  Clock,
  Layers,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  ArrowUpRight,
  Send,
  Building2,
  UserCheck,
} from 'lucide-react';

import { LoginForm } from '@/features/auth/components/login-form';
import { LanguageToggle } from '@/components/ui/language-toggle';
import { ThemeToggle } from '@/components/ui/theme-toggle';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('auth');
  return {
    title: `${t('title')} · Scope CRM`,
    description: t('subtitle'),
  };
}

export default async function LoginPage() {
  const t = await getTranslations('auth');

  return (
    <main className="min-h-screen w-full flex flex-col lg:grid lg:grid-cols-12 bg-snow-canvas font-sans text-graphite-body antialiased selection:bg-royal-signal/15 selection:text-royal-signal">
      {/* 1. BRAND SHOWCASE PANE (Relate-Style Lavender Wash + Floating Kanban Pipeline) */}
      <section className="hidden lg:flex lg:col-span-7 xl:col-span-7 flex-col justify-between relative overflow-hidden bg-lavender-wash p-10 xl:p-14 border-e border-stone-divider">
        {/* Soft Radial Ambient Glow */}
        <div className="absolute -top-24 -start-24 size-[450px] rounded-full bg-royal-signal/[0.07] blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 end-0 size-[380px] rounded-full bg-cobalt-glow/[0.06] blur-[120px] pointer-events-none" />

        {/* Top Header: Brand Mark & Live Status Pill */}
        <header className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Relate Brand Mark: 38px rounded square in #145aff with white glyph */}
            <div className="flex size-10 items-center justify-center rounded-xl bg-royal-signal text-white font-semibold text-lg shadow-sm">
              s
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-midnight-ink">
                Scope CRM
              </span>
              <span className="block text-[10px] font-semibold text-ash-helper tracking-wider uppercase">
                Sales & Outreach Intelligence
              </span>
            </div>
          </div>

          {/* Relate-Style Status Pill with 5px Green Status Dot */}
          <div className="inline-flex items-center gap-2 rounded-full border border-stone-divider bg-surface-card/90 px-3.5 py-1.5 text-xs font-medium text-slate-caption shadow-xs backdrop-blur-md">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-mint-win opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-mint-win" />
            </span>
            <span>{t('systemStatus')}</span>
          </div>
        </header>

        {/* Center Showcase Area */}
        <div className="relative z-10 my-auto py-8 space-y-7 max-w-2xl">
          {/* Headlines with Tight Negative Tracking and Royal Blue Accent */}
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-royal-signal/20 bg-surface-card/80 px-3 py-1 text-xs font-semibold text-royal-signal shadow-xs backdrop-blur-md">
              <Sparkles className="size-3.5" />
              <span>جيل جديد من إدارة المبيعات والمتابعة</span>
            </div>

            <h1 className="text-3xl xl:text-4xl 2xl:text-[42px] font-semibold tracking-[-0.03em] text-midnight-ink leading-[1.15]">
              منظومة <span className="text-royal-signal">المبيعات</span> المتكاملة للشركات الصاعدة
            </h1>

            <p className="text-sm xl:text-[15px] text-slate-caption leading-relaxed max-w-xl">
              تتبّع خط مبيعاتك وقنوات تواصلك على إنستجرام وواتساب بدقة، مع جدول متابعات تلقائي ومؤشرات تحويل فورية تبقي فريقك في الطليعة.
            </p>
          </div>

          {/* Relate Floating Product UI: High-Fidelity Kanban Pipeline Showcase */}
          <div className="rounded-3xl border border-stone-divider bg-surface-card p-5 shadow-[rgba(0,0,0,0.08)_0px_0.36px_1.8px_-1.4px,rgba(0,0,0,0.07)_0px_1.37px_6.87px_-2.8px,rgba(0,0,0,0.016)_0px_6px_30px_-4.25px] space-y-4">
            {/* Pipeline Header Row */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-divider">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-midnight-ink">
                  خط المبيعات النشط
                </span>
                <span className="rounded-full bg-fog-surface px-2 py-0.5 text-[10px] font-semibold text-ash-helper">
                  مباشر
                </span>
              </div>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-mint-win">
                <TrendingUp className="size-3.5" />
                <span className="font-mono">+42% سرعة إغلاق الصفقات</span>
              </div>
            </div>

            {/* 3 Pipeline Columns (Relate 16px radius column containers with 8px radius deal cards) */}
            <div className="grid grid-cols-3 gap-3">
              {/* Column 1: Potential / Inbound (Cobalt Blue Dot) */}
              <div className="rounded-2xl bg-fog-surface/70 border border-stone-divider/80 p-3 flex flex-col gap-2.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 font-semibold text-midnight-ink">
                    <span className="size-2 rounded-full bg-cobalt-glow" />
                    <span>عملاء جدد</span>
                  </div>
                  <span className="font-mono text-[11px] font-semibold text-royal-signal">
                    4
                  </span>
                </div>

                {/* Deal Card 1 (Relate 8px inner radius) */}
                <div className="rounded-lg bg-surface-card border border-stone-divider p-2.5 shadow-xs space-y-2 transition-transform hover:-translate-y-0.5">
                  <div className="flex items-start justify-between gap-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="size-6 rounded-full bg-cobalt-glow/10 text-cobalt-glow flex items-center justify-center font-bold text-[10px] shrink-0">
                        ق
                      </div>
                      <span className="text-xs font-bold text-graphite-body truncate">
                        قنوات التقنية
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold font-mono text-royal-signal shrink-0">
                      5,400 ر.س
                    </span>
                  </div>
                  <p className="text-[11px] text-ash-helper line-clamp-1">
                    طلب عرض سعر لمنصة التجارة
                  </p>
                  <div className="flex items-center justify-between pt-1 border-t border-stone-divider/60 text-[10px] text-ash-helper">
                    <span>منذ 15 دقيقة</span>
                    <span className="rounded-full bg-fog-surface px-1.5 py-0.5 text-[9px] font-medium text-slate-caption">
                      إنستجرام
                    </span>
                  </div>
                </div>
              </div>

              {/* Column 2: In Outreach / Follow-up (Amber Orange Dot) */}
              <div className="rounded-2xl bg-fog-surface/70 border border-stone-divider/80 p-3 flex flex-col gap-2.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 font-semibold text-midnight-ink">
                    <span className="size-2 rounded-full bg-amber-pending" />
                    <span>متابعة نشطة</span>
                  </div>
                  <span className="font-mono text-[11px] font-semibold text-royal-signal">
                    6
                  </span>
                </div>

                {/* Deal Card 2 */}
                <div className="rounded-lg bg-surface-card border border-stone-divider p-2.5 shadow-xs space-y-2 transition-transform hover:-translate-y-0.5">
                  <div className="flex items-start justify-between gap-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="size-6 rounded-full bg-amber-pending/10 text-amber-pending flex items-center justify-center font-bold text-[10px] shrink-0">
                        ر
                      </div>
                      <span className="text-xs font-bold text-graphite-body truncate">
                        متجر رواء
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold font-mono text-royal-signal shrink-0">
                      12,800 ر.س
                    </span>
                  </div>
                  <p className="text-[11px] text-ash-helper line-clamp-1">
                    متابعة واتساب ثانية مجدولة
                  </p>
                  <div className="flex items-center justify-between pt-1 border-t border-stone-divider/60 text-[10px] text-ash-helper">
                    <span>اليوم 2:00 م</span>
                    <span className="rounded-full bg-fog-surface px-1.5 py-0.5 text-[9px] font-medium text-slate-caption">
                      واتساب
                    </span>
                  </div>
                </div>
              </div>

              {/* Column 3: Closed Won (Mint Green Dot) */}
              <div className="rounded-2xl bg-fog-surface/70 border border-stone-divider/80 p-3 flex flex-col gap-2.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 font-semibold text-midnight-ink">
                    <span className="size-2 rounded-full bg-mint-win" />
                    <span>صفقات رابحة</span>
                  </div>
                  <span className="font-mono text-[11px] font-semibold text-mint-win">
                    8
                  </span>
                </div>

                {/* Deal Card 3 */}
                <div className="rounded-lg bg-surface-card border border-stone-divider p-2.5 shadow-xs space-y-2 transition-transform hover:-translate-y-0.5">
                  <div className="flex items-start justify-between gap-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="size-6 rounded-full bg-mint-win/10 text-mint-win flex items-center justify-center font-bold text-[10px] shrink-0">
                        س
                      </div>
                      <span className="text-xs font-bold text-graphite-body truncate">
                        حلول سديم
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold font-mono text-mint-win shrink-0">
                      24,000 ر.س
                    </span>
                  </div>
                  <p className="text-[11px] text-ash-helper line-clamp-1">
                    تم توقيع العقد السنوي
                  </p>
                  <div className="flex items-center justify-between pt-1 border-t border-stone-divider/60 text-[10px] text-ash-helper">
                    <span className="text-mint-win font-medium">مكتملة بنجاح</span>
                    <span className="text-[10px]">🏆</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature Highlights (Dense 12px gap, pill badges) */}
          <div className="grid grid-cols-3 gap-3 pt-1">
            <div className="rounded-2xl border border-stone-divider bg-surface-card/80 p-3.5 shadow-xs backdrop-blur-sm">
              <div className="flex size-8 items-center justify-center rounded-xl bg-lavender-wash text-royal-signal mb-2">
                <Layers className="size-4" />
              </div>
              <h2 className="text-xs font-bold text-midnight-ink mb-1">
                {t('feature1Title')}
              </h2>
              <p className="text-[11px] text-ash-helper leading-normal line-clamp-2">
                {t('feature1Desc')}
              </p>
            </div>

            <div className="rounded-2xl border border-stone-divider bg-surface-card/80 p-3.5 shadow-xs backdrop-blur-sm">
              <div className="flex size-8 items-center justify-center rounded-xl bg-lavender-wash text-royal-signal mb-2">
                <Clock className="size-4" />
              </div>
              <h2 className="text-xs font-bold text-midnight-ink mb-1">
                {t('feature2Title')}
              </h2>
              <p className="text-[11px] text-ash-helper leading-normal line-clamp-2">
                {t('feature2Desc')}
              </p>
            </div>

            <div className="rounded-2xl border border-stone-divider bg-surface-card/80 p-3.5 shadow-xs backdrop-blur-sm">
              <div className="flex size-8 items-center justify-center rounded-xl bg-lavender-wash text-royal-signal mb-2">
                <TrendingUp className="size-4" />
              </div>
              <h2 className="text-xs font-bold text-midnight-ink mb-1">
                {t('feature3Title')}
              </h2>
              <p className="text-[11px] text-ash-helper leading-normal line-clamp-2">
                {t('feature3Desc')}
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Trust & Security Banner */}
        <footer className="relative z-10 flex items-center justify-between pt-5 border-t border-stone-divider text-xs text-ash-helper">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-royal-signal" />
            <span>معايير أمان موثوقة وتشفير عالي الحماية</span>
          </div>
          <span className="font-mono text-[11px] text-ash-helper">Scope v2.6 Enterprise</span>
        </footer>
      </section>

      {/* 2. AUTHENTICATION PORTAL PANE (Relate-Style Snow Canvas & Pill Form) */}
      <section className="flex-1 lg:col-span-5 xl:col-span-5 flex flex-col justify-between p-6 sm:p-10 lg:p-12 xl:p-16 relative bg-snow-canvas">
        {/* Top Controls: Mobile Brand & Language/Theme Switcher in a Pill Container */}
        <div className="flex items-center justify-between w-full">
          {/* Mobile Logo Mark */}
          <div className="flex lg:hidden items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-royal-signal text-white font-bold text-sm shadow-xs">
              s
            </div>
            <span className="font-bold text-midnight-ink text-base tracking-tight">
              Scope CRM
            </span>
          </div>

          {/* Relate Pill Container for Controls */}
          <div className="ms-auto flex items-center gap-1.5 rounded-full border border-stone-divider bg-surface-card px-2 py-1 shadow-xs">
            <LanguageToggle />
            <div className="h-4 w-px bg-stone-divider" />
            <ThemeToggle />
          </div>
        </div>

        {/* Center Card: The Clean Form */}
        <div className="my-auto py-8 w-full max-w-md mx-auto space-y-6">
          {/* Header Title with Inter Typography */}
          <div className="space-y-2 text-start">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-lavender-wash border border-royal-signal/20 px-3 py-1 text-xs font-semibold text-royal-signal">
              <Sparkles className="size-3" />
              <span>Scope CRM Suite</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-semibold tracking-[-0.025em] text-midnight-ink">
              {t('welcomeBack')}
            </h2>

            <p className="text-xs sm:text-sm text-slate-caption leading-relaxed">
              {t('loginDescription')}
            </p>
          </div>

          {/* Login Form Component */}
          <LoginForm />
        </div>

        {/* Footer */}
        <footer className="w-full text-center text-xs text-ash-helper pt-4 border-t border-stone-divider/70">
          <p>© 2026 Scope CRM. جميع الحقوق محفوظة.</p>
        </footer>
      </section>
    </main>
  );
}
