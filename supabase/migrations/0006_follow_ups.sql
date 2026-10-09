-- Migration 0006_follow_ups.sql: follow_up_queue RPC (§F5, §18.3)
-- Computes grouped follow-up buckets based on user timezone and next_follow_up_on.

create or replace function public.follow_up_queue(p_waiting_limit int default 100)
returns table (
  bucket text,
  bucket_total bigint,
  days_overdue int,
  id uuid,
  name text,
  instagram_handle text,
  whatsapp_e164 text,
  industry_id smallint,
  country_code text,
  stage lead_stage,
  last_contacted_at timestamptz,
  next_follow_up_on date,
  reminder_note text,
  meeting_at timestamptz
) language sql stable set search_path = public as $$
  with s as (
    select
      timezone,
      (now() at time zone timezone)::date as today
    from settings
    where owner_id = auth.uid()
  ),
  base as (
    select
      l.*,
      case
        when l.stage = 'meeting_booked' and (l.meeting_at at time zone s.timezone)::date = s.today then 'meeting_today'
        when l.next_follow_up_on is null then null
        when l.next_follow_up_on <= s.today and l.stage = 'message_sent' then 'due_fu1'
        when l.next_follow_up_on <= s.today and l.stage = 'follow_up_1'  then 'due_fu2'
        when l.next_follow_up_on <= s.today and l.stage = 'follow_up_2'  then 'due_fu3'
        when l.next_follow_up_on <= s.today and l.stage = 'follow_up_3'  then 'exhausted'
        when l.next_follow_up_on <= s.today and l.stage not in ('won','lost') then 'reminder'
        when l.next_follow_up_on >  s.today and l.stage in ('message_sent','follow_up_1','follow_up_2','follow_up_3') then 'waiting'
      end as bucket,
      s.today - l.next_follow_up_on as days_overdue
    from leads l, s
    where l.deleted_at is null
      and (l.next_follow_up_on is not null or l.stage = 'meeting_booked')
  ),
  ranked as (
    select
      b.*,
      count(*) over (partition by b.bucket) as bucket_total,
      row_number() over (
        partition by b.bucket
        order by b.next_follow_up_on, b.last_contacted_at nulls first, b.id
      ) as rn
    from base b
    where b.bucket is not null
  )
  select
    bucket,
    bucket_total,
    greatest(days_overdue, 0),
    id,
    name,
    instagram_handle,
    whatsapp_e164,
    industry_id,
    country_code::text,
    stage,
    last_contacted_at,
    next_follow_up_on,
    reminder_note,
    meeting_at
  from ranked
  where bucket <> 'waiting' or rn <= least(p_waiting_limit, 500)
  order by
    array_position(array['due_fu1','due_fu2','due_fu3','reminder','meeting_today','exhausted','waiting'], bucket),
    rn
$$;

revoke all on function public.follow_up_queue(int) from public, anon;
grant execute on function public.follow_up_queue(int) to authenticated;
