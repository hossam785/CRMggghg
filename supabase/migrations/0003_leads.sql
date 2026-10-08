-- Migration: 0003_leads.sql
-- Enums, industries, leads table, normalization, derivation trigger, touch trigger, RLS, and indexes

-- 1. Enums
create type public.lead_stage as enum (
  'new',
  'message_sent',
  'follow_up_1',
  'follow_up_2',
  'follow_up_3',
  'replied',
  'meeting_booked',
  'proposal_sent',
  'won',
  'lost'
);

create type public.tri_state as enum ('yes', 'no', 'unknown');

-- 2. Industries Table
create table public.industries (
  id          smallint generated always as identity primary key,
  owner_id    uuid not null default auth.uid() references auth.users on delete cascade,
  key         text not null,
  label_ar    text not null,
  label_en    text not null,
  sort_order  smallint not null default 0,
  is_other    boolean not null default false,
  is_active   boolean not null default true,
  unique (owner_id, key)
);

create index industries_owner_idx on public.industries (owner_id, sort_order) where is_active is true;

alter table public.industries enable row level security;
create policy own on public.industries
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- 3. Leads Table
create table public.leads (
  id                 uuid primary key default gen_random_uuid(),
  owner_id           uuid not null default auth.uid() references auth.users on delete cascade,

  -- Lead Profile
  name               text not null check (char_length(btrim(name)) between 1 and 120),
  company            text check (char_length(company) <= 120),
  industry_id        smallint references public.industries(id) on delete set null,
  industry_other     text check (char_length(industry_other) <= 80),
  job_title          text check (char_length(job_title) <= 80),
  instagram_handle   text check (instagram_handle ~ '^[a-z0-9._]{1,30}$'),
  whatsapp_e164      text check (whatsapp_e164 ~ '^\+[1-9][0-9]{6,14}$'),
  country_code       char(2) references public.countries(code) on delete set null,
  notes              text check (char_length(notes) <= 5000),

  -- Qualification
  has_content        boolean,
  appears_in_content boolean,
  has_videographer   public.tri_state not null default 'unknown',
  problems           text check (char_length(problems) <= 280),

  -- Pipeline
  stage              public.lead_stage not null default 'new',
  stage_changed_at   timestamptz not null default now(),
  first_message_at   timestamptz,
  last_contacted_at  timestamptz,
  follow_ups_sent    smallint not null default 0 check (follow_ups_sent between 0 and 3),
  next_follow_up_on  date,
  reminder_note      text check (char_length(reminder_note) <= 140),
  replied_at         timestamptz,
  meeting_booked_at  timestamptz,
  meeting_at         timestamptz,
  proposal_sent_at   timestamptz,
  won_at             timestamptz,
  lost_at            timestamptz,
  lost_reason        text check (lost_reason in ('not_interested', 'no_reply', 'budget', 'timing', 'other')),

  -- System Metadata
  import_job_id      uuid,
  missing_fields     text[] not null default '{}',
  search_text        text not null default '',
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  deleted_at         timestamptz,

  constraint has_contact check (instagram_handle is not null or whatsapp_e164 is not null)
);

alter table public.leads enable row level security;
create policy own on public.leads
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- 4. Normalization & Derivation Functions
create or replace function public.normalize_search(t text) returns text
language sql immutable parallel safe set search_path = public, extensions as $$
  select lower(regexp_replace(
           translate(extensions.unaccent('extensions.unaccent'::regdictionary, coalesce(t, '')),
                     'أإآٱىة٠١٢٣٤٥٦٧٨٩', 'اااايه0123456789'),
           E'[\u064B-\u065F\u0670\u0640]', '', 'g'))
$$;

create or replace function public.leads_derive() returns trigger
language plpgsql set search_path = public, extensions as $$
declare
  v_ind text;
  v_cty text;
begin
  -- Whitespace trimming and empty string normalization
  new.name      := btrim(regexp_replace(new.name, '\s+', ' ', 'g'));
  new.company   := nullif(btrim(new.company), '');
  new.job_title := nullif(btrim(new.job_title), '');

  -- Fetch labels for search_text
  select concat_ws(' ', label_ar, label_en) into v_ind from public.industries where id = new.industry_id;
  select concat_ws(' ', name_ar, name_en)   into v_cty from public.countries  where code = new.country_code;

  -- Build search text
  new.search_text := public.normalize_search(concat_ws(' ',
      new.name, new.company, new.job_title, new.instagram_handle,
      regexp_replace(coalesce(new.whatsapp_e164, ''), '\D', '', 'g'),
      new.industry_other, new.notes, new.problems, v_ind, v_cty));

  -- Derive missing fields
  new.missing_fields := array_remove(array[
      case when new.industry_id  is null then 'industry' end,
      case when new.country_code is null then 'country'  end,
      case when nullif(btrim(new.job_title), '') is null then 'job_title' end,
      case when new.has_content is null or new.appears_in_content is null
             or new.has_videographer = 'unknown' then 'qualification' end
    ], null);

  return new;
