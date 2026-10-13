-- Migration: 0005_pipeline.sql
-- Enums, lead_events table, trigger, assert_stage, lead_action (13 actions), and undo_lead_event

-- 1. Enum: lead_event_type (§3.1)
create type public.lead_event_type as enum (
  'created',
  'message_sent',
  'follow_up_sent',
  'reply_received',
  'meeting_booked',
  'proposal_sent',
  'won',
  'lost',
  'stage_set',
  'reopened',
  'reminder_set',
  'snoozed',
  'restarted'
);

-- 2. Table: lead_events (§3.4)
create table public.lead_events (
  id           bigint generated always as identity primary key,
  owner_id     uuid not null default auth.uid() references auth.users on delete cascade,
  lead_id      uuid not null references public.leads(id) on delete cascade,
  type         public.lead_event_type not null,
  from_stage   public.lead_stage,
  to_stage     public.lead_stage,
  prev_state   jsonb,
  meta         jsonb not null default '{}'::jsonb,
  occurred_at  timestamptz not null default now(),
  undone_at    timestamptz
);

alter table public.lead_events enable row level security;
create policy own on public.lead_events
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create index events_stats_idx on public.lead_events (owner_id, type, occurred_at) where undone_at is null;
create index events_lead_idx  on public.lead_events (lead_id, id desc);

-- 3. Helper: assert_stage
create or replace function public.assert_stage(p_current public.lead_stage, p_allowed public.lead_stage[])
returns void language plpgsql immutable set search_path = public as $$
begin
  if not (p_current = any(p_allowed)) then
    raise exception 'INVALID_TRANSITION' using errcode = 'P0001', detail = p_current::text;
  end if;
end;
$$;

-- 4. Trigger: leads_created_event (fires AFTER INSERT on public.leads)
create or replace function public.leads_created_event() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.lead_events (owner_id, lead_id, type, to_stage, meta, occurred_at)
  values (
    new.owner_id,
    new.id,
    'created',
    new.stage,
    case when new.import_job_id is not null
         then jsonb_build_object('import_job_id', new.import_job_id)
         else '{}'::jsonb
    end,
    new.created_at
  );
  return new;
end;
$$;

drop trigger if exists leads_created_event on public.leads;
create trigger leads_created_event after insert on public.leads
  for each row execute function public.leads_created_event();

-- 5. RPC: lead_action (§4.2, §4.3, §18.3)
create or replace function public.lead_action(
  p_lead_id uuid,
  p_action text,
  p_payload jsonb default '{}'::jsonb,
  p_expected_stage public.lead_stage default null
) returns jsonb
language plpgsql security invoker set search_path = public as $$
declare
  v leads;
  s settings;
  v_today date;
  v_from lead_stage;
  v_prev jsonb;
  v_event bigint;
  v_type lead_event_type;
  v_waiting lead_stage[] := array['message_sent', 'follow_up_1', 'follow_up_2', 'follow_up_3']::lead_stage[];
  v_open lead_stage[] := array['new', 'message_sent', 'follow_up_1', 'follow_up_2', 'follow_up_3', 'replied', 'meeting_booked', 'proposal_sent']::lead_stage[];
  v_target_stage lead_stage;
