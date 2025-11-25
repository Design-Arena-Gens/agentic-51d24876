import { NextResponse } from 'next/server';
import { z } from 'zod';
import { buildReplyMessage, getAccountOrThrow, getThreadById, sendReply } from '@/lib/google';
import { extractAddress } from '@/utils/email';

export const dynamic = 'force-dynamic';

const schema = z.object({
  threadId: z.string().min(1),
  body: z.string().min(1),
  subject: z.string().min(1),
  to: z.string().min(1)
});

export async function POST(request: Request) {
  const payload = await request.json();
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 422 });
  }

  const account = await getAccountOrThrow();
  const thread = await getThreadById(parsed.data.threadId);
  const message = await buildReplyMessage({
    threadId: parsed.data.threadId,
    messageId: thread?.messageId,
    body: parsed.data.body,
    subject: parsed.data.subject,
    to: extractAddress(parsed.data.to),
    from: account.email
  });

  await sendReply(account, parsed.data.threadId, message);
  return NextResponse.json({ ok: true });
}
