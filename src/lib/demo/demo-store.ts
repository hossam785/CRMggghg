import { env } from '@/lib/env';
import type { Lead, LeadInput, LeadListRow, LeadSort } from '@/features/leads/schema';
import type { LeadStage, FollowUpQueueRow } from '@/types/database';
import type { Industry, SettingsRow } from '@/features/settings/api';
import type { RawDashboardStats } from '@/features/dashboard/types';

export function isDemoMode(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    env.NEXT_PUBLIC_SUPABASE_URL.includes('example.supabase.co') ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
  );
}

export const DEMO_INDUSTRIES: Industry[] = [
  { id: 1, owner_id: '00000000-0000-0000-0000-000000000001', key: 'cafes', label_ar: 'كافيهات ومطاعم', label_en: 'Cafes & Restaurants', sort_order: 10, is_active: true, is_other: false },
  { id: 2, owner_id: '00000000-0000-0000-0000-000000000001', key: 'clinics', label_ar: 'عيادات ومراكز طبية', label_en: 'Clinics & Medical Centers', sort_order: 20, is_active: true, is_other: false },
  { id: 3, owner_id: '00000000-0000-0000-0000-000000000001', key: 'real_estate', label_ar: 'عقارات واستثمار عقاري', label_en: 'Real Estate', sort_order: 30, is_active: true, is_other: false },
  { id: 4, owner_id: '00000000-0000-0000-0000-000000000001', key: 'retail', label_ar: 'تجارة تجزئة ومتاجر إلكترونية', label_en: 'Retail & E-commerce', sort_order: 40, is_active: true, is_other: false },
  { id: 5, owner_id: '00000000-0000-0000-0000-000000000001', key: 'legal', label_ar: 'خدمات قانونية ومحاماة', label_en: 'Legal & Law', sort_order: 50, is_active: true, is_other: false },
  { id: 6, owner_id: '00000000-0000-0000-0000-000000000001', key: 'gyms', label_ar: 'نوادي رياضية ولياقة', label_en: 'Gyms & Fitness', sort_order: 60, is_active: true, is_other: false },
  { id: 7, owner_id: '00000000-0000-0000-0000-000000000001', key: 'other', label_ar: 'أخرى', label_en: 'Other', sort_order: 70, is_active: true, is_other: true },
];

export const DEMO_COUNTRIES = [
  { code: 'EG', name_ar: 'مصر', name_en: 'Egypt', dial_code: '+20' },
  { code: 'SA', name_ar: 'المملكة العربية السعودية', name_en: 'Saudi Arabia', dial_code: '+966' },
  { code: 'AE', name_ar: 'الإمارات العربية المتحدة', name_en: 'United Arab Emirates', dial_code: '+971' },
  { code: 'KW', name_ar: 'الكويت', name_en: 'Kuwait', dial_code: '+965' },
  { code: 'QA', name_ar: 'قطر', name_en: 'Qatar', dial_code: '+974' },
  { code: 'BH', name_ar: 'البحرين', name_en: 'Bahrain', dial_code: '+973' },
  { code: 'OM', name_ar: 'عُمان', name_en: 'Oman', dial_code: '+968' },
  { code: 'JO', name_ar: 'الأردن', name_en: 'Jordan', dial_code: '+962' },
];

