import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { safeNext } from '@/lib/safe-next';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const rawNext = searchParams.get('next');
  const next = safeNext(rawNext ?? '/');
  const isDirect = searchParams.get('direct') === 'true';

  if (!code) {
    if (isDirect) {
      return NextResponse.redirect(`${origin}/login?error=missing_code`);
    }
    return NextResponse.json(
      { success: false, error: 'missing_code' },
      { status: 400 }
    );
  }

  try {
    const supabase = await createServerSupabase();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      if (isDirect) {
        return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
      }
      return NextResponse.json(
        {
          success: false,
          error: 'code_exchange_failed',
          message: error.message,
        },
        { status: 400 }
      );
    }

    if (isDirect) {
      return NextResponse.redirect(`${origin}${next}`);
    }

    return NextResponse.json({
      success: true,
      target: next,
      userId: data?.user?.id,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    if (isDirect) {
      return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
    }
    return NextResponse.json(
      { success: false, error: 'server_error', message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const code = body.code;
    const rawNext = body.next;
    const next = safeNext(rawNext ?? '/');

    if (!code) {
      return NextResponse.json(
        { success: false, error: 'missing_code' },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabase();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: 'code_exchange_failed',
          message: error.message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      target: next,
      userId: data?.user?.id,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: 'server_error', message },
      { status: 500 }
    );
  }
}
