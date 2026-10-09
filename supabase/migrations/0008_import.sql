-- Migration 0008_import.sql: Import staging schema, RLS, and RPCs
-- Specifications: §3.5.1, §F10.3, §18.3

-- 1. Custom Types
do $$ begin
  if not exists (select 1 from pg_type where typname = 'import_status') then
    create type import_status as enum ('parsing','staging','validating','review','committing','done','cancelled','failed','rolled_back');
  end if;
  if not exists (select 1 from pg_type where typname = 'import_row_status') then
    create type import_row_status as enum ('valid','incomplete','error','duplicate_db','duplicate_file');
  end if;
end $$;

-- 2. import_jobs table
create table if not exists public.import_jobs (
  id             uuid primary key default gen_random_uuid(),
  owner_id       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  source         text not null check (source in ('xlsx','xls','csv','ods','google_sheet','backup','tsv_paste')),
  file_name      text,
  sheet_name     text,
  mapping        jsonb not null default '{}'::jsonb,
  options        jsonb not null default '{}'::jsonb,
  status         import_status not null default 'parsing',
  total_rows     int not null default 0,
  staged_rows    int not null default 0,
  committed_rows int not null default 0,
  counts         jsonb not null default '{}'::jsonb,
  error          text,
  created_at     timestamptz not null default now(),
  finished_at    timestamptz
);

alter table public.import_jobs enable row level security;

create policy "own import_jobs read" on public.import_jobs
  for select to authenticated using (owner_id = auth.uid());

create policy "own import_jobs insert" on public.import_jobs
  for insert to authenticated with check (owner_id = auth.uid());

create policy "own import_jobs update" on public.import_jobs
  for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "own import_jobs delete" on public.import_jobs
  for delete to authenticated using (owner_id = auth.uid());

create index if not exists import_jobs_owner_idx on public.import_jobs (owner_id, created_at desc);

-- 3. import_rows staging table
create table if not exists public.import_rows (
  job_id         uuid not null references public.import_jobs(id) on delete cascade,
  row_no         int not null,
  owner_id       uuid not null default auth.uid(),
  kind           text not null default 'lead' check (kind in ('lead','event','industry','settings')),
  raw            jsonb not null,
  data           jsonb not null,
  status         import_row_status not null,
  issues         jsonb not null default '[]'::jsonb,
  match_lead_id  uuid references public.leads(id) on delete set null,
  decision       text check (decision in ('import','skip','update')),
  raw_before     jsonb,
  committed_at   timestamptz,
  result_lead_id uuid references public.leads(id) on delete set null,
  primary key (job_id, row_no)
);

alter table public.import_rows enable row level security;

create policy "own import_rows read" on public.import_rows
  for select to authenticated using (owner_id = auth.uid());

create policy "own import_rows insert" on public.import_rows
  for insert to authenticated with check (owner_id = auth.uid());

create policy "own import_rows update" on public.import_rows
  for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "own import_rows delete" on public.import_rows
  for delete to authenticated using (owner_id = auth.uid());

create index if not exists import_rows_status_idx on public.import_rows (job_id, status, row_no);
create index if not exists import_rows_match_lead_idx on public.import_rows (match_lead_id) where match_lead_id is not null;

-- Add import_job_id foreign key reference on leads table if not present
do $$ begin
  if not exists (
    select 1 from information_schema.columns 
    where table_name = 'leads' and column_name = 'import_job_id'
  ) then
    alter table public.leads add column import_job_id uuid references public.import_jobs(id) on delete set null;
    create index leads_import_job_idx on public.leads (import_job_id) where import_job_id is not null;
  end if;
end $$;

-- 4. RPC: stage_import_rows (idempotent for resume)
create or replace function public.stage_import_rows(p_job uuid, p_rows jsonb)
returns int
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_inserted int := 0;
begin
  insert into public.import_rows (job_id, row_no, kind, raw, data, status, issues, owner_id)
  select
    p_job,
    r.row_no,
    coalesce(r.kind, 'lead'),
    r.raw,
    r.data,
    r.status::import_row_status,
    coalesce(r.issues, '[]'::jsonb),
    auth.uid()
  from jsonb_to_recordset(p_rows) as r(
    row_no int,
    kind text,
    raw jsonb,
    data jsonb,
    status text,
    issues jsonb
  )
  on conflict (job_id, row_no) do update set
    kind = excluded.kind,
    raw = excluded.raw,
    data = excluded.data,
    status = excluded.status,
    issues = excluded.issues;

  get diagnostics v_inserted = row_count;

  update public.import_jobs
     set staged_rows = (select count(*) from public.import_rows where job_id = p_job),
         status = 'staging'
   where id = p_job and owner_id = auth.uid();

  return v_inserted;
