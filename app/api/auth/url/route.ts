import { NextResponse } from 'next/server';
import { getAuthorizationUrl } from '@/lib/google';

export const dynamic = 'force-dynamic';

export async function GET() {
  const url = await getAuthorizationUrl();
  return NextResponse.json({ url });
}
