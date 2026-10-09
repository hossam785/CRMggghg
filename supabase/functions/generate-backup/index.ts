// Supabase Edge Function: generate-backup
// Deno TypeScript runtime

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import * as XLSX from 'https://esm.sh/xlsx@0.18.5';
import { zipSync, strToU8 } from 'https://esm.sh/fflate@0.8.2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const CRON_SECRET = Deno.env.get('CRON_SECRET') ?? '';

serve(async (req: Request) => {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 1. Authenticate: Check cron secret OR user JWT
    const cronSecretHeader = req.headers.get('x-cron-secret');
    const authHeader = req.headers.get('Authorization');

    let ownerId: string | null = null;
    let isScheduled = false;

    if (cronSecretHeader && cronSecretHeader === CRON_SECRET) {
      const body = await req.json().catch(() => ({}));
      ownerId = body.owner_id;
      isScheduled = body.kind === 'scheduled';
    } else if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
      if (authErr || !user) {
        return new Response(JSON.stringify({ error: 'UNAUTHORIZED' }), { status: 401 });
      }
      ownerId = user.id;
    } else {
      return new Response(JSON.stringify({ error: 'UNAUTHORIZED' }), { status: 401 });
    }

    if (!ownerId) {
      return new Response(JSON.stringify({ error: 'MISSING_OWNER_ID' }), { status: 400 });
    }

    const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {};
    const kind = body.kind || (isScheduled ? 'scheduled' : 'manual');
    let format = body.format || 'xlsx';

    // 2. Fetch User Settings
    const { data: backupSettings } = await supabase
      .from('backup_settings')
      .select('*')
      .eq('owner_id', ownerId)
      .single();

    if (backupSettings?.format) {
      format = backupSettings.format;
    }

    // 3. Create Backup Record in 'running' status
    const { data: backupRow, error: insertErr } = await supabase
      .from('backups')
      .insert({
        owner_id: ownerId,
        kind,
        format,
        status: 'running',
      })
      .select('id')
      .single();

    if (insertErr || !backupRow) {
      throw new Error(`Failed to create backup record: ${insertErr?.message}`);
    }

    const backupId = backupRow.id;

    // 4. Batched data reading (5,000 rows/batch)
    // A) Leads
    const allLeads: any[] = [];
    let leadPage = 0;
    while (true) {
      const { data: leadsBatch } = await supabase
        .from('leads')
        .select('*')
        .eq('owner_id', ownerId)
        .order('id', { ascending: true })
        .range(leadPage * 5000, (leadPage + 1) * 5000 - 1);

      if (!leadsBatch || leadsBatch.length === 0) break;
      for (const l of leadsBatch) {
        delete l.search_text;
        allLeads.push(l);
      }
      if (leadsBatch.length < 5000) break;
      leadPage++;
    }

    // B) Lead Events
    const allEvents: any[] = [];
    let eventPage = 0;
    while (true) {
      const { data: eventsBatch } = await supabase
        .from('lead_events')
        .select('*')
        .eq('owner_id', ownerId)
        .order('id', { ascending: true })
        .range(eventPage * 5000, (eventPage + 1) * 5000 - 1);

      if (!eventsBatch || eventsBatch.length === 0) break;
      allEvents.push(...eventsBatch);
      if (eventsBatch.length < 5000) break;
      eventPage++;
    }

    // C) Industries
    const { data: industries = [] } = await supabase
      .from('industries')
      .select('*')
      .eq('owner_id', ownerId);

    // D) Settings
    const { data: settings } = await supabase
      .from('settings')
      .select('*')
      .eq('owner_id', ownerId)
      .single();

    // Auto-switch to csv_zip if > 150k leads for memory safety
    if (allLeads.length > 150000 && format === 'xlsx') {
      format = 'csv_zip';
    }

    const rowCounts = {
      leads: allLeads.length,
      events: allEvents.length,
      industries: industries?.length || 0,
    };

    const createdAt = new Date().toISOString();
    let fileBytes: Uint8Array;
    let fileExt = 'xlsx';

    // 5. Serialize file
    if (format === 'json') {
      fileExt = 'json';
      const payload = {
        meta: {
          app: 'scope-crm',
          format_version: 1,
          created_at: createdAt,
          counts: rowCounts,
        },
        settings,
        industries,
        leads: allLeads,
        events: allEvents,
      };
      fileBytes = strToU8(JSON.stringify(payload, null, 2));
    } else if (format === 'csv_zip') {
      fileExt = 'zip';
      const metaJson = JSON.stringify({
        app: 'scope-crm',
        format_version: 1,
        created_at: createdAt,
        counts: rowCounts,
      });

      const leadsSheet = XLSX.utils.json_to_sheet(allLeads);
      const leadsCsv = XLSX.utils.sheet_to_csv(leadsSheet);

      const eventsSheet = XLSX.utils.json_to_sheet(allEvents);
      const eventsCsv = XLSX.utils.sheet_to_csv(eventsSheet);

      const industriesSheet = XLSX.utils.json_to_sheet(industries || []);
      const industriesCsv = XLSX.utils.sheet_to_csv(industriesSheet);

      const zipData = zipSync({
        'meta.json': strToU8(metaJson),
        'leads.csv': strToU8(leadsCsv),
        'events.csv': strToU8(eventsCsv),
        'industries.csv': strToU8(industriesCsv),
      });
      fileBytes = zipData;
    } else {
      // XLSX
      fileExt = 'xlsx';
      const wb = XLSX.utils.book_new();

      // _meta sheet
      const metaRows = [
        { key: 'app', value: 'scope-crm' },
        { key: 'format_version', value: '1' },
        { key: 'created_at', value: createdAt },
        { key: 'total_leads', value: String(rowCounts.leads) },
        { key: 'total_events', value: String(rowCounts.events) },
        { key: 'total_industries', value: String(rowCounts.industries) },
      ];
      const metaSheet = XLSX.utils.json_to_sheet(metaRows);
      XLSX.utils.book_append_sheet(wb, metaSheet, '_meta');

      // leads sheet
      const leadsSheet = XLSX.utils.json_to_sheet(allLeads);
      XLSX.utils.book_append_sheet(wb, leadsSheet, 'leads');

      // events sheet
      const eventsSheet = XLSX.utils.json_to_sheet(allEvents);
      XLSX.utils.book_append_sheet(wb, eventsSheet, 'events');

      // industries sheet
      const industriesSheet = XLSX.utils.json_to_sheet(industries || []);
      XLSX.utils.book_append_sheet(wb, industriesSheet, 'industries');

      const u8 = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      fileBytes = new Uint8Array(u8);
    }

    // 6. SHA-256 Checksum
    const hashBuffer = await crypto.subtle.digest('SHA-256', fileBytes);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const checksum = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

    // 7. Upload to Supabase Storage
    const dateStr = new Date().toISOString().replace(/[:.]/g, '-');
    const storagePath = `${ownerId}/${dateStr}_${kind}.${fileExt}`;

    const { error: uploadErr } = await supabase.storage
      .from('backups')
      .upload(storagePath, fileBytes, {
        contentType:
          fileExt === 'xlsx'
            ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            : fileExt === 'zip'
            ? 'application/zip'
            : 'application/json',
        upsert: true,
      });

    if (uploadErr) {
      throw new Error(`Storage upload failed: ${uploadErr.message}`);
    }

    // 8. Update Backup record status to 'ready'
    await supabase
      .from('backups')
      .update({
        status: 'ready',
        storage_path: storagePath,
        size_bytes: fileBytes.byteLength,
        row_counts: rowCounts,
        checksum,
      })
      .eq('id', backupId);

    // 9. Retention: Delete older scheduled backups exceeding keep_last
    if (backupSettings?.keep_last) {
      const { data: pastScheduled } = await supabase
        .from('backups')
        .select('id, storage_path')
        .eq('owner_id', ownerId)
        .eq('kind', 'scheduled')
        .eq('status', 'ready')
        .order('created_at', { ascending: false });

      if (pastScheduled && pastScheduled.length > backupSettings.keep_last) {
        const toDelete = pastScheduled.slice(backupSettings.keep_last);
        const pathsToDelete = toDelete.map((b) => b.storage_path).filter(Boolean) as string[];
        if (pathsToDelete.length > 0) {
          await supabase.storage.from('backups').remove(pathsToDelete);
        }
        const idsToDelete = toDelete.map((b) => b.id);
        await supabase.from('backups').delete().in('id', idsToDelete);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        backup_id: backupId,
        size_bytes: fileBytes.byteLength,
        checksum,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: errorMsg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