const INITIAL_DEMO_LEADS: Lead[] = [
  {
    id: '10000000-0000-0000-0000-000000000001',
    owner_id: '00000000-0000-0000-0000-000000000001',
    name: 'أحمد محمود العويسي',
    company: 'مجموعة العويسي العقارية',
    industry_id: 3,
    industry_other: null,
    job_title: 'الرئيس التنفيذي',
    instagram_handle: 'eloweisy_properties',
    whatsapp_e164: '+201012345678',
    country_code: 'EG',
    stage: 'meeting_booked',
    stage_changed_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    first_message_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    last_contacted_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    follow_ups_sent: 1,
    next_follow_up_on: new Date().toISOString().split('T')[0] ?? null,
    reminder_note: 'تجهيز عرض الأسعار والنموذج الأولي للفيديو',
    replied_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    meeting_booked_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    meeting_at: new Date(Date.now() + 1 * 86400000).toISOString(),
    proposal_sent_at: null,
    won_at: null,
    lost_at: null,
    lost_reason: null,
    import_job_id: null,
    missing_fields: [],
    search_text: 'احمد محمود العويسي مجموعة العويسي العقارية eloweisy_properties 201012345678',
    notes: 'مهتم بتطوير حملات الفيديو والمحتوى التسويقي لمشروع الساحل الجديد',
    has_content: true,
    appears_in_content: true,
    has_videographer: 'no',
    problems: 'قلة التفاعل مع المنشورات الحالية وضعف وصول الإعلانات',
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    deleted_at: null,
  },
  {
    id: '10000000-0000-0000-0000-000000000002',
    owner_id: '00000000-0000-0000-0000-000000000001',
    name: 'د. سارة المنصوري',
    company: 'عيادات ديرما لايف التخصصية',
    industry_id: 2,
    industry_other: null,
    job_title: 'المدير الطبي',
    instagram_handle: 'dermalife_clinics',
    whatsapp_e164: '+966501234567',
    country_code: 'SA',
    stage: 'proposal_sent',
    stage_changed_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    first_message_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    last_contacted_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    follow_ups_sent: 2,
    next_follow_up_on: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0] ?? null,
    reminder_note: null,
    replied_at: new Date(Date.now() - 8 * 86400000).toISOString(),
    meeting_booked_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    meeting_at: new Date(Date.now() - 4 * 86400000).toISOString(),
    proposal_sent_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    won_at: null,
    lost_at: null,
    lost_reason: null,
    import_job_id: null,
    missing_fields: [],
    search_text: 'سارة المنصوري عيادات ديرما لايف dermalife_clinics 966501234567',
    notes: 'تم إرسال العرض المالي الخاص بإدارة حسابات التواصل والتصوير الطبي',
    has_content: true,
    appears_in_content: false,
    has_videographer: 'yes',
    problems: 'جودة تصوير مقاطع Reels الحالية غير احترافية',
    created_at: new Date(Date.now() - 12 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    deleted_at: null,
  },
  {
    id: '10000000-0000-0000-0000-000000000003',
    owner_id: '00000000-0000-0000-0000-000000000001',
    name: 'كريم عبد العزيز',
    company: 'سلسلة مطاعم كافيه موكا',
    industry_id: 1,
    industry_other: null,
    job_title: 'مدير العمليات',
    instagram_handle: 'moka_cafe_eg',
    whatsapp_e164: '+201122334455',
    country_code: 'EG',
    stage: 'won',
    stage_changed_at: new Date(Date.now() - 4 * 86400000).toISOString(),
    first_message_at: new Date(Date.now() - 18 * 86400000).toISOString(),
    last_contacted_at: new Date(Date.now() - 4 * 86400000).toISOString(),
    follow_ups_sent: 3,
    next_follow_up_on: null,
    reminder_note: null,
    replied_at: new Date(Date.now() - 14 * 86400000).toISOString(),
    meeting_booked_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    meeting_at: new Date(Date.now() - 9 * 86400000).toISOString(),
    proposal_sent_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    won_at: new Date(Date.now() - 4 * 86400000).toISOString(),
    lost_at: null,
    lost_reason: null,
    import_job_id: null,
    missing_fields: [],
    search_text: 'كريم عبد العزيز سلسلة مطاعم كافيه موكا moka_cafe_eg 201122334455',
    notes: 'تم توقيع العقد السنوي للإنتاج الإعلامي وإدارة الإعلانات الممولة',
    has_content: true,
    appears_in_content: true,
    has_videographer: 'yes',
    problems: 'الحاجة لتوسيع قاعدة العملاء في فروع الشيخ زايد والتجمع',
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 4 * 86400000).toISOString(),
    deleted_at: null,
  },
  {
    id: '10000000-0000-0000-0000-000000000004',
    owner_id: '00000000-0000-0000-0000-000000000001',
    name: 'م. فهد التميمي',
    company: 'التميمي للحلول الذكية',
    industry_id: 4,
    industry_other: null,
    job_title: 'مؤسس ومدير عام',
    instagram_handle: 'tamimi_smart_tech',
    whatsapp_e164: '+971551234567',
    country_code: 'AE',
    stage: 'message_sent',
    stage_changed_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    first_message_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    last_contacted_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    follow_ups_sent: 1,
    next_follow_up_on: new Date().toISOString().split('T')[0] ?? null,
    reminder_note: null,
    replied_at: null,
    meeting_booked_at: null,
    meeting_at: null,
    proposal_sent_at: null,
    won_at: null,
    lost_at: null,
    lost_reason: null,
    import_job_id: null,
    missing_fields: [],
    search_text: 'فهد التميمي التميمي للحلول الذكية tamimi_smart_tech 971551234567',
    notes: 'تمت أول محادثة واتساب والعميل مرحب بفكرة تطوير المتجر الإلكتروني',
    has_content: false,
    appears_in_content: false,
    has_videographer: 'no',
    problems: 'عدم وجود محتوى مرئي يعرّف بالمنتجات',
    created_at: new Date(Date.now() - 6 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    deleted_at: null,
  },
  {
    id: '10000000-0000-0000-0000-000000000005',
    owner_id: '00000000-0000-0000-0000-000000000001',
    name: 'مها الشريف',
    company: 'أكاديمية فيتنس بلس',
    industry_id: 6,
    industry_other: null,
    job_title: 'مديرة التسويق',
    instagram_handle: 'fitness_plus_academy',
    whatsapp_e164: '+966559876543',
    country_code: 'SA',
    stage: 'new',
    stage_changed_at: new Date().toISOString(),
    first_message_at: null,
    last_contacted_at: null,
    follow_ups_sent: 0,
    next_follow_up_on: new Date().toISOString().split('T')[0] ?? null,
    reminder_note: null,
    replied_at: null,
    meeting_booked_at: null,
    meeting_at: null,
    proposal_sent_at: null,
    won_at: null,
    lost_at: null,
    lost_reason: null,
    import_job_id: null,
    missing_fields: [],
    search_text: 'مها الشريف اكاديمية فيتنس بلس fitness_plus_academy 966559876543',
    notes: 'عميل جديد تمت إضافته من حملة إنستجرام لم يتم التواصل معه بعد',
    has_content: true,
    appears_in_content: false,
    has_videographer: 'unknown',
    problems: 'ضعف تسجيل المشتركات الجدد في الفروع',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null,
  },
];