end;
$$;

-- 5. RPC: finalize_import_staging
create or replace function public.finalize_import_staging(p_job uuid)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_strategy text;
  v_counts jsonb;
  v_job public.import_jobs%rowtype;
begin
  select * into v_job from public.import_jobs where id = p_job and owner_id = auth.uid() for update;
  if not found then
    raise exception 'NOT_FOUND' using errcode = 'P0002';
  end if;

  v_strategy := coalesce(v_job.options->>'duplicate_strategy', 'skip');
  update public.import_jobs set status = 'validating' where id = p_job;

  -- 1) Detect duplicates inside the file (by Instagram handle)
  with d as (
    select row_no,
           row_number() over (partition by data->>'instagram_handle' order by row_no asc) as rn
      from public.import_rows
     where job_id = p_job and kind = 'lead' and status in ('valid', 'incomplete')
       and nullif(trim(data->>'instagram_handle'), '') is not null
  )
  update public.import_rows r
     set status = 'duplicate_file'
    from d
   where r.job_id = p_job and r.row_no = d.row_no and d.rn > 1;

  -- 2) Detect duplicates inside the file (by WhatsApp number)
  with d as (
    select row_no,
           row_number() over (partition by data->>'whatsapp_e164' order by row_no asc) as rn
      from public.import_rows
     where job_id = p_job and kind = 'lead' and status in ('valid', 'incomplete')
       and nullif(trim(data->>'whatsapp_e164'), '') is not null
  )
  update public.import_rows r
     set status = 'duplicate_file'
    from d
   where r.job_id = p_job and r.row_no = d.row_no and d.rn > 1;

  -- 3) Detect duplicates against active leads in DB
  update public.import_rows r
     set status = 'duplicate_db',
         match_lead_id = l.id
    from public.leads l
   where r.job_id = p_job
     and r.kind = 'lead'
     and r.status in ('valid', 'incomplete')
     and l.owner_id = auth.uid()
     and l.deleted_at is null
     and (
       (nullif(trim(r.data->>'instagram_handle'), '') is not null and l.instagram_handle = trim(r.data->>'instagram_handle'))
       or
       (nullif(trim(r.data->>'whatsapp_e164'), '') is not null and l.whatsapp_e164 = trim(r.data->>'whatsapp_e164'))
     );

  -- 4) Set default decisions
  update public.import_rows
     set decision = case status
       when 'valid' then 'import'
       when 'incomplete' then 'import'
       when 'duplicate_db' then case when v_strategy = 'skip' then 'skip' else 'update' end
       else 'skip'
     end
   where job_id = p_job and decision is null;

  -- 5) Aggregate counts
  select coalesce(
    jsonb_object_agg(status, c),
    '{}'::jsonb
  ) into v_counts
  from (
    select status::text, count(*) as c
      from public.import_rows
     where job_id = p_job
     group by status
  ) x;

  update public.import_jobs
     set counts = v_counts,
         status = 'review'
   where id = p_job;

  return v_counts;
end;
$$;

-- 6. RPC: update_import_row
create or replace function public.update_import_row(
  p_job uuid,
  p_row_no int,
  p_data jsonb,
  p_status text,
  p_issues jsonb default '[]'::jsonb
)
returns public.import_rows
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_row public.import_rows%rowtype;
  v_match_id uuid;
  v_status import_row_status := p_status::import_row_status;
  v_decision text;
begin
  -- Re-check DB duplicate for this row
  select id into v_match_id
    from public.leads
   where owner_id = auth.uid()
     and deleted_at is null
     and (
       (nullif(trim(p_data->>'instagram_handle'), '') is not null and instagram_handle = trim(p_data->>'instagram_handle'))
       or
       (nullif(trim(p_data->>'whatsapp_e164'), '') is not null and whatsapp_e164 = trim(p_data->>'whatsapp_e164'))
     )
   limit 1;

  if v_match_id is not null and v_status in ('valid', 'incomplete') then
    v_status := 'duplicate_db';
  end if;

  v_decision := case v_status
    when 'valid' then 'import'
    when 'incomplete' then 'import'
    when 'duplicate_db' then 'update'
    else 'skip'
  end;

  update public.import_rows
     set data = p_data,
         status = v_status,
         issues = coalesce(p_issues, '[]'::jsonb),
         match_lead_id = v_match_id,
         decision = v_decision
   where job_id = p_job and row_no = p_row_no and owner_id = auth.uid()
  returning * into v_row;

  -- Refresh job counts
  update public.import_jobs
     set counts = (
       select coalesce(jsonb_object_agg(status, c), '{}'::jsonb)
         from (select status::text, count(*) as c from public.import_rows where job_id = p_job group by status) x
     )
   where id = p_job;

  return v_row;
