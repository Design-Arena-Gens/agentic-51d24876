import { NextResponse } from 'next/server';
import { listRecentEmailThreads } from '@/lib/google';

export const dynamic = 'force-dynamic';

export async function GET() {
  const threads = await listRecentEmailThreads(15);
  return NextResponse.json({ threads });
}
