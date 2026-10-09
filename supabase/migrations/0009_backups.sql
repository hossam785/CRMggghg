-- Migration 0009_backups.sql: Backups schema, push subscriptions, storage, and cron dispatch
-- Specifications: §3.5.1, §F11, §18.3, §18.7

-- 1. backups table
create table if not exists public.backups (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  kind          text not null check (kind in ('scheduled','manual','pre_restore','pre_import')),
  status        text not null default 'pending' check (status in ('pending','running','ready','failed')),
  format        text not null check (format in ('xlsx','csv_zip','json')),
  storage_path  text,
  size_bytes    bigint,
  row_counts    jsonb not null default '{}'::jsonb,
  checksum      text,
  downloaded_at timestamptz,
  last_notified_at timestamptz,
  error         text,
  created_at    timestamptz not null default now()
);

alter table public.backups enable row level security;

create policy "own backups read" on public.backups
  for select to authenticated using (owner_id = auth.uid());

create policy "own backups insert" on public.backups
  for insert to authenticated with check (owner_id = auth.uid());

create policy "own backups update" on public.backups
  for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "own backups delete" on public.backups
  for delete to authenticated using (owner_id = auth.uid());

create index if not exists backups_owner_idx on public.backups (owner_id, created_at desc);

-- 2. push_subscriptions table
create table if not exists public.push_subscriptions (
  id         bigint generated always as identity primary key,
  owner_id   uuid not null default auth.uid() references auth.users(id) on delete cascade,
  endpoint   text not null unique,
  keys       jsonb not null,
  user_agent text,
  created_at timestamptz not null default now()
);

alter table public.push_subscriptions enable row level security;

create policy "own push_subscriptions read" on public.push_subscriptions
  for select to authenticated using (owner_id = auth.uid());

create policy "own push_subscriptions insert" on public.push_subscriptions
  for insert to authenticated with check (owner_id = auth.uid());

create policy "own push_subscriptions delete" on public.push_subscriptions
  for delete to authenticated using (owner_id = auth.uid());

-- 3. Storage bucket and policies
insert into storage.buckets (id, name, public, file_size_limit)
values ('backups', 'backups', false, 104857600)
on conflict (id) do update set public = false, file_size_limit = 104857600;

do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'own backups read storage') then
    create policy "own backups read storage" on storage.objects
      for select to authenticated
      using (bucket_id = 'backups' and (storage.foldername(name))[1] = auth.uid()::text);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'own backups insert storage') then
    create policy "own backups insert storage" on storage.objects
      for insert to authenticated
      with check (bucket_id = 'backups' and (storage.foldername(name))[1] = auth.uid()::text);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'own backups delete storage') then
    create policy "own backups delete storage" on storage.objects
      for delete to authenticated
      using (bucket_id = 'backups' and (storage.foldername(name))[1] = auth.uid()::text);
  end if;
end $$;

-- 4. compute_next_backup function
create or replace function public.compute_next_backup(
  p_freq text,
  p_weekday int,
  p_month_day int,
  p_hour int,
  p_tz text,
  p_from timestamptz
)
returns timestamptz
language plpgsql
stable
set search_path = public
as $$
declare
  local_now timestamp;
  cand timestamp;
begin
  if p_freq = 'off' or p_freq is null then
    return null;
  end if;

  local_now := p_from at time zone coalesce(p_tz, 'UTC');
  cand := date_trunc('day', local_now) + make_interval(hours => coalesce(p_hour, 9));

  case p_freq
    when 'daily' then
      if cand <= local_now then
        cand := cand + interval '1 day';
      end if;
    when 'weekly', 'biweekly' then
      cand := cand + make_interval(days => ((coalesce(p_weekday, 5) - extract(dow from cand)::int + 7) % 7));
      if cand <= local_now then
        cand := cand + interval '7 days';
      end if;
    when 'monthly' then
      cand := date_trunc('month', local_now) + make_interval(days => coalesce(p_month_day, 1) - 1, hours => coalesce(p_hour, 9));
      if cand <= local_now then
        cand := cand + interval '1 month';
      end if;
    else
      return null;
  end case;

  return cand at time zone coalesce(p_tz, 'UTC');
end;
$$;

-- 5. Trigger to update next_run_at in backup_settings
create or replace function public.backup_settings_set_next()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tz text := 'UTC';
begin
  select timezone into v_tz from public.settings where owner_id = new.owner_id;
  new.next_run_at := public.compute_next_backup(
    new.frequency,
    new.weekday,
    new.month_day,
    new.hour_local,
    coalesce(v_tz, 'UTC'),
    now()
  );
  return new;
end;
$$;

drop trigger if exists backup_settings_next on public.backup_settings;
create trigger backup_settings_next
  before insert or update of frequency, weekday, month_day, hour_local
  on public.backup_settings
  for each row execute function public.backup_settings_set_next();

-- 6. RPC: mark_backup_downloaded
create or replace function public.mark_backup_downloaded(p_id uuid)
returns void
language sql
security invoker
set search_path = public
as $$
  update public.backups
     set downloaded_at = coalesce(downloaded_at, now())
   where id = p_id and owner_id = auth.uid();
$$;