begin
  -- Row lock
  select * into v from public.leads
   where id = p_lead_id and deleted_at is null
   for update;

  if not found then
    raise exception 'LEAD_NOT_FOUND' using errcode = 'P0002';
  end if;

  if p_expected_stage is not null and v.stage <> p_expected_stage then
    raise exception 'STAGE_CONFLICT' using errcode = 'P0001', detail = v.stage::text;
  end if;

  select * into s from public.settings where owner_id = v.owner_id;
  v_today := (now() at time zone coalesce(s.timezone, 'Africa/Cairo'))::date;
  v_from  := v.stage;

  -- Exact pipeline columns snapshot for undo
  v_prev := jsonb_build_object(
    'stage', v.stage,
    'stage_changed_at', v.stage_changed_at,
    'first_message_at', v.first_message_at,
    'last_contacted_at', v.last_contacted_at,
    'follow_ups_sent', v.follow_ups_sent,
    'next_follow_up_on', v.next_follow_up_on,
    'reminder_note', v.reminder_note,
    'replied_at', v.replied_at,
    'meeting_booked_at', v.meeting_booked_at,
    'meeting_at', v.meeting_at,
    'proposal_sent_at', v.proposal_sent_at,
    'won_at', v.won_at,
    'lost_at', v.lost_at,
    'lost_reason', v.lost_reason
  );

  case p_action
  when 'send_message' then
    perform assert_stage(v.stage, array['new']::lead_stage[]);
    update public.leads set
      stage = 'message_sent',
      stage_changed_at = now(),
      first_message_at = coalesce(first_message_at, now()),
      last_contacted_at = now(),
      follow_ups_sent = 0,
      next_follow_up_on = v_today + s.fu1_after_days
    where id = v.id returning * into v;
    v_type := 'message_sent';

  when 'send_follow_up' then
    perform assert_stage(v.stage, array['message_sent', 'follow_up_1', 'follow_up_2']::lead_stage[]);
    update public.leads set
      stage = case v.stage
                when 'message_sent' then 'follow_up_1'::lead_stage
                when 'follow_up_1'  then 'follow_up_2'::lead_stage
                else 'follow_up_3'::lead_stage
              end,
      stage_changed_at = now(),
      last_contacted_at = now(),
      follow_ups_sent = v.follow_ups_sent + 1,
      next_follow_up_on = v_today + case v.stage
                                      when 'message_sent' then s.fu2_after_days
                                      when 'follow_up_1'  then s.fu3_after_days
                                      else s.give_up_after_days
                                    end
    where id = v.id returning * into v;
    v_type := 'follow_up_sent';
    p_payload := coalesce(p_payload, '{}'::jsonb) || jsonb_build_object('number', v.follow_ups_sent);

  when 'reply_received' then
    perform assert_stage(v.stage, array['new', 'message_sent', 'follow_up_1', 'follow_up_2', 'follow_up_3']::lead_stage[]);
    update public.leads set
      stage = 'replied',
      stage_changed_at = now(),
      replied_at = coalesce(replied_at, now()),
      next_follow_up_on = null,
      reminder_note = null
    where id = v.id returning * into v;
    v_type := 'reply_received';

  when 'book_meeting' then
    perform assert_stage(v.stage, array['new', 'message_sent', 'follow_up_1', 'follow_up_2', 'follow_up_3', 'replied']::lead_stage[]);
    if p_payload ? 'meeting_at' and p_payload->>'meeting_at' is not null and p_payload->>'meeting_at' <> '' then
      begin
        perform (p_payload->>'meeting_at')::timestamptz;
      exception when others then
        raise exception 'VALIDATION' using errcode = '23514';
      end;
    end if;

    update public.leads set
      stage = 'meeting_booked',
      stage_changed_at = now(),
      meeting_booked_at = now(),
      replied_at = coalesce(replied_at, now()),
      meeting_at = nullif(p_payload->>'meeting_at', '')::timestamptz,
      next_follow_up_on = null,
      reminder_note = null
    where id = v.id returning * into v;
    v_type := 'meeting_booked';

  when 'send_proposal' then
    perform assert_stage(v.stage, array['replied', 'meeting_booked']::lead_stage[]);
    update public.leads set
      stage = 'proposal_sent',
      stage_changed_at = now(),
      proposal_sent_at = now()
    where id = v.id returning * into v;
    v_type := 'proposal_sent';

  when 'mark_won' then
    perform assert_stage(v.stage, v_open);
    update public.leads set
      stage = 'won',
      stage_changed_at = now(),
      won_at = now(),
      next_follow_up_on = null,
      reminder_note = null
    where id = v.id returning * into v;
    v_type := 'won';

  when 'mark_lost' then
    perform assert_stage(v.stage, v_open);
    if not (p_payload ? 'reason') or p_payload->>'reason' is null or p_payload->>'reason' not in ('not_interested', 'no_reply', 'budget', 'timing', 'other') then
      raise exception 'VALIDATION' using errcode = '23514';
    end if;

    update public.leads set
      stage = 'lost',
      stage_changed_at = now(),
      lost_at = now(),
      lost_reason = (p_payload->>'reason')::public.lost_reason,
      next_follow_up_on = null,
      reminder_note = null
    where id = v.id returning * into v;
    v_type := 'lost';

  when 'reopen' then
    perform assert_stage(v.stage, array['won', 'lost']::lead_stage[]);
    if p_payload ? 'to_stage' and p_payload->>'to_stage' is not null and p_payload->>'to_stage' <> '' then
      begin
        perform (p_payload->>'to_stage')::lead_stage;
      exception when others then
        raise exception 'VALIDATION' using errcode = '23514';
      end;
      if (p_payload->>'to_stage')::lead_stage in ('won', 'lost') then
        raise exception 'VALIDATION' using errcode = '23514';
      end if;
    end if;

    update public.leads set
      stage = coalesce((p_payload->>'to_stage')::lead_stage, 'replied'),
      stage_changed_at = now(),
      won_at = null,
      lost_at = null,
      lost_reason = null
    where id = v.id returning * into v;
    v_type := 'reopened';

  when 'set_reminder' then
    if not (p_payload ? 'date') or p_payload->>'date' is null or p_payload->>'date' = '' then
      raise exception 'VALIDATION' using errcode = '23514';
    end if;
    begin
      perform (p_payload->>'date')::date;
    exception when others then
      raise exception 'VALIDATION' using errcode = '23514';
    end;
    if (p_payload->>'date')::date < (v_today - interval '1 day')::date then
      raise exception 'VALIDATION' using errcode = '23514';
    end if;

    update public.leads set
      next_follow_up_on = (p_payload->>'date')::date,
      reminder_note = nullif(left(btrim(coalesce(p_payload->>'note', '')), 140), '')
    where id = v.id returning * into v;
    v_type := 'reminder_set';

  when 'clear_reminder' then
    if v.stage = any(v_waiting) then
      raise exception 'INVALID_TRANSITION' using errcode = 'P0001';
    end if;

    update public.leads set
      next_follow_up_on = null,
      reminder_note = null
    where id = v.id returning * into v;
    v_type := 'reminder_set';
    p_payload := coalesce(p_payload, '{}'::jsonb) || '{"cleared":true}'::jsonb;

  when 'snooze' then
    if v.next_follow_up_on is null then
      raise exception 'INVALID_TRANSITION' using errcode = 'P0001';
    end if;
    if p_payload ? 'days' then
      if (p_payload->>'days')::int < 1 or (p_payload->>'days')::int > 90 then
        raise exception 'VALIDATION' using errcode = '23514';
      end if;
    end if;

    update public.leads set
      next_follow_up_on = greatest(v.next_follow_up_on, v_today) + coalesce((p_payload->>'days')::int, 1)
    where id = v.id returning * into v;
    v_type := 'snoozed';

  when 'restart' then
    perform assert_stage(v.stage, array['follow_up_3', 'lost']::lead_stage[]);
    if p_payload ? 'after_days' and p_payload->>'after_days' is not null and p_payload->>'after_days' <> '' then
      if (p_payload->>'after_days')::int < 1 or (p_payload->>'after_days')::int > 90 then
        raise exception 'VALIDATION' using errcode = '23514';
      end if;
    end if;

    update public.leads set
      stage = 'new',
      stage_changed_at = now(),
      follow_ups_sent = 0,
      lost_at = null,
      lost_reason = null,
      next_follow_up_on = case
                            when p_payload ? 'after_days' and nullif(p_payload->>'after_days', '') is not null
                            then v_today + (p_payload->>'after_days')::int
                            else null
                          end,
      reminder_note = null
    where id = v.id returning * into v;
    v_type := 'restarted';

  when 'set_stage' then
    if not (p_payload ? 'to_stage') or p_payload->>'to_stage' is null or p_payload->>'to_stage' = '' then
      raise exception 'VALIDATION' using errcode = '23514';
    end if;
    begin
      perform (p_payload->>'to_stage')::lead_stage;
    exception when others then
      raise exception 'VALIDATION' using errcode = '23514';
    end;

    v_target_stage := (p_payload->>'to_stage')::lead_stage;

    update public.leads set
      stage = v_target_stage,
      stage_changed_at = now(),
      next_follow_up_on = case
                            when v_target_stage = any(v_waiting)
                            then coalesce(next_follow_up_on, v_today + s.fu1_after_days)
                            when v_target_stage in ('won', 'lost', 'replied', 'meeting_booked')
                            then null
                            else next_follow_up_on
                          end,
      won_at = case when v_target_stage = 'won' then coalesce(won_at, now()) else null end,
      lost_at = case when v_target_stage = 'lost' then coalesce(lost_at, now()) else null end,
      lost_reason = case
                      when v_target_stage = 'lost'
                      then coalesce(nullif(p_payload->>'reason', '')::public.lost_reason, lost_reason, 'other'::public.lost_reason)
                      else null
                    end
    where id = v.id returning * into v;
    v_type := 'stage_set';

  else
    raise exception 'UNKNOWN_ACTION' using errcode = 'P0001';
  end case;

  -- Insert event record
  insert into public.lead_events (owner_id, lead_id, type, from_stage, to_stage, prev_state, meta)
  values (v.owner_id, v.id, v_type, v_from, v.stage, v_prev, coalesce(p_payload, '{}'::jsonb))
  returning id into v_event;

  return jsonb_build_object('lead', to_jsonb(v) - 'search_text', 'event_id', v_event);
