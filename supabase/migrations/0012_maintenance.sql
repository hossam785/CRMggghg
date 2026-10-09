-- Scope Mini CRM: Automated Maintenance & Purging (§18.3, Task 6.6)
-- Purges soft-deleted leads older than 30 days, old import staging rows older than 30 days,
-- and failed backup logs older than 30 days.

create or replace function public.perform_maintenance()
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_purged_leads int := 0;
  v_purged_rows int := 0;
  v_purged_backups int := 0;
begin
  -- 1. Purge trash older than 30 days
  delete from public.leads
   where deleted_at is not null
     and deleted_at < now() - interval '30 days';
  get diagnostics v_purged_leads = row_count;

  -- 2. Purge staging rows older than 30 days
  delete from public.import_rows r
   using public.import_jobs j
   where r.job_id = j.id
     and j.created_at < now() - interval '30 days';
  get diagnostics v_purged_rows = row_count;

  -- 3. Purge failed backup records older than 30 days
  delete from public.backups
   where status = 'failed'
     and created_at < now() - interval '30 days';
  get diagnostics v_purged_backups = row_count;

  return jsonb_build_object(
    'purged_leads', v_purged_leads,
    'purged_staging_rows', v_purged_rows,
    'purged_failed_backups', v_purged_backups,
    'executed_at', now()
  );
end;
$$;

revoke all on function public.perform_maintenance() from public;
grant execute on function public.perform_maintenance() to service_role;

-- Conditionally register pg_cron jobs if pg_cron extension is installed
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    -- Purge trash daily at 02:30
    perform cron.schedule(
      'purge-trash',
      '30 2 * * *',
      'delete from public.leads where deleted_at < now() - interval ''30 days'';'
    );

    -- Purge staging daily at 02:45
    perform cron.schedule(
      'purge-staging',
      '45 2 * * *',
      'delete from public.import_rows r using public.import_jobs j where r.job_id = j.id and j.created_at < now() - interval ''30 days'';'
    );

    -- Purge failed backups weekly on Sunday at 03:00
    perform cron.schedule(
      'purge-backups-orphans',
      '0 3 * * 0',
      'delete from public.backups where status = ''failed'' and created_at < now() - interval ''30 days'';'
    );
  end if;
exception
  when others then
    null;
end;
$$;
