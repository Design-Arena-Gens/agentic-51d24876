import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getThreadById } from '@/lib/google';
import { draftReply } from '@/lib/ai';

export const dynamic = 'force-dynamic';

const schema = z.object({
  threadId: z.string().min(1),
  context: z.string().optional()
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 422 });
  }

  const email = await getThreadById(parsed.data.threadId);
  if (!email) {
    return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
  }

  const draft = await draftReply(email, parsed.data.context);
  return NextResponse.json({ draft });
}
