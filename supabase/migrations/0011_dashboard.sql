-- Scope Mini CRM: Dashboard Statistics RPC (§F6, Task 5.1)
-- Computes KPIs, stage breakdown, and period-over-period comparison in a single optimized query.

create or replace function public.dashboard_stats(p_from timestamptz, p_to timestamptz)
returns jsonb language sql stable security definer set search_path = public as $$
  with prev as (select p_from - (p_to - p_from) as f, p_from as t),
  ev as (
    select type, lead_id, occurred_at >= p_from as is_cur
      from public.lead_events, prev
     where owner_id = auth.uid()
       and undone_at is null
       and occurred_at >= prev.f
       and occurred_at < p_to
       and type in ('message_sent', 'follow_up_sent', 'reply_received', 'meeting_booked', 'won')
  ),
  agg as (
    select is_cur,
      count(*) filter (where type = 'message_sent')                    as first_messages,
      count(*) filter (where type = 'follow_up_sent')                  as follow_ups,
      count(distinct lead_id) filter (where type = 'reply_received')   as replied,
      count(*) filter (where type = 'meeting_booked')                  as meetings,
      count(*) filter (where type = 'won')                             as won
    from ev group by is_cur
  ),
  leads_new as (
    select count(*) filter (where created_at >= p_from)                       as cur,
           count(*) filter (where created_at <  p_from)                       as prev
      from public.leads, prev
     where owner_id = auth.uid()
       and deleted_at is null
       and created_at >= prev.f
       and created_at < p_to
  ),
  pipeline as (
    select jsonb_object_agg(stage, c) as by_stage, coalesce(sum(c), 0)::int as total
      from (
        select stage, count(*) as c
          from public.leads
         where owner_id = auth.uid()
           and deleted_at is null
         group by stage
      ) x
  )
  select jsonb_build_object(
    'total_leads',   coalesce((select total from pipeline), 0),
    'pipeline',      coalesce((select by_stage from pipeline), '{}'::jsonb),
    'new_leads',     jsonb_build_object(
                       'cur', coalesce((select cur from leads_new), 0),
                       'prev', coalesce((select prev from leads_new), 0)
                     ),
    'not_contacted', coalesce(((select by_stage from pipeline)->>'new')::int, 0),
    'cur',  coalesce(
              (select to_jsonb(a) - 'is_cur' from agg a where is_cur),
              jsonb_build_object('first_messages', 0, 'follow_ups', 0, 'replied', 0, 'meetings', 0, 'won', 0)
            ),
    'prev', coalesce(
              (select to_jsonb(a) - 'is_cur' from agg a where not is_cur),
              jsonb_build_object('first_messages', 0, 'follow_ups', 0, 'replied', 0, 'meetings', 0, 'won', 0)
            )
  );
$$;

revoke all on function public.dashboard_stats(timestamptz, timestamptz) from public;
grant execute on function public.dashboard_stats(timestamptz, timestamptz) to authenticated;