const STORAGE_KEY_LEADS = 'scope_demo_leads';
const STORAGE_KEY_INDUSTRIES = 'scope_demo_industries';
const STORAGE_KEY_SETTINGS = 'scope_demo_settings';

class DemoStore {
  public getLeadsRaw(): Lead[] {
    if (typeof window === 'undefined') return INITIAL_DEMO_LEADS;
    try {
      const stored = localStorage.getItem(STORAGE_KEY_LEADS);
      if (stored) return JSON.parse(stored);
    } catch {}
    this.saveLeadsRaw(INITIAL_DEMO_LEADS);
    return INITIAL_DEMO_LEADS;
  }

  private saveLeadsRaw(leads: Lead[]) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY_LEADS, JSON.stringify(leads));
    } catch {}
  }

  getIndustries(): Industry[] {
    if (typeof window === 'undefined') return DEMO_INDUSTRIES;
    try {
      const stored = localStorage.getItem(STORAGE_KEY_INDUSTRIES);
      if (stored) return JSON.parse(stored);
    } catch {}
    return DEMO_INDUSTRIES;
  }

  getCountries() {
    return DEMO_COUNTRIES;
  }

  getSettings(): SettingsRow {
    const fallback: SettingsRow = {
      owner_id: '00000000-0000-0000-0000-000000000001',
      locale: 'ar',
      timezone: 'Africa/Cairo',
      default_country: 'EG',
      fu1_after_days: 2,
      fu2_after_days: 3,
      fu3_after_days: 4,
      give_up_after_days: 5,
      updated_at: new Date().toISOString(),
    };
    if (typeof window === 'undefined') return fallback;
    try {
      const stored = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (stored) return JSON.parse(stored);
    } catch {}
    return fallback;
  }

  updateSettings(patch: Partial<SettingsRow>): SettingsRow {
    const current = this.getSettings();
    const updated = { ...current, ...patch, updated_at: new Date().toISOString() };
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(updated));
      } catch {}
    }
    return updated;
  }

  searchLeads(args: {
    p_query?: string | null;
    p_stages?: LeadStage[] | null;
    p_industries?: number[] | null;
    p_countries?: string[] | null;
    p_sort?: LeadSort;
    p_limit?: number;
  }): LeadListRow[] {
    let leads = this.getLeadsRaw().filter((l) => !l.deleted_at);

    if (args.p_query && args.p_query.trim()) {
      const q = args.p_query.toLowerCase().trim();
      leads = leads.filter(
        (l) =>
          l.name.toLowerCase().includes(q) ||
          (l.company && l.company.toLowerCase().includes(q)) ||
          (l.instagram_handle && l.instagram_handle.toLowerCase().includes(q)) ||
          (l.whatsapp_e164 && l.whatsapp_e164.includes(q))
      );
    }

    if (args.p_stages && args.p_stages.length > 0) {
      leads = leads.filter((l) => args.p_stages!.includes(l.stage));
    }

    if (args.p_industries && args.p_industries.length > 0) {
      leads = leads.filter((l) => l.industry_id && args.p_industries!.includes(l.industry_id));
    }

    if (args.p_countries && args.p_countries.length > 0) {
      leads = leads.filter((l) => l.country_code && args.p_countries!.includes(l.country_code));
    }

    leads.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return leads.map((l, idx) => ({
      id: l.id,
      name: l.name,
      company: l.company,
      instagram_handle: l.instagram_handle,
      whatsapp_e164: l.whatsapp_e164,
      industry_id: l.industry_id,
      industry_other: l.industry_other,
      country_code: l.country_code,
      stage: l.stage,
      last_contacted_at: l.last_contacted_at,
      next_follow_up_on: l.next_follow_up_on,
      follow_ups_sent: l.follow_ups_sent,
      missing_fields: l.missing_fields || [],
      created_at: l.created_at,
      rank: idx + 1,
      next_cursor: null,
    }));
  }

  getLead(id: string): Lead | null {
    return this.getLeadsRaw().find((l) => l.id === id) || null;
  }

  createLead(input: LeadInput): Lead {
    const leads = this.getLeadsRaw();
    const newLead: Lead = {
      id: crypto.randomUUID(),
      owner_id: '00000000-0000-0000-0000-000000000001',
      name: input.name,
      company: input.company || null,
      industry_id: input.industry_id ?? null,
      industry_other: input.industry_other || null,
      job_title: input.job_title || null,
      instagram_handle: input.instagram_handle || null,
      whatsapp_e164: input.whatsapp_e164 || null,
      country_code: input.country_code || null,
      notes: input.notes || null,
      has_content: input.has_content ?? null,
      appears_in_content: input.appears_in_content ?? null,
      has_videographer: input.has_videographer ?? 'unknown',
      problems: input.problems || null,
      stage: 'new',
      stage_changed_at: new Date().toISOString(),
      first_message_at: null,
      last_contacted_at: null,
      follow_ups_sent: 0,
      next_follow_up_on: new Date().toISOString().split('T')[0] ?? null,
      reminder_note: null,
      replied_at: null,
      meeting_booked_at: null,
      meeting_at: null,
      proposal_sent_at: null,
      won_at: null,
      lost_at: null,
      lost_reason: null,
      import_job_id: null,
      missing_fields: [],
      search_text: `${input.name} ${input.company || ''} ${input.instagram_handle || ''} ${input.whatsapp_e164 || ''}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
    };

    leads.unshift(newLead);
    this.saveLeadsRaw(leads);
    return newLead;
  }

  updateLead(id: string, patch: Partial<Lead>): Lead {
    const leads = this.getLeadsRaw();
    const idx = leads.findIndex((l) => l.id === id);
    if (idx === -1) throw new Error('Lead not found');

    const updated = {
      ...leads[idx]!,
      ...patch,
      updated_at: new Date().toISOString(),
    };
    leads[idx] = updated;
    this.saveLeadsRaw(leads);
    return updated;
  }

  softDeleteLead(id: string): void {
    this.updateLead(id, { deleted_at: new Date().toISOString() });
  }

  restoreLead(id: string): void {
    this.updateLead(id, { deleted_at: null });
  }

  listTrashLeads(): Lead[] {
    return this.getLeadsRaw()
      .filter((l) => Boolean(l.deleted_at))
      .sort((a, b) => new Date(b.deleted_at!).getTime() - new Date(a.deleted_at!).getTime());
  }

  leadAction(args: {
    leadId: string;
    action: string;
    payload?: Record<string, unknown>;
  }): { lead: Lead; event_id: number } {
    const lead = this.getLead(args.leadId);
    if (!lead) throw new Error('Lead not found');

    let newStage: LeadStage = lead.stage;
    let lastContactedAt = lead.last_contacted_at;
    let followUpsSent = lead.follow_ups_sent;

    switch (args.action) {
      case 'mark_contacted':
        newStage = 'message_sent';
        lastContactedAt = new Date().toISOString();
        followUpsSent = (followUpsSent || 0) + 1;
        break;
      case 'qualify':
        newStage = 'replied';
        break;
      case 'send_proposal':
        newStage = 'proposal_sent';
        break;
      case 'win':
        newStage = 'won';
        break;
      case 'lose':
        newStage = 'lost';
        break;
    }

    const updated = this.updateLead(args.leadId, {
      stage: newStage,
      last_contacted_at: lastContactedAt,
      follow_ups_sent: followUpsSent,
      stage_changed_at: new Date().toISOString(),
    });

    return { lead: updated, event_id: Date.now() };
  }

  getFollowUpQueue(): FollowUpQueueRow[] {
    const leads = this.getLeadsRaw().filter((l) => !l.deleted_at && l.stage !== 'won' && l.stage !== 'lost');
    return leads.map((l, idx) => ({
      id: l.id,
      name: l.name,
      instagram_handle: l.instagram_handle,
      whatsapp_e164: l.whatsapp_e164,
      industry_id: l.industry_id,
      country_code: l.country_code,
      stage: l.stage,
      last_contacted_at: l.last_contacted_at,
      next_follow_up_on: l.next_follow_up_on,
      reminder_note: l.reminder_note,
      meeting_at: l.meeting_at,
      bucket: 'due_fu1',
      bucket_total: leads.length,
      days_overdue: idx + 1,
    }));
  }

  getStageCounts(): { stage: LeadStage; total: number }[] {
    const leads = this.getLeadsRaw().filter((l) => !l.deleted_at);
    const stages: LeadStage[] = [
      'new',
      'message_sent',
      'follow_up_1',
      'follow_up_2',
      'follow_up_3',
      'replied',
      'meeting_booked',
      'proposal_sent',
      'won',
      'lost',
    ];
    return stages.map((stage) => ({
      stage,
      total: leads.filter((l) => l.stage === stage).length,
    }));
  }

  getDashboardStats(_from?: string, _to?: string): RawDashboardStats {
    void _from;
    void _to;
    const leads = this.getLeadsRaw().filter((l) => !l.deleted_at);
    const totalLeads = leads.length;

    const pipeline: Record<string, number> = {};
    leads.forEach((l) => {
      pipeline[l.stage] = (pipeline[l.stage] || 0) + 1;
    });

    const notContacted = leads.filter((l) => l.stage === 'new').length;
    const wonCount = leads.filter((l) => l.stage === 'won').length;

    return {
      total_leads: totalLeads,
      pipeline,
      new_leads: {
        cur: totalLeads,
        prev: Math.max(1, totalLeads - 2),
      },
      not_contacted: notContacted,
      cur: {
        first_messages: leads.filter((l) => l.first_message_at !== null).length,
        follow_ups: leads.reduce((sum, l) => sum + (l.follow_ups_sent || 0), 0),
        replied: leads.filter((l) => l.replied_at !== null).length,
        meetings: leads.filter((l) => l.meeting_booked_at !== null).length,
        won: wonCount,
      },
      prev: {
        first_messages: Math.max(0, totalLeads - 2),
        follow_ups: 3,
        replied: 2,
        meetings: 1,
        won: Math.max(0, wonCount - 1),
      },
    };
  }
}

export const demoStore = new DemoStore();
