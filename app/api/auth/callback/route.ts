import { NextResponse } from 'next/server';
import { exchangeCode } from '@/lib/google';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(new URL(`/?error=${encodeURIComponent(error)}`, request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/?error=missing_code', request.url));
  }

  try {
    await exchangeCode(code);
    return NextResponse.redirect(new URL('/dashboard', request.url));
  } catch (err) {
    const message = err instanceof Error ? err.message : 'oauth_failed';
    return NextResponse.redirect(new URL(`/?error=${encodeURIComponent(message)}`, request.url));
  }
}
