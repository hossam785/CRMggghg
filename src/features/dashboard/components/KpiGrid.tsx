'use client';

import * as React from 'react';
import {
  Users,
  UserPlus,
  Send,
  MessageSquareText,
  Calendar,
  Trophy,
} from 'lucide-react';
import type { RawDashboardStats } from '../types';
import { computeDelta } from '../types';
import { KpiCard } from './KpiCard';

interface KpiGridProps {
  stats: RawDashboardStats;
}

export function KpiGrid({ stats }: KpiGridProps) {
  // 1. Total Leads
  const newLeadsDelta = computeDelta(stats.new_leads.cur, stats.new_leads.prev);

  // 2. Outreach (First messages + Follow ups)
  const totalOutreachCur = stats.cur.first_messages + stats.cur.follow_ups;
  const totalOutreachPrev = stats.prev.first_messages + stats.prev.follow_ups;
  const outreachDelta = computeDelta(totalOutreachCur, totalOutreachPrev);

  // 3. Replies
  const repliesDelta = computeDelta(stats.cur.replied, stats.prev.replied);
  const replyRate = totalOutreachCur > 0 ? Math.round((stats.cur.replied / totalOutreachCur) * 100) : 0;

  // 4. Meetings
  const meetingsDelta = computeDelta(stats.cur.meetings, stats.prev.meetings);

  // 5. Won
  const wonDelta = computeDelta(stats.cur.won, stats.prev.won);
  const convRate = stats.cur.meetings > 0 ? Math.round((stats.cur.won / stats.cur.meetings) * 100) : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* 1. Total Leads */}
      <KpiCard
        title="إجمالي العملاء"
        value={stats.total_leads}
        hint={`+${stats.new_leads.cur.toLocaleString('ar-EG')} في الفترة المحددة`}
        delta={newLeadsDelta}
        icon={<Users className="size-4" />}
        href="/leads"
      />

      {/* 2. New Leads */}
      <KpiCard
        title="عملاء جدد (New)"
        value={stats.new_leads.cur}
        hint={`${stats.not_contacted.toLocaleString('ar-EG')} لم يتم التواصل معهم بعد`}
        delta={newLeadsDelta}
        icon={<UserPlus className="size-4" />}
        href="/leads?stage=new"
      />

      {/* 3. Messages Sent */}
      <KpiCard
        title="الرسائل المرسلة"
        value={totalOutreachCur}
        hint={`${stats.cur.first_messages.toLocaleString('ar-EG')} أولى · ${stats.cur.follow_ups.toLocaleString('ar-EG')} متابعة`}
        delta={outreachDelta}
        icon={<Send className="size-4" />}
      />

      {/* 4. Replies */}
      <KpiCard
        title="الردود ومعدل التفاعل"
        value={stats.cur.replied}
        hint={`معدل الرد: ${replyRate}% من إجمالي الرسائل`}
        delta={repliesDelta}
        icon={<MessageSquareText className="size-4" />}
        href="/leads?stage=replied"
      />

      {/* 5. Meetings Booked */}
      <KpiCard
        title="اجتماعات محجوزة"
        value={stats.cur.meetings}
        hint="تم الاتفاق على موعد اجتماع مع العميل"
        delta={meetingsDelta}
        icon={<Calendar className="size-4" />}
        href="/leads?stage=meeting_booked"
      />

      {/* 6. Won Deals */}
      <KpiCard
        title="صفقات ناجحة (Won)"
        value={stats.cur.won}
        hint={`نسبة النجاح من الاجتماعات: ${convRate}%`}
        delta={wonDelta}
        icon={<Trophy className="size-4" />}
        href="/leads?stage=won"
      />
    </div>
  );
}