end;
$$;

-- 7. RPC: set_import_decisions (bulk decision update)
create or replace function public.set_import_decisions(
  p_job uuid,
  p_status text,
  p_decision text
)
returns int
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_updated int;
begin
  if p_decision not in ('import', 'skip', 'update') then
    raise exception 'INVALID_DECISION' using errcode = 'P0001';
  end if;

  update public.import_rows
     set decision = p_decision
   where job_id = p_job
     and owner_id = auth.uid()
     and status::text = p_status
     and committed_at is null;

  get diagnostics v_updated = row_count;
  return v_updated;
end;
$$;

-- 8. RPC: commit_import (batched execution with raw_before snapshot for rollback)
create or replace function public.commit_import(
  p_job uuid,
  p_batch int default 2000
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_job public.import_jobs%rowtype;
  v_ins int := 0;
  v_upd int := 0;
  v_left int := 0;
  v_mode text;
begin
  select * into v_job from public.import_jobs where id = p_job and owner_id = auth.uid() for update;
  if not found then
    raise exception 'NOT_FOUND' using errcode = 'P0002';
  end if;

  if v_job.status not in ('review', 'committing') then
    raise exception 'INVALID_TRANSITION' using errcode = 'P0001';
  end if;

  v_mode := coalesce(v_job.options->>'duplicate_strategy', 'skip');
  update public.import_jobs set status = 'committing' where id = p_job;

  -- A) Insert new leads batch
  with batch as (
    select *
      from public.import_rows
     where job_id = p_job
       and kind = 'lead'
       and decision = 'import'
       and committed_at is null
     order by row_no asc
     limit least(p_batch, 5000)
     for update skip locked
  ),
  ins as (
    insert into public.leads (
      owner_id,
      name,
      company,
      industry_id,
      industry_other,
      job_title,
      instagram_handle,
      whatsapp_e164,
      country_code,
      notes,
      has_content,
      appears_in_content,
      has_videographer,
      problems,
      stage,
      import_job_id
    )
    select
      auth.uid(),
      b.data->>'name',
      b.data->>'company',
      (b.data->>'industry_id')::smallint,
      b.data->>'industry_other',
      b.data->>'job_title',
      nullif(trim(b.data->>'instagram_handle'), ''),
      nullif(trim(b.data->>'whatsapp_e164'), ''),
      b.data->>'country_code',
      b.data->>'notes',
      (b.data->>'has_content')::boolean,
      (b.data->>'appears_in_content')::boolean,
      coalesce((b.data->>'has_videographer')::tri_state, 'unknown'::tri_state),
      b.data->>'problems',
      coalesce((b.data->>'stage')::lead_stage, 'new'::lead_stage),
      p_job
    from batch b
    on conflict do nothing
    returning id, instagram_handle, whatsapp_e164
  )
  update public.import_rows r
     set committed_at = now(),
         result_lead_id = (
           select i.id
             from ins i
            where (nullif(trim(r.data->>'instagram_handle'), '') is not null and i.instagram_handle = trim(r.data->>'instagram_handle'))
               or (nullif(trim(r.data->>'whatsapp_e164'), '') is not null and i.whatsapp_e164 = trim(r.data->>'whatsapp_e164'))
            limit 1
         )
    from batch b
   where r.job_id = b.job_id and r.row_no = b.row_no;

  get diagnostics v_ins = row_count;

  -- B) Update existing leads batch (for duplicate_db rows marked with 'update')
  with batch as (
    select *
      from public.import_rows
     where job_id = p_job
       and kind = 'lead'
       and decision = 'update'
       and match_lead_id is not null
       and committed_at is null
     order by row_no asc
     limit least(p_batch, 5000)
     for update skip locked
  ),
  before_snap as (
    update public.import_rows r
       set raw_before = to_jsonb(l) - 'search_text'
      from batch b
      join public.leads l on l.id = b.match_lead_id
     where r.job_id = b.job_id and r.row_no = b.row_no
     returning r.row_no
  )
  update public.leads l
     set company = case when v_mode = 'replace' then coalesce(b.data->>'company', l.company) else coalesce(l.company, b.data->>'company') end,
         job_title = case when v_mode = 'replace' then coalesce(b.data->>'job_title', l.job_title) else coalesce(l.job_title, b.data->>'job_title') end,
         industry_id = case when v_mode = 'replace' then coalesce((b.data->>'industry_id')::smallint, l.industry_id) else coalesce(l.industry_id, (b.data->>'industry_id')::smallint) end,
         country_code = case when v_mode = 'replace' then coalesce(b.data->>'country_code', l.country_code) else coalesce(l.country_code, b.data->>'country_code') end,
         whatsapp_e164 = coalesce(l.whatsapp_e164, nullif(trim(b.data->>'whatsapp_e164'), '')),
         instagram_handle = coalesce(l.instagram_handle, nullif(trim(b.data->>'instagram_handle'), '')),
         has_content = case when v_mode = 'replace' and (b.data->>'has_content') is not null then (b.data->>'has_content')::boolean else coalesce(l.has_content, (b.data->>'has_content')::boolean) end,
         appears_in_content = case when v_mode = 'replace' and (b.data->>'appears_in_content') is not null then (b.data->>'appears_in_content')::boolean else coalesce(l.appears_in_content, (b.data->>'appears_in_content')::boolean) end,
         has_videographer = case when v_mode = 'replace' and (b.data->>'has_videographer') is not null then (b.data->>'has_videographer')::tri_state else coalesce(l.has_videographer, (b.data->>'has_videographer')::tri_state) end,
         problems = case when v_mode = 'replace' then coalesce(b.data->>'problems', l.problems) else coalesce(l.problems, b.data->>'problems') end,
         notes = case
           when nullif(trim(b.data->>'notes'), '') is null then l.notes
           when l.notes is null or trim(l.notes) = '' then b.data->>'notes'
           else l.notes || E'\n— ' || (b.data->>'notes')
         end,
         updated_at = now()
    from batch b
   where l.id = b.match_lead_id and l.owner_id = auth.uid();

  get diagnostics v_upd = row_count;

  update public.import_rows
     set committed_at = now()
   where job_id = p_job and decision = 'update' and committed_at is null
     and raw_before is not null;

  -- Count remaining
  select count(*) into v_left
    from public.import_rows
   where job_id = p_job and decision in ('import', 'update') and committed_at is null;

  update public.import_jobs
     set committed_rows = committed_rows + v_ins + v_upd,
         status = case when v_left = 0 then 'done'::import_status else 'committing'::import_status end,
         finished_at = case when v_left = 0 then now() else null end
   where id = p_job;

  return jsonb_build_object(
    'inserted', v_ins,
    'updated', v_upd,
    'remaining', v_left
  );
