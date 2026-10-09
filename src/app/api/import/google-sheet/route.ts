import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const GOOGLE_SPREADSHEET_REGEX =
  /^https:\/\/(?:docs\.google\.com\/spreadsheets\/d\/)([a-zA-Z0-9-_]+)(?:\/.*)?$/;

const MAX_BYTES = 50 * 1024 * 1024; // 50MB

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Ignore in route handlers
            }
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }

    const body = await request.json();
    const url = typeof body?.url === 'string' ? body.url.trim() : '';

    const match = url.match(GOOGLE_SPREADSHEET_REGEX);
    if (!match || !match[1]) {
      return NextResponse.json(
        {
          error: 'INVALID_URL',
          message: 'رابط جدول Google غير صالح. يجب أن يبدأ بـ https://docs.google.com/spreadsheets/d/...',
        },
        { status: 400 }
      );
    }

    const spreadsheetId = match[1];
    let gid: string | null = null;
    try {
      const parsedUrl = new URL(url);
      gid = parsedUrl.searchParams.get('gid');
      if (!gid && parsedUrl.hash) {
        const hashMatch = parsedUrl.hash.match(/gid=([0-9]+)/);
        if (hashMatch) gid = hashMatch[1] ?? null;
      }
    } catch {
      // Ignore hash parse errors
    }

    // SSRF-safe URL
    const exportUrl = gid
      ? `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=xlsx&gid=${gid}`
      : `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=xlsx`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const res = await fetch(exportUrl, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': 'ScopeMiniCRM-Importer/1.0',
      },
    });

    clearTimeout(timeoutId);

    // Verify response domain didn't redirect to non-google or login page
    const finalUrl = res.url;
    if (
      !finalUrl.startsWith('https://docs.google.com') &&
      !finalUrl.startsWith('https://drive.google.com') &&
      !finalUrl.startsWith('https://googleusercontent.com')
    ) {
      return NextResponse.json(
        {
          error: 'UNAUTHORIZED_REDIRECT',
          message: 'تم إعادة توجيه الرابط إلى نطاق غير مصرح به',
        },
        { status: 400 }
      );
    }

    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('text/html') || res.status === 401 || res.status === 403) {
      return NextResponse.json(
        {
          error: 'NOT_PUBLIC',
          message:
            'ملف Google Sheet غير متاح للعامة. يرجى فتح الملف والضغط على "مشاركة" (Share) وجعل الوصول "أي شخص لديه الرابط: عارض" (Anyone with the link: Viewer).',
        },
        { status: 400 }
      );
    }

    if (!res.ok) {
      return NextResponse.json(
        {
          error: 'FETCH_FAILED',
          message: `فشل تنزيل ملف Google Sheet (كود الاستجابة: ${res.status})`,
        },
        { status: 400 }
      );
    }

    const arrayBuffer = await res.arrayBuffer();
    if (arrayBuffer.byteLength > MAX_BYTES) {
      return NextResponse.json(
        {
          error: 'FILE_TOO_LARGE',
          message: 'حجم ملف Google Sheet يتجاوز 50 ميجابايت',
        },
        { status: 400 }
      );
    }

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="google-sheet-${spreadsheetId}.xlsx"`,
      },
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      {
        error: 'INTERNAL_ERROR',
        message: `حدث خطأ أثناء جلب الملف: ${errorMsg}`,
      },
      { status: 500 }
    );
  }
}