end;
$$;

create trigger leads_derive before insert or update on public.leads
  for each row execute function public.leads_derive();

create trigger leads_updated before update on public.leads
  for each row execute function public.set_updated_at();

-- Industry label update re-indexes associated leads
create or replace function public.industries_touch_leads() returns trigger
language plpgsql set search_path = public as $$
begin
  if new.label_ar is distinct from old.label_ar or new.label_en is distinct from old.label_en then
    update public.leads set industry_id = industry_id where industry_id = new.id;
  end if;
  return new;
end;
$$;

create trigger industries_touch after update on public.industries
  for each row execute function public.industries_touch_leads();

-- 5. User Creation Trigger (Settings + Backup Settings + 7 Spec Industries)
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public, extensions as $$
begin
  insert into public.settings (owner_id) values (new.id)
    on conflict (owner_id) do nothing;
  insert into public.backup_settings (owner_id, next_run_at) values (new.id, null)
    on conflict (owner_id) do nothing;
  insert into public.industries (owner_id, key, label_ar, label_en, sort_order, is_other) values
    (new.id, 'real_estate_consultant', 'مستشار عقاري',  'Real Estate Consultant', 1, false),
    (new.id, 'real_estate_company',    'شركة عقارية',   'Real Estate Company',    2, false),
    (new.id, 'founder_ceo',            'Founder / CEO', 'Founder / CEO',          3, false),
    (new.id, 'business_consultant',    'مستشار أعمال',  'Business Consultant',    4, false),
    (new.id, 'doctor',                 'طبيب',          'Doctor',                 5, false),
    (new.id, 'clinic',                 'عيادة طبية',    'Medical Clinic',         6, false),
    (new.id, 'other',                  'أخرى',          'Other',                  7, true)
  on conflict (owner_id, key) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- 6. Backfill 7 Spec Industries for any pre-existing users (idempotent)
insert into public.industries (owner_id, key, label_ar, label_en, sort_order, is_other)
select u.id, ind.key, ind.label_ar, ind.label_en, ind.sort_order, ind.is_other
from auth.users u
cross join (
  values
    ('real_estate_consultant', 'مستشار عقاري',  'Real Estate Consultant', 1::smallint, false),
    ('real_estate_company',    'شركة عقارية',   'Real Estate Company',    2::smallint, false),
    ('founder_ceo',            'Founder / CEO', 'Founder / CEO',          3::smallint, false),
    ('business_consultant',    'مستشار أعمال',  'Business Consultant',    4::smallint, false),
    ('doctor',                 'طبيب',          'Doctor',                 5::smallint, false),
    ('clinic',                 'عيادة طبية',    'Medical Clinic',         6::smallint, false),
    ('other',                  'أخرى',          'Other',                  7::smallint, true)
) as ind(key, label_ar, label_en, sort_order, is_other)
where not exists (
  select 1 from public.industries where owner_id = u.id and key = ind.key
);

-- 7. Indexes (§3.6 & §18.3)
-- Standard filtered pagination & filter indexes
create index leads_list_idx         on public.leads (owner_id, created_at desc, id desc) where deleted_at is null;
create index leads_stage_idx        on public.leads (owner_id, stage, created_at desc)  where deleted_at is null;
create index leads_followup_idx     on public.leads (owner_id, next_follow_up_on) where deleted_at is null and next_follow_up_on is not null;
create index leads_industry_idx     on public.leads (owner_id, industry_id) where deleted_at is null;
create index leads_country_idx      on public.leads (owner_id, country_code) where deleted_at is null;
create index leads_last_contact_idx on public.leads (owner_id, last_contacted_at desc nulls last, id desc) where deleted_at is null;
create index leads_name_idx         on public.leads (owner_id, lower(name), id) where deleted_at is null;
create index leads_import_idx       on public.leads (import_job_id) where import_job_id is not null;

-- Uniqueness constraints (per owner, live rows only)
create unique index leads_ig_unique on public.leads (owner_id, instagram_handle)
  where deleted_at is null and instagram_handle is not null;
create unique index leads_wa_unique on public.leads (owner_id, whatsapp_e164)
  where deleted_at is null and whatsapp_e164 is not null;

-- GIN Trigram Search & Missing Fields indexes
create index leads_search_trgm      on public.leads using gin (search_text extensions.gin_trgm_ops) where deleted_at is null;
create index leads_missing_idx      on public.leads using gin (missing_fields) where deleted_at is null;