end;
$$;

-- 9. RPC: rollback_import (within 7 days)
create or replace function public.rollback_import(p_job uuid)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_job public.import_jobs%rowtype;
  v_del int := 0;
  v_res int := 0;
begin
  select * into v_job from public.import_jobs where id = p_job and owner_id = auth.uid() for update;
  if not found then
    raise exception 'NOT_FOUND' using errcode = 'P0002';
  end if;

  if v_job.status <> 'done' or v_job.finished_at < (now() - interval '7 days') then
    raise exception 'INVALID_TRANSITION' using errcode = 'P0001';
  end if;

  -- Soft delete inserted leads
  update public.leads
     set deleted_at = now()
   where import_job_id = p_job and deleted_at is null and owner_id = auth.uid();

  get diagnostics v_del = row_count;

  -- Restore updated leads from raw_before
  update public.leads l
     set company = r.raw_before->>'company',
         job_title = r.raw_before->>'job_title',
         industry_id = (r.raw_before->>'industry_id')::smallint,
         country_code = r.raw_before->>'country_code',
         whatsapp_e164 = r.raw_before->>'whatsapp_e164',
         instagram_handle = r.raw_before->>'instagram_handle',
         notes = r.raw_before->>'notes',
         has_content = (r.raw_before->>'has_content')::boolean,
         appears_in_content = (r.raw_before->>'appears_in_content')::boolean,
         has_videographer = (r.raw_before->>'has_videographer')::tri_state,
         problems = r.raw_before->>'problems',
         updated_at = now()
    from public.import_rows r
   where r.job_id = p_job
     and r.raw_before is not null
     and l.id = r.match_lead_id
     and l.owner_id = auth.uid();

  get diagnostics v_res = row_count;

  update public.import_jobs
     set status = 'rolled_back'
   where id = p_job;

  return jsonb_build_object(
    'deleted', v_del,
    'restored', v_res
  );
end;
$$;
