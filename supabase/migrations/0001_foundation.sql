-- Migration: 0001_foundation.sql
-- Foundation migration: extensions, set_updated_at(), settings, backup_settings, and handle_new_user stub

create extension if not exists pgcrypto with schema extensions;
create extension if not exists pg_trgm  with schema extensions;
create extension if not exists unaccent with schema extensions;
create extension if not exists pg_cron;              -- schema cron
create extension if not exists pg_net   with schema extensions;

create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create table public.settings (
  owner_id           uuid primary key default auth.uid() references auth.users on delete cascade,
  locale             text not null default 'ar' check (locale in ('ar','en')),
  timezone           text not null default 'Africa/Cairo',
  default_country    char(2) default 'EG',
  fu1_after_days     smallint not null default 2 check (fu1_after_days between 1 and 60),
  fu2_after_days     smallint not null default 3 check (fu2_after_days between 1 and 60),
  fu3_after_days     smallint not null default 4 check (fu3_after_days between 1 and 60),
  give_up_after_days smallint not null default 5 check (give_up_after_days between 1 and 90),
  updated_at         timestamptz not null default now()
);

create trigger settings_updated before update on public.settings
  for each row execute function public.set_updated_at();

create table public.backup_settings (
  owner_id           uuid primary key default auth.uid() references auth.users on delete cascade,
  frequency          text not null default 'weekly' check (frequency in ('off','daily','weekly','biweekly','monthly')),
  weekday            smallint default 5 check (weekday between 0 and 6),   -- الجمعة افتراضيًا
  month_day          smallint default 1 check (month_day between 1 and 28),
  hour_local         smallint not null default 9 check (hour_local between 0 and 23),
  format             text not null default 'xlsx' check (format in ('xlsx','csv_zip','json')),
  keep_last          smallint not null default 8 check (keep_last between 1 and 52),
  notify_inapp       boolean not null default true,
  notify_push        boolean not null default true,
  notify_email       boolean not null default false,
  next_run_at        timestamptz,
  last_reminded_at   timestamptz
);

alter table public.settings enable row level security;
alter table public.backup_settings enable row level security;

create policy own on public.settings
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy own on public.backup_settings
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- Initial handle_new_user (stub: inserts settings and backup_settings; industries added in 0003)
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public, extensions as $$
begin
  insert into public.settings (owner_id) values (new.id);
  insert into public.backup_settings (owner_id, next_run_at) values (new.id, null);
  return new;
end;
$$;
