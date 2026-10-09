-- 0007_export.sql
-- Function export_leads: Streaming keyset export for leads with full profile, qualification, and joined reference labels

create or replace function public.export_leads(
  p_query text default null,
  p_stages public.lead_stage[] default null,
  p_industries smallint[] default null,
  p_countries text[] default null,
  p_filters jsonb default null,
  p_cursor uuid default null,
  p_limit int default 2000
) returns table (
  id uuid,
  name text,
  company text,
  job_title text,
  instagram_handle text,
  whatsapp_e164 text,
  country_code text,
  country_name_ar text,
  country_name_en text,
  industry_name_ar text,
  industry_name_en text,
  stage public.lead_stage,
  stage_changed_at timestamptz,
  first_message_at timestamptz,
  last_contacted_at timestamptz,
  follow_ups_sent smallint,
  next_follow_up_on date,
  reminder_note text,
  replied_at timestamptz,
  meeting_booked_at timestamptz,
  meeting_at timestamptz,
  proposal_sent_at timestamptz,
  won_at timestamptz,
  lost_at timestamptz,
  lost_reason public.lost_reason,
  notes text,
  has_content boolean,
  appears_in_content boolean,
  has_videographer public.tri_state,
  problems text,
  created_at timestamptz,
  updated_at timestamptz,
  next_cursor uuid
) language plpgsql stable set search_path = public, extensions as $$
declare
  v_where text := public.lead_filter_sql(p_query, p_stages, p_industries, p_countries, coalesce(p_filters, '{}'::jsonb));
  v_lim   int  := least(greatest(coalesce(p_limit, 2000), 1), 5000);
  v_cur_created timestamptz;
  v_sql   text;
begin
  if p_cursor is not null then
    select l.created_at into v_cur_created
      from public.leads l
     where l.id = p_cursor and l.owner_id = auth.uid() and l.deleted_at is null;

    if v_cur_created is not null then
      v_where := v_where || format(' and (l.created_at, l.id) < (%L::timestamptz, %L::uuid)', v_cur_created, p_cursor);
    end if;
  end if;

  v_sql := format(
    'select
       l.id,
       l.name,
       l.company,
       l.job_title,
       l.instagram_handle,
       l.whatsapp_e164,
       l.country_code,
       c.name_ar as country_name_ar,
       c.name_en as country_name_en,
       coalesce(ind.label_ar, l.industry_other) as industry_name_ar,
       coalesce(ind.label_en, l.industry_other) as industry_name_en,
       l.stage,
       l.stage_changed_at,
       l.first_message_at,
       l.last_contacted_at,
       l.follow_ups_sent,
       l.next_follow_up_on,
       l.reminder_note,
       l.replied_at,
       l.meeting_booked_at,
       l.meeting_at,
       l.proposal_sent_at,
       l.won_at,
       l.lost_at,
       l.lost_reason,
       l.notes,
       l.has_content,
       l.appears_in_content,
       l.has_videographer,
       l.problems,
       l.created_at,
       l.updated_at,
       lead(l.id) over (order by l.created_at desc, l.id desc) as next_cursor
     from public.leads l
     left join public.industries ind on l.industry_id = ind.id
     left join public.countries c on l.country_code = c.code
     where %s
     order by l.created_at desc, l.id desc
     limit %s',
    v_where,
    v_lim
  );

  return query execute v_sql;
end;
$$;

grant execute on function public.export_leads to authenticated;
revoke execute on function public.export_leads from anon;
