-- Migration 0010_restore.sql: Restore commit RPC (merge / replace)
-- Specifications: §F11.4, §18.3, Task 4.18

create or replace function public.restore_commit(
  p_job uuid,
  p_mode text default 'merge' -- 'merge' | 'replace'
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_job public.import_jobs%rowtype;
  v_leads_restored int := 0;
  v_events_restored int := 0;
  v_industries_restored int := 0;
  v_current_deleted int := 0;
begin
  select * into v_job from public.import_jobs where id = p_job and owner_id = auth.uid() for update;
  if not found then
    raise exception 'NOT_FOUND' using errcode = 'P0002';
  end if;

  if p_mode not in ('merge', 'replace') then
    raise exception 'INVALID_MODE' using errcode = 'P0001';
  end if;

  -- 1. If replace mode: soft-delete all existing active leads first
  if p_mode = 'replace' then
    update public.leads
       set deleted_at = now()
     where owner_id = auth.uid() and deleted_at is null;
    get diagnostics v_current_deleted = row_count;
  end if;

  -- 2. Restore industries (if any in staging)
  insert into public.industries (owner_id, key, label_ar, label_en, sort_order, is_other, is_active)
  select auth.uid(),
         data->>'key',
         data->>'label_ar',
         data->>'label_en',
         coalesce((data->>'sort_order')::smallint, 0),
         coalesce((data->>'is_other')::boolean, false),
         coalesce((data->>'is_active')::boolean, true)
    from public.import_rows
   where job_id = p_job and kind = 'industry'
  on conflict (owner_id, key) do update set
    label_ar = excluded.label_ar,
    label_en = excluded.label_en;

  get diagnostics v_industries_restored = row_count;

  -- 3. Restore leads
  insert into public.leads (
    id,
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
    stage_changed_at,
    first_message_at,
    last_contacted_at,
    follow_ups_sent,
    next_follow_up_on,
    reminder_note,
    replied_at,
    meeting_booked_at,
    meeting_at,
    proposal_sent_at,
    won_at,
    lost_at,
    lost_reason,
    created_at,
    updated_at
  )
  select
    coalesce((data->>'id')::uuid, gen_random_uuid()),
    auth.uid(),
    data->>'name',
    data->>'company',
    (data->>'industry_id')::smallint,
    data->>'industry_other',
    data->>'job_title',
    nullif(trim(data->>'instagram_handle'), ''),
    nullif(trim(data->>'whatsapp_e164'), ''),
    data->>'country_code',
    data->>'notes',
    (data->>'has_content')::boolean,
    (data->>'appears_in_content')::boolean,
    coalesce((data->>'has_videographer')::tri_state, 'unknown'::tri_state),
    data->>'problems',
    coalesce((data->>'stage')::lead_stage, 'new'::lead_stage),
    coalesce((data->>'stage_changed_at')::timestamptz, now()),
    (data->>'first_message_at')::timestamptz,
    (data->>'last_contacted_at')::timestamptz,
    coalesce((data->>'follow_ups_sent')::smallint, 0),
    (data->>'next_follow_up_on')::date,
    data->>'reminder_note',
    (data->>'replied_at')::timestamptz,
    (data->>'meeting_booked_at')::timestamptz,
    (data->>'meeting_at')::timestamptz,
    (data->>'proposal_sent_at')::timestamptz,
    (data->>'won_at')::timestamptz,
    (data->>'lost_at')::timestamptz,
    (data->>'lost_reason')::lost_reason,
    coalesce((data->>'created_at')::timestamptz, now()),
    coalesce((data->>'updated_at')::timestamptz, now())
  from public.import_rows
  where job_id = p_job and kind = 'lead'
  on conflict (id) do update set
    name = excluded.name,
    company = excluded.company,
    instagram_handle = excluded.instagram_handle,
    whatsapp_e164 = excluded.whatsapp_e164,
    stage = excluded.stage,
    notes = excluded.notes,
    deleted_at = null;

  get diagnostics v_leads_restored = row_count;

  -- 4. Restore lead events
  insert into public.lead_events (
    owner_id,
    lead_id,
    type,
    from_stage,
    to_stage,
    prev_state,
    meta,
    occurred_at,
    undone_at
  )
  select
    auth.uid(),
    (data->>'lead_id')::uuid,
    (data->>'type')::lead_event_type,
    (data->>'from_stage')::lead_stage,
    (data->>'to_stage')::lead_stage,
    coalesce((data->'prev_state'), '{}'::jsonb),
    coalesce((data->'meta'), '{}'::jsonb),
    coalesce((data->>'occurred_at')::timestamptz, now()),
    (data->>'undone_at')::timestamptz
  from public.import_rows
  where job_id = p_job and kind = 'event'
  on conflict do nothing;

  get diagnostics v_events_restored = row_count;

  update public.import_jobs
     set status = 'done',
         finished_at = now()
   where id = p_job;

  return jsonb_build_object(
    'leads_restored', v_leads_restored,
    'events_restored', v_events_restored,
    'industries_restored', v_industries_restored,
    'current_deleted', v_current_deleted
  );
end;
$$;
