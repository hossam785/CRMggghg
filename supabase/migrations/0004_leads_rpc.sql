-- Migration: 0004_leads_rpc.sql
-- High-performance lead query RPCs: lead_filter_sql, search_leads, lead_stage_counts, suggest_leads, check_duplicate

-- 1. WHERE clause builder (injection-safe, escapes LIKE wildcards, formats with %L)
create or replace function public.lead_filter_sql(
  p_query text,
  p_stages public.lead_stage[],
  p_industries smallint[],
  p_countries text[],
  p_filters jsonb
) returns text language plpgsql stable set search_path = public, extensions as $$
declare
  w text := 'l.deleted_at is null';
  q text := nullif(public.normalize_search(btrim(coalesce(p_query, ''))), '');
  tok text;
begin
  if q is not null then
    foreach tok in array regexp_split_to_array(q, '\s+') loop
      -- Escape \, %, _ inside LIKE
      w := w || format(' and l.search_text like %L', '%' || replace(replace(replace(tok, '\', '\\'), '%', '\%'), '_', '\_') || '%');
    end loop;
  end if;

  if p_stages is not null and cardinality(p_stages) > 0 then
    w := w || format(' and l.stage = any(%L::public.lead_stage[])', p_stages);
  end if;

  if p_industries is not null and cardinality(p_industries) > 0 then
    w := w || format(' and l.industry_id = any(%L::smallint[])', p_industries);
  end if;

  if p_countries is not null and cardinality(p_countries) > 0 then
    w := w || format(' and l.country_code = any(%L::text[])', p_countries);
  end if;

  if p_filters ? 'has_content' then
    w := w || format(' and l.has_content = %L::boolean', p_filters->>'has_content');
  end if;

  if p_filters ? 'appears_in_content' then
    w := w || format(' and l.appears_in_content = %L::boolean', p_filters->>'appears_in_content');
  end if;

  if p_filters ? 'has_videographer' then
    w := w || format(' and l.has_videographer = %L::public.tri_state', p_filters->>'has_videographer');
  end if;

  if (p_filters->>'has_whatsapp')::boolean is true then
    w := w || ' and l.whatsapp_e164 is not null';
  end if;

  if (p_filters->>'due')::boolean is true then
    w := w || ' and l.next_follow_up_on <= (now() at time zone coalesce((select timezone from public.settings where owner_id = auth.uid()), ''Africa/Cairo''))::date';
  end if;

  if p_filters ? 'missing' then
    if p_filters->>'missing' = 'any' then
      w := w || ' and cardinality(l.missing_fields) > 0';
    else
      w := w || format(' and l.missing_fields @> %L::text[]', array(select jsonb_array_elements_text(p_filters->'missing')));
    end if;
  end if;

  if p_filters ? 'import_job_id' then
    w := w || format(' and l.import_job_id = %L::uuid', p_filters->>'import_job_id');
  end if;

  if p_filters ? 'created_from' then
    w := w || format(' and l.created_at >= %L::date', p_filters->>'created_from');
  end if;

  if p_filters ? 'created_to' then
    w := w || format(' and l.created_at < (%L::date + 1)', p_filters->>'created_to');
  end if;

  return w;
end;
$$;

-- 2. Keyset pagination search RPC
create or replace function public.search_leads(
  p_query text default null,
  p_stages public.lead_stage[] default null,
  p_industries smallint[] default null,
  p_countries text[] default null,
  p_filters jsonb default '{}',
  p_sort text default 'newest',
  p_cursor jsonb default null,
  p_limit int default 50
) returns table (
  id uuid,
  name text,
  company text,
  instagram_handle text,
  whatsapp_e164 text,
  industry_id smallint,
  industry_other text,
  country_code text,
  stage public.lead_stage,
  last_contacted_at timestamptz,
  next_follow_up_on date,
  follow_ups_sent smallint,
  missing_fields text[],
  created_at timestamptz,
  rank real,
  next_cursor jsonb
) language plpgsql stable set search_path = public, extensions as $$
declare
  v_where text := public.lead_filter_sql(p_query, p_stages, p_industries, p_countries, coalesce(p_filters, '{}'::jsonb));
  v_lim   int  := least(greatest(coalesce(p_limit, 50), 1), 100);
  v_q     text := nullif(public.normalize_search(btrim(coalesce(p_query, ''))), '');
  v_sort  text := coalesce(nullif(p_sort, ''), 'newest');
  v_key   text;
  v_type  text;
  v_order text;
  v_cmp   text;
  v_off   int  := 0;
begin
  if v_sort = 'relevance' and v_q is null then
    v_sort := 'newest';
  end if;

  case v_sort
    when 'newest' then
      v_key   := 'l.created_at';
      v_type  := 'timestamptz';
      v_order := 'desc';
    when 'oldest' then
      v_key   := 'l.created_at';
      v_type  := 'timestamptz';
      v_order := 'asc';
    when 'last_contact' then
      v_key   := 'coalesce(l.last_contacted_at, ''-infinity''::timestamptz)';
      v_type  := 'timestamptz';
      v_order := 'desc';
    when 'next_follow_up' then
      v_key   := 'coalesce(l.next_follow_up_on, ''infinity''::date)';
      v_type  := 'date';
      v_order := 'asc';
    when 'name' then
      v_key   := 'lower(l.name)';
      v_type  := 'text';
      v_order := 'asc';
    when 'relevance' then
      v_key   := format('similarity(l.search_text, %L)', v_q);
      v_type  := 'real';
      v_order := 'desc';
    else
      raise exception 'INVALID_SORT';
  end case;

  if p_cursor is not null then
    if v_sort = 'relevance' then
      v_off := least(greatest(coalesce((p_cursor->>'offset')::int, 0), 0), 500);
    else
      v_cmp := case v_order when 'desc' then '<' else '>' end;
      v_where := v_where || format(' and (%s, l.id) %s (%L::%s, %L::uuid)',
                   v_key, v_cmp, p_cursor->>'k', v_type, p_cursor->>'id');
    end if;
  end if;

  return query execute format($q$
    select l.id,
           l.name,
           l.company,
           l.instagram_handle,
           l.whatsapp_e164,
           l.industry_id,
           l.industry_other,
           l.country_code::text,
           l.stage,
           l.last_contacted_at,
           l.next_follow_up_on,
           l.follow_ups_sent,
           l.missing_fields,
           l.created_at,
           %s::real as rank,
           null::jsonb as next_cursor
      from public.leads l
     where %s
     order by %s %s, l.id %s
     limit %s offset %s
  $q$,
    case when v_q is not null then format('similarity(l.search_text, %L)', v_q) else '0' end,
    v_where,
    v_key,
    v_order,
    v_order,
    v_lim + 1,
    v_off
  );
end;
$$;

-- 3. Lead Stage Counts
create or replace function public.lead_stage_counts(
  p_query text default null,
  p_industries smallint[] default null,
  p_countries text[] default null,
  p_filters jsonb default '{}'
) returns table (stage public.lead_stage, total bigint)
language plpgsql stable set search_path = public, extensions as $$
begin
  return query execute format(
    'select l.stage, count(*)::bigint as total from public.leads l where %s group by l.stage',
    public.lead_filter_sql(p_query, null, p_industries, p_countries, coalesce(p_filters, '{}'::jsonb))
  );
end;
$$;

-- 4. Fuzzy Suggestion ("هل تقصد؟") with local word_similarity threshold
create or replace function public.suggest_leads(p_query text, p_limit int default 5)
returns table (id uuid, name text, instagram_handle text, stage public.lead_stage, score real)
language plpgsql stable set search_path = public, extensions as $$
declare
  v_norm text := public.normalize_search(coalesce(p_query, ''));
  v_lim  int  := least(greatest(coalesce(p_limit, 5), 1), 10);
begin
  if nullif(v_norm, '') is null then
    return;
  end if;

  perform set_config('pg_trgm.word_similarity_threshold', '0.35', true);

  return query
    select l.id,
           l.name,
           l.instagram_handle,
           l.stage,
           word_similarity(v_norm, l.search_text)::real as score
      from public.leads l
     where l.deleted_at is null
       and v_norm <% l.search_text
     order by score desc, l.id desc
     limit v_lim;
end;
$$;

-- 5. Duplicate Check
create or replace function public.check_duplicate(
  p_handle text default null,
  p_phone text default null,
  p_exclude uuid default null
) returns table (id uuid, name text, stage public.lead_stage, matched_on text)
language sql stable set search_path = public as $$
  select l.id,
         l.name,
         l.stage,
         case
           when p_handle is not null and l.instagram_handle = lower(p_handle) then 'instagram'
           else 'whatsapp'
         end as matched_on
    from public.leads l
   where l.deleted_at is null
     and (p_exclude is null or l.id <> p_exclude)
     and (
       (p_handle is not null and l.instagram_handle = lower(p_handle))
       or
       (p_phone is not null and l.whatsapp_e164 = p_phone)
     )
   limit 2;
$$;

-- 6. Grant & Revoke Permissions
revoke all on function public.lead_filter_sql from public, anon;
grant execute on function public.lead_filter_sql to authenticated;

revoke all on function public.search_leads from public, anon;
grant execute on function public.search_leads to authenticated;

revoke all on function public.lead_stage_counts from public, anon;
grant execute on function public.lead_stage_counts to authenticated;

revoke all on function public.suggest_leads from public, anon;
grant execute on function public.suggest_leads to authenticated;

revoke all on function public.check_duplicate from public, anon;
grant execute on function public.check_duplicate to authenticated;