end;
$$;

-- 6. RPC: undo_lead_event (§4.4, §18.3)
create or replace function public.undo_lead_event(p_event_id bigint) returns jsonb
language plpgsql security invoker set search_path = public as $$
declare
  e lead_events;
  v leads;
  v_latest bigint;
begin
  select * into e from public.lead_events where id = p_event_id and undone_at is null for update;
  if not found or e.prev_state is null then
    raise exception 'LEAD_NOT_FOUND' using errcode = 'P0002';
  end if;

  if e.occurred_at < now() - interval '10 minutes' then
    raise exception 'UNDO_EXPIRED' using errcode = 'P0001';
  end if;

  select max(id) into v_latest from public.lead_events
   where lead_id = e.lead_id and undone_at is null and prev_state is not null;

  if v_latest <> e.id then
    raise exception 'UNDO_NOT_LATEST' using errcode = 'P0001';
  end if;

  -- Restore pipeline columns from snapshot
  update public.leads l set
    stage             = (e.prev_state->>'stage')::lead_stage,
    stage_changed_at  = (e.prev_state->>'stage_changed_at')::timestamptz,
    first_message_at  = (e.prev_state->>'first_message_at')::timestamptz,
    last_contacted_at = (e.prev_state->>'last_contacted_at')::timestamptz,
    follow_ups_sent   = coalesce((e.prev_state->>'follow_ups_sent')::smallint, 0),
    next_follow_up_on = (e.prev_state->>'next_follow_up_on')::date,
    reminder_note     = e.prev_state->>'reminder_note',
    replied_at        = (e.prev_state->>'replied_at')::timestamptz,
    meeting_booked_at = (e.prev_state->>'meeting_booked_at')::timestamptz,
    meeting_at        = (e.prev_state->>'meeting_at')::timestamptz,
    proposal_sent_at  = (e.prev_state->>'proposal_sent_at')::timestamptz,
    won_at            = (e.prev_state->>'won_at')::timestamptz,
    lost_at           = (e.prev_state->>'lost_at')::timestamptz,
    lost_reason       = (e.prev_state->>'lost_reason')::public.lost_reason
  where l.id = e.lead_id
  returning l.* into v;

  update public.lead_events set undone_at = now() where id = e.id;
  return jsonb_build_object('lead', to_jsonb(v) - 'search_text');
end;
$$;

-- 7. Permissions & Grants
grant execute on function public.assert_stage(public.lead_stage, public.lead_stage[]) to authenticated;
grant execute on function public.lead_action(uuid, text, jsonb, public.lead_stage) to authenticated;
grant execute on function public.undo_lead_event(bigint) to authenticated;

revoke execute on function public.assert_stage(public.lead_stage, public.lead_stage[]) from anon;
revoke execute on function public.lead_action(uuid, text, jsonb, public.lead_stage) from anon;
revoke execute on function public.undo_lead_event(bigint) from anon;
