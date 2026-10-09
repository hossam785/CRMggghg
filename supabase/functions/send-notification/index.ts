// Supabase Edge Function: send-notification
// Deno TypeScript runtime

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const CRON_SECRET = Deno.env.get('CRON_SECRET') ?? '';
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';

serve(async (req: Request) => {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Auth verification
    const cronSecret = req.headers.get('x-cron-secret');
    if (cronSecret !== CRON_SECRET) {
      return new Response(JSON.stringify({ error: 'UNAUTHORIZED' }), { status: 401 });
    }

    const body = await req.json();
    const { type, backup_id, owner_id } = body;

    if (!ownerId && !owner_id) {
      return new Response(JSON.stringify({ error: 'MISSING_OWNER_ID' }), { status: 400 });
    }
    const targetOwnerId = owner_id || body.owner_id;

    // Fetch backup details
    const { data: backup } = await supabase
      .from('backups')
      .select('*')
      .eq('id', backup_id)
      .single();

    // Fetch user settings and email
    const { data: userRecord } = await supabase.auth.admin.getUserById(targetOwnerId);
    const userEmail = userRecord?.user?.email;

    const { data: backupSettings } = await supabase
      .from('backup_settings')
      .select('*')
      .eq('owner_id', targetOwnerId)
      .single();

    // Create a 7-day signed download URL if storage path exists
    let signedUrl: string | null = null;
    if (backup?.storage_path) {
      const { data: signedData } = await supabase.storage
        .from('backups')
        .createSignedUrl(backup.storage_path, 7 * 24 * 60 * 60);
      signedUrl = signedData?.signedUrl || null;
    }

    let title = 'نسخة احتياطية جديدة جاهزة للتحميل';
    let message = 'تم إنشاء نسخة احتياطية جديدة لقاعدة بيانات العملاء. يرجى تنزيلها وحفظها بأمان.';

    if (type === 'backup_reminder') {
      title = 'تذكير: لديك نسخة احتياطية لم يتم تنزيلها';
      message = 'مر أكثر من 20 ساعة على إنشاء النسخة الاحتياطية دون تنزيلها على جهازك.';
    } else if (type === 'backup_failed') {
      title = 'فشل إنشاء النسخة الاحتياطية';
      message = 'حدث خطأ أثناء محاولة إنشاء النسخة الاحتياطية المجدولة.';
    }

    // 1. Send Email via Resend if enabled
    if (backupSettings?.notify_email && userEmail && RESEND_API_KEY) {
      const emailHtml = `
        <div dir="rtl" style="font-family: sans-serif; padding: 20px; line-height: 1.6;">
          <h2>${title}</h2>
          <p>${message}</p>
          ${
            signedUrl
              ? `<div style="margin: 20px 0;"><a href="${signedUrl}" style="background: #2563eb; color: #fff; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: bold;">تحميل النسخة الاحتياطية الآن</a></div><p style="font-size: 12px; color: #666;">الرابط صالح لمدة 7 أيام.</p>`
              : ''
          }
        </div>
      `;

      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Scope CRM <backups@scope-crm.app>',
          to: userEmail,
          subject: title,
          html: emailHtml,
        }),
      }).catch((e) => console.error('Failed to send email:', e));
    }

    // 2. Update backup last_notified_at
    if (backup_id) {
      await supabase
        .from('backups')
        .update({ last_notified_at: new Date().toISOString() })
        .eq('id', backup_id);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: errorMsg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
